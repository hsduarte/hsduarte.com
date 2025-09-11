import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import bootstrap from './src/main.server';

export function app() {
  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] || (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug')
    },
    trustProxy: true,
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID()
  });
  
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  // Optional dependencies (loaded dynamically to avoid build-time hard deps)
  const require = createRequire(import.meta.url);
  let Sentry: any = null;
  let PromClient: any = null;
  try { Sentry = require('@sentry/node'); } catch {}
  try { PromClient = require('prom-client'); } catch {}

  // Get country from CloudFlare headers or fallback to basic detection
  const getCountryFromRequest = (request: any): string => {
    // Handle local/private IPs
    const clientIp = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
                    request.headers['x-real-ip']?.toString() ||
                    request.ip || '';
                    
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || 
        clientIp.startsWith('10.') || clientIp.startsWith('172.16.') || clientIp === '' || clientIp === 'unknown') {
      return 'LOCAL';
    }
    
    // Try CloudFlare country header first (most reliable)
    const cfCountry = request.headers['cf-ipcountry']?.toString().toUpperCase();
    if (cfCountry && cfCountry !== 'XX') {
      return cfCountry;
    }
    
    // Try other common country headers
    const geoCountry = request.headers['x-country-code']?.toString().toUpperCase() ||
                      request.headers['x-geoip-country']?.toString().toUpperCase() ||
                      request.headers['x-forwarded-country']?.toString().toUpperCase();
    
    if (geoCountry) {
      return geoCountry;
    }
    
    // Fallback to unknown
    return 'UN';
  };

  // Sentry (optional): initialize if DSN is present and package available
  const sentryDsn = process.env['SENTRY_DSN'];
  if (sentryDsn && Sentry) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env['NODE_ENV'] || 'development',
      tracesSampleRate: 0.0 // adjust later if you add tracing
    });
  }

  // Prometheus metrics
  const register = PromClient ? new PromClient.Registry() : null;
  if (PromClient && register) {
    PromClient.collectDefaultMetrics({ register });
  }
  const httpRequestCounter = PromClient && register ? new PromClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status', 'client_ip', 'domain'],
    registers: [register]
  }) : null;
  const httpRequestDuration = PromClient && register ? new PromClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status', 'client_ip', 'domain'],
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    registers: [register]
  }) : null;
  const visitorMetrics = PromClient && register ? new PromClient.Counter({
    name: 'visitor_requests_total',
    help: 'Total number of visitor requests by IP and domain',
    labelNames: ['client_ip', 'domain', 'route', 'user_agent', 'country'],
    registers: [register]
  }) : null;

  // Ensure metrics are visible even before traffic: pre-register/seed series
  if (PromClient && register && httpRequestCounter && httpRequestDuration) {
    try {
      const getMetric = (register as any).getSingleMetric?.bind(register);
      if (getMetric && !getMetric('http_requests_total')) {
        (register as any).registerMetric?.(httpRequestCounter);
      }
      if (getMetric && !getMetric('http_request_duration_seconds')) {
        (register as any).registerMetric?.(httpRequestDuration);
      }
    } catch {}
    try {
      // Initialize common labelsets with zero so Prometheus discovers the metrics
      (httpRequestCounter as any).labels('GET', '/_health', '200', '127.0.0.1', 'localhost').inc(0);
      (httpRequestDuration as any).labels('GET', '/_health', '200', '127.0.0.1', 'localhost').observe(0);
      if (visitorMetrics) {
        (visitorMetrics as any).labels('127.0.0.1', 'localhost', '/_health', 'health-check', 'LOCAL').inc(0);
      }
    } catch {}
  }

  // Per-request timing + request-id propagation
  fastify.addHook('onRequest', async (request, reply) => {
    const reqId = (request.id as string) || randomUUID();
    reply.header('x-request-id', reqId);
    // Start timer for metrics
    (request as any)._start = process.hrtime.bigint();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    try {
      const start = (request as any)._start as bigint | undefined;
      
      // Get the actual URL path for route tracking
      let route: string;
      try {
        const urlPath = new URL(request.url, `http://${request.headers.host}`).pathname;
        // For SSR routes, always use the actual URL path instead of routeOptions
        route = urlPath;
      } catch {
        // Fallback to simpler parsing if URL constructor fails
        route = request.url.split('?')[0] || 'unknown';
      }
      
      // Extract client IP (handle proxied requests)
      const clientIp = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
                      request.headers['x-real-ip']?.toString() ||
                      request.ip ||
                      'unknown';
      
      // Extract domain from host header
      const domain = request.headers.host?.toString().split(':')[0] || 'unknown';
      
      const labels = {
        method: request.method,
        route: route || 'unknown',
        status: String(reply.statusCode),
        client_ip: clientIp,
        domain: domain
      } as const;
      
      httpRequestCounter?.inc(labels as any);
      
      if (start && httpRequestDuration) {
        const durationSec = Number((process.hrtime.bigint() - start)) / 1e9;
        httpRequestDuration.observe(labels as any, durationSec);
      }
      
      // Track visitor-specific metrics (exclude health checks, metrics endpoint, and static assets)
      const isStaticAsset = route?.match(/\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/);
      const isSystemEndpoint = route === '/_health' || route === '/metrics';
      
      if (visitorMetrics && !isStaticAsset && !isSystemEndpoint) {
        const userAgent = request.headers['user-agent']?.toString().slice(0, 50) || 'unknown';
        const country = getCountryFromRequest(request);
        visitorMetrics.inc({
          client_ip: clientIp,
          domain: domain,
          route: route || 'unknown',
          user_agent: userAgent,
          country: country
        });
      }
    } catch {}
  });

  // Optional plugins: helmet and compress (dynamically loaded)
  let Helmet: any = null;
  let Compress: any = null;
  try { Helmet = require('@fastify/helmet'); } catch {}
  try { Compress = require('@fastify/compress'); } catch {}
  if (Helmet) {
    // Security headers (basic). CSP off by default; enable with nonces later
    fastify.register(Helmet, { contentSecurityPolicy: false });
  }
  if (Compress) {
    // Compression (brotli + gzip)
    fastify.register(Compress, { global: true, encodings: ['br', 'gzip'] });
  }

  // Private health endpoint for container and external monitors only
  fastify.get('/_health', async (request, reply) => {
    // Only allow health checks from localhost or private networks
    const clientIp = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
                    request.headers['x-real-ip']?.toString() ||
                    request.ip || '';
    
    const isPrivateNetwork = clientIp === '127.0.0.1' || 
                            clientIp === '::1' ||
                            clientIp.startsWith('10.') ||
                            clientIp.startsWith('192.168.') ||
                            clientIp.startsWith('172.16.') ||
                            clientIp === '';
    
    if (!isPrivateNetwork) {
      return reply.code(404).type('text/plain').send('Not Found');
    }
    
    return reply.code(200).type('text/plain').send('ok');
  });

  // Metrics endpoint (Prometheus)
  fastify.get('/metrics', async (_request, reply) => {
    if (!(register && PromClient)) {
      return reply.code(503).type('text/plain').send('metrics disabled');
    }
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });

  // Secure analytics route - only allow from private networks
  fastify.get('/analytics*', async (request, reply) => {
    const clientIp = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
                    request.headers['x-real-ip']?.toString() ||
                    request.ip || '';
    
    const isPrivateNetwork = clientIp === '127.0.0.1' || 
                            clientIp === '::1' ||
                            clientIp.startsWith('10.') ||
                            clientIp.startsWith('192.168.') ||
                            clientIp.startsWith('172.16.') ||
                            clientIp === '';
    
    if (!isPrivateNetwork) {
      return reply.code(404).type('text/plain').send('Not Found');
    }
    
    // Continue to Angular SSR for authorized users
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const { url, headers } = request.raw;
    const fullUrl = `${protocol}://${headers?.host}${url}`;
    
    try {
      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: fullUrl,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      });
      
      reply.type('text/html').send(html);
    } catch (err) {
      reply.status(500).send('Internal Server Error');
      fastify.log.error({ err }, 'Unhandled error while rendering analytics');
      if (sentryDsn && Sentry) {
        Sentry.captureException(err, {
          tags: { where: 'analytics' },
          extra: { url: fullUrl, reqId: String(request.id) }
        });
      }
    }
  });

  // Register static file serving
  fastify.register(fastifyStatic, {
    root: browserDistFolder,
    prefix: '/',
    setHeaders: (res, path) => {
      if (path.match(/\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  });

  // Handle all routes with Angular SSR
  fastify.setNotFoundHandler(async (request, reply) => {
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const { url, headers } = request.raw;
    const fullUrl = `${protocol}://${headers?.host}${url}`;
    
    try {
      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: fullUrl,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      });
      
      reply.type('text/html').send(html);
    } catch (err) {
      reply.status(500).send('Internal Server Error');
      fastify.log.error({ err }, 'Unhandled error while rendering');
      if (sentryDsn && Sentry) {
        Sentry.captureException(err, {
          tags: { where: 'ssr' },
          extra: { url: fullUrl, reqId: String(request.id) }
        });
      }
    }
  });

  // Catch-all error handler to ensure reporting
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ err: error }, 'Unhandled error');
    if (sentryDsn && Sentry) {
      Sentry.captureException(error, {
        tags: { where: 'fastify' },
        extra: { route: (request as any).routeOptions?.url, reqId: String(request.id) }
      });
    }
    reply.status(500).send('Internal Server Error');
  });

  return fastify;
}

function run(): void {
  const port = parseInt(process.env['PORT'] || '4000');
  const host = process.env['HOST'] || '0.0.0.0';

  const server = app();
  
  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    console.log(`Fastify server listening on http://${host}:${port}`);
  });
}

run();

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
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
    labelNames: ['method', 'route', 'status'],
    registers: [register]
  }) : null;
  const httpRequestDuration = PromClient && register ? new PromClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    registers: [register]
  }) : null;

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
      const route = (request as any).routeOptions?.url || request.url;
      const labels = {
        method: request.method,
        route: route || 'unknown',
        status: String(reply.statusCode)
      } as const;
      httpRequestCounter?.inc(labels as any);
      if (start && httpRequestDuration) {
        const durationSec = Number((process.hrtime.bigint() - start)) / 1e9;
        httpRequestDuration.observe(labels as any, durationSec);
      }
    } catch {}
  });

  // Security headers (basic). CSP off by default to avoid blocking inline styles/scripts; can be enabled later with nonces.
  fastify.register(fastifyHelmet, { contentSecurityPolicy: false });

  // Compression (brotli + gzip)
  fastify.register(fastifyCompress, { global: true, encodings: ['br', 'gzip'] });

  // Lightweight health endpoint for container and external monitors
  fastify.get('/_health', async (_request, reply) => {
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

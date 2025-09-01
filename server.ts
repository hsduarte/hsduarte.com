import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

export function app() {
  const fastify = Fastify({
    logger: process.env['NODE_ENV'] !== 'production'
  });
  
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

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
      fastify.log.error(err);
    }
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

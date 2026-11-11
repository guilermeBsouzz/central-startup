import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { FastifyInstance } from 'fastify';

const clientRoot = new URL('../client/', import.meta.url);
const vendorRoot = new URL('../../node_modules/three/build/', import.meta.url);

// Explicit routes prevent repository files and local data from being published.
const files: Record<string, URL> = {
  '/': new URL('pages/journey.html', clientRoot),
  '/index.html': new URL('pages/journey.html', clientRoot),
  '/journey.html': new URL('pages/journey.html', clientRoot),
  '/jornal': new URL('pages/workspace.html', clientRoot),
  '/workspace.js': new URL('scripts/workspace.js', clientRoot),
  '/personality.js': new URL('scripts/personality.js', clientRoot),
  '/voice.js': new URL('scripts/voice.js', clientRoot),
  '/journey.js': new URL('scripts/journey.js', clientRoot),
  '/orbit-scene.js': new URL('scripts/orbit-scene.js', clientRoot),
  '/arrival.js': new URL('scripts/arrival.js', clientRoot),
  '/workspace.css': new URL('styles/workspace.css', clientRoot),
  '/expressive.css': new URL('styles/expressive.css', clientRoot),
  '/journey.css': new URL('styles/journey.css', clientRoot),
  '/studio.css': new URL('styles/studio.css', clientRoot),
  '/favicon.svg': new URL('favicon.svg', clientRoot),
  '/assets/volta-symbol.svg': new URL('assets/volta-symbol.svg', clientRoot),
  '/assets/surface-grain.svg': new URL('assets/surface-grain.svg', clientRoot),
  '/vendor/three.module.js': new URL('three.module.js', vendorRoot),
  '/vendor/three.core.js': new URL('three.core.js', vendorRoot),
};

for (const font of ['space-grotesk', 'manrope']) {
  for (const weight of [400, 500, 600, 700]) {
    const path = `assets/fonts/${font}-${weight}.ttf`;
    files[`/${path}`] = new URL(path, clientRoot);
  }
}

for (const asset of [
  'pesquisa-cinco-forcas.png',
  'referencia-pet.jpg',
  'referencia-lata.jpg',
  'central-prototipo.png',
  'CREDITOS.md',
]) {
  files[`/assets/${asset}`] = new URL(`assets/${asset}`, clientRoot);
}

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.md': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
};

function requiresSession(route: string): boolean {
  if (['/', '/index.html', '/journey.html'].includes(route)) return true;
  if (!route.startsWith('/assets/')) return false;
  return ![
    '/assets/volta-symbol.svg',
    '/assets/surface-grain.svg',
  ].includes(route) && !route.startsWith('/assets/fonts/');
}

export function registerStaticRoutes(app: FastifyInstance, preview: boolean): void {
  app.get('/jornal/', async (_, reply) => reply.redirect('/jornal', 308));

  for (const [route, file] of Object.entries(files)) {
    app.get(route, async (request, reply) => {
      // Private repository artwork retains the production session requirement.
      if (!preview && requiresSession(route) && !request.user) {
        return reply.redirect('/auth/login');
      }

      const content = await readFile(file);
      return reply
        .header('Cache-Control', 'no-store')
        .type(contentTypes[extname(file.pathname)] || 'application/octet-stream')
        .send(content);
    });
  }
}

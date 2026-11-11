import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { openDatabase } from '../../src/server/database/client.mts';
import { buildApp } from '../../src/server/app.mts';

let db, app;
before(async () => {
  db = await openDatabase({ preview: true, dataDir: ':memory:' });
  app = await buildApp({ db, preview: true, rateMax: 10000 });
  await app.ready();
});
after(async () => {
  await app?.close();
  await db?.close();
});

test('entry pages and all linked local resources remain available after relocation', async () => {
  const pending = ['/', '/jornal'];
  const visited = new Set();
  const types = new Set();

  while (pending.length) {
    const route = pending.shift();
    if (visited.has(route)) continue;
    visited.add(route);
    const response = await app.inject(route);
    assert.equal(response.statusCode, 200, route + ': ' + response.body.slice(0, 150));
    assert.equal(response.headers['cache-control'], 'no-store', route);
    const type = response.headers['content-type'];
    types.add(type.split(';')[0]);

    let references = [];
    if (type.includes('text/html')) {
      references = [...response.body.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
    } else if (type.includes('text/css')) {
      references = [...response.body.matchAll(/url\(["']?([^\s)'";]+)["']?\)/g)].map(match => match[1]);
    }
    for (const reference of references) {
      const url = new URL(reference, 'http://volta.test' + route);
      if (url.origin !== 'http://volta.test' || reference.startsWith('#')) continue;
      pending.push(url.pathname);
    }
  }

  assert.ok(visited.has('/workspace.js'));
  assert.ok(visited.has('/journey.js'));
  assert.ok(types.has('text/css'));
  assert.ok(types.has('font/ttf'));
  assert.ok(types.has('image/png'));
});

test('compatibility URLs keep their pages, vendor modules and redirects', async () => {
  const home = await app.inject('/');
  for (const route of ['/index.html', '/journey.html']) {
    const response = await app.inject(route);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, home.body);
  }
  for (const route of ['/expressive.css', '/vendor/three.module.js', '/vendor/three.core.js', '/assets/CREDITOS.md']) {
    assert.equal((await app.inject(route)).statusCode, 200, route);
  }
  const redirect = await app.inject('/jornal/');
  assert.equal(redirect.statusCode, 308);
  assert.equal(redirect.headers.location, '/jornal');
});

test('static resolution is independent of the process working directory', async () => {
  const previous = process.cwd();
  try {
    process.chdir(tmpdir());
    for (const route of ['/', '/workspace.js', '/assets/volta-symbol.svg', '/vendor/three.module.js']) {
      assert.equal((await app.inject(route)).statusCode, 200, route);
    }
  } finally {
    process.chdir(previous);
  }
});

test('repository internals and archived prototypes stay outside the static allowlist', async () => {
  for (const route of [
    '/.env', '/.data/demo-preview-v1.json', '/package.json', '/server.cjs',
    '/src/server/database/schema.sql', '/docs/OPERACAO.md',
    '/archive/prototype-v0.2/index.html', '/artifacts/qa/results.json',
    '/public/pages/workspace.html', '/src/client/pages/workspace.html', '/styles/studio.css',
    '/assets/../package.json', '/assets/%2e%2e/package.json',
  ]) {
    assert.equal((await app.inject(route)).statusCode, 404, route);
  }
});

test('production still requires a session for entry pages and private artwork', async () => {
  const production = await buildApp({
    db: { ...db, kind: 'postgres' },
    preview: false,
    origin: 'https://volta.test',
    oidcConfig: {},
  });
  try {
    for (const route of ['/', '/index.html', '/journey.html', '/assets/central-prototipo.png', '/assets/CREDITOS.md']) {
      const response = await production.inject(route);
      assert.equal(response.statusCode, 302, route);
      assert.equal(response.headers.location, '/auth/login', route);
    }
    for (const route of ['/jornal', '/assets/volta-symbol.svg', '/assets/fonts/manrope-400.ttf']) {
      assert.equal((await production.inject(route)).statusCode, 200, route);
    }
  } finally {
    await production.close();
  }
});

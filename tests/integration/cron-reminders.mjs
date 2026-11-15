import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../../src/server/database/client.mts';
import {buildApp} from '../../src/server/app.mts';

// A rota /jobs/reminders existe porque, na hospedagem sem servidor, o processo morre
// a cada requisição: quem marca a hora dos lembretes é o agendador da Vercel.
let db, preview;
const secret = 'segredo-de-teste-para-o-agendador';
async function production() {
  return buildApp({db: {...db, kind: 'postgres'}, preview: false, origin: 'https://volta.test', oidcConfig: {}});
}
before(async () => {
  db = await openDatabase({preview: true, dataDir: ':memory:'});
  preview = await buildApp({db, preview: true, origin: 'http://127.0.0.1:4175'});
  await preview.ready();
});
after(async () => {
  await preview?.close();
  await db?.close();
});

test('a rota dos lembretes não existe na prévia nem sem CRON_SECRET', async () => {
  const previous = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const app = await production();
  try {
    assert.equal((await preview.inject('/jobs/reminders')).statusCode, 404);
    assert.equal((await app.inject('/jobs/reminders')).statusCode, 404);
    process.env.CRON_SECRET = secret;
    assert.equal((await preview.inject('/jobs/reminders')).statusCode, 404);
  } finally {
    await app.close();
    if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous;
  }
});

test('o agendador precisa do segredo exato, e a chamada válida limpa sessões vencidas', async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = secret;
  const app = await production();
  try {
    assert.equal((await app.inject('/jobs/reminders')).statusCode, 403);
    assert.equal((await app.inject({url: '/jobs/reminders', headers: {authorization: 'Bearer errado'}})).statusCode, 403);
    // Mesmo comprimento do segredo certo: a comparação não pode vazar pelo tamanho.
    const sameLength = 'Bearer ' + 'x'.repeat(secret.length);
    assert.equal((await app.inject({url: '/jobs/reminders', headers: {authorization: sameLength}})).statusCode, 403);

    await db.query("INSERT INTO sessions(token_hash,member_id,csrf_token,expires_at) VALUES('vencida','guilherme','csrf',now()-interval '1 day')");
    const response = await app.inject({url: '/jobs/reminders', headers: {authorization: 'Bearer ' + secret}});
    assert.equal(response.statusCode, 200, response.body);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(typeof body.inserted, 'number');
    assert.equal((await db.query("SELECT 1 FROM sessions WHERE token_hash='vencida'")).rows.length, 0);
    assert.equal(response.headers['cache-control'], undefined, 'rota fora de /api/: sem no-store imposto');
  } finally {
    await app.close();
    if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous;
  }
});

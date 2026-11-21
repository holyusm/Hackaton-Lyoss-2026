// node --test server/*.test.js: GET /api/simulador con el servidor real (#88).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('GET /api/simulador: perfil por defecto, errores 400', async (t) => {
  const puerto = 3700 + (process.pid % 90);
  const srv = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: puerto, REPORTES_PATH: join(tmpdir(), `simulador-test-${process.pid}.json`) },
  });
  t.after(() => { srv.kill(); rmSync(join(tmpdir(), `simulador-test-${process.pid}.json`), { force: true }); });
  await new Promise((ok) => srv.stdout.once('data', ok));
  const api = `http://localhost:${puerto}/api/simulador`;

  const r = await fetch(api);
  assert.equal(r.status, 200);
  const s = await r.json();
  assert.equal(s.perfil, 'silla_ruedas');
  assert.equal(s.con_obras, null);
  const n = s.zonas.length;
  assert.equal(s.hoy.trayectos_evaluados, n * (n - 1));

  assert.equal((await fetch(`${api}?perfil=todos`)).status, 200);
  assert.equal((await fetch(`${api}?perfil=nada`)).status, 400);
  assert.equal((await fetch(`${api}?obras=nada`)).status, 400);
  assert.equal((await fetch(`${api}?obras=rampa-patio-biblioteca&obras=rampa-patio-biblioteca`)).status, 200);
});

// node --test server/*.test.js: GET /api/simulador con el servidor real (#88).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('GET /api/simulador: perfil por defecto, errores 400', async (t) => {
  const puerto = 3700 + (process.pid % 90);
  const srv = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: puerto, REPORTES_PATH: join(tmpdir(), `simulador-test-${process.pid}.json`) },
  });
  t.after(() => srv.kill());
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

  // Hallazgo #166: obras repetidas u objetos no deben dar 500.
  const a = 'rampa-patio-biblioteca';
  const b = 'piso-liso-camino-biblioteca';
  const coma = await fetch(`${api}?obras=${a},${b}`);
  assert.equal(coma.status, 200);
  const repetido = await fetch(`${api}?obras=${a}&obras=${b}`);
  assert.equal(repetido.status, 200);
  assert.deepEqual(await repetido.json(), await coma.json());
  assert.equal((await fetch(`${api}?obras=${a}&obras=${a}`)).status, 200);

  // qs (Express 4) convierte obras[0]=a en ['a'], un Array de strings: es válido.
  assert.equal((await fetch(`${api}?obras[0]=${a}`)).status, 200);

  for (const q of [`obras[x]=${a}`, `obras[x][y]=${a}`, `obras[0][y]=${a}`, `perfil[0]=todos`, `perfil[x]=todos`, `perfil=todos&perfil=todos`]) {
    const mal = await fetch(`${api}?${q}`);
    assert.equal(mal.status, 400, q);
    assert.equal(typeof (await mal.json()).error, 'string', q);
  }
});

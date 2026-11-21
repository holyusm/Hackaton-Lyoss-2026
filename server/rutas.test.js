// node --test server/*.test.js — levanta el servidor real y verifica que un reporte bloquea la ruta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('reportar el ascensor deja sin ruta a silla de ruedas', async (t) => {
  const puerto = 3900 + (process.pid % 90);
  const srv = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: puerto, REPORTES_PATH: join(tmpdir(), `rutas-test-${process.pid}.json`) },
  });
  t.after(() => srv.kill());
  await new Promise((ok) => srv.stdout.once('data', ok));
  const api = `http://localhost:${puerto}/api`;
  const ruta = () => fetch(`${api}/ruta?desde=entrada-principal&hasta=sala-a201&perfil=silla_ruedas`).then((r) => r.json());

  assert.equal((await ruta()).ok, true);
  const r = await fetch(`${api}/reportes`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tipo: 'ascensor_fuera_servicio', nodo_id: 'ascensor-a', descripcion: 'Detenido' }),
  }).then((r) => r.json());
  assert.equal((await ruta()).ok, false);
  assert.equal((await fetch(`${api}/comparar?desde=entrada-principal&hasta=sala-a201`).then((r) => r.json())).estandar.ok, true);

  await fetch(`${api}/reportes/${r.id}/resolver`, { method: 'POST' });
  assert.equal((await ruta()).ok, true);
  assert.equal((await fetch(`${api}/ruta?desde=x`)).status, 400);
});

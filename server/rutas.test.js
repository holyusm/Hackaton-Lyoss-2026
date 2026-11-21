// node --test server/*.test.js — levanta el servidor real y verifica que un reporte bloquea la ruta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('reportar el ascensor recalcula por el Edificio B; con la pasarela también reportada no hay ruta', async (t) => {
  const puerto = 3900 + (process.pid % 90);
  const srv = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: puerto, REPORTES_PATH: join(tmpdir(), `rutas-test-${process.pid}.json`) },
  });
  t.after(() => srv.kill());
  await new Promise((ok) => srv.stdout.once('data', ok));
  const api = `http://localhost:${puerto}/api`;
  const ruta = () => fetch(`${api}/ruta?desde=entrada-principal&hasta=sala-a201&perfil=silla_ruedas`).then((r) => r.json());
  const reportar = (nodo_id, descripcion) => fetch(`${api}/reportes`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tipo: 'ascensor_fuera_servicio', nodo_id, descripcion }),
  }).then((r) => r.json());
  const resolver = (id) => fetch(`${api}/reportes/${id}/resolver`, { method: 'POST' });

  const normal = await ruta();
  assert.equal(normal.ok, true);
  assert.ok(normal.nodos.includes('ascensor-a'));

  // 1. Con solo el ascensor reportado, la silla de ruedas sigue teniendo ruta, por el Edificio B.
  const ascensor = await reportar('ascensor-a', 'Detenido');
  const porB = await ruta();
  assert.equal(porB.ok, true);
  assert.ok(porB.nodos.includes('edificio-b'));
  assert.equal(porB.escalones, 0);
  assert.equal(porB.metros - normal.metros, 120);

  // 2. Con la pasarela también reportada, no hay ruta accesible; el perfil estándar sigue llegando.
  const pasarela = await reportar('pasarela-b-a', 'Cerrada');
  assert.equal((await ruta()).ok, false);
  assert.equal((await fetch(`${api}/comparar?desde=entrada-principal&hasta=sala-a201`).then((r) => r.json())).estandar.ok, true);

  // 3. Al resolver ambos vuelve la ruta original por el ascensor.
  await resolver(pasarela.id);
  assert.equal((await ruta()).ok, true);
  await resolver(ascensor.id);
  assert.deepEqual((await ruta()).tramos, normal.tramos);
  assert.equal((await fetch(`${api}/ruta?desde=x`)).status, 400);
  assert.equal((await fetch(`${api}/puntos/no-existe`)).status, 404);
});

// node --test server/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';

process.env.REPORTES_PATH = join(tmpdir(), `reportes-test-${process.pid}.json`);
const { rutasReportes, reportesActivos } = await import('./reportes.js');

const app = express().use(express.json()).use('/r', rutasReportes);
const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}/r`;
const post = (ruta, body) => fetch(base + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('ciclo de vida de un reporte', async () => {
  const ejemplos = (await (await fetch(base)).json()).length;
  assert.ok(ejemplos > 0, 'precarga ejemplos');

  assert.equal((await post('/', { tipo: 'meteorito', nodo_id: 'x', descripcion: 'a' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', descripcion: 'sin id' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', tramo_id: 't1', descripcion: 'dos ids' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'x', duracion_min: 0 })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'no-existe', descripcion: 'x' })).status, 400);

  const r = await post('/', { tipo: 'piso_mojado', nodo_id: 'ascensor-a', descripcion: ' Charco ', duracion_min: 30 });
  assert.equal(r.status, 201);
  const creado = await r.json();
  assert.equal(creado.descripcion, 'Charco');
  assert.equal(creado.resuelto, false);
  assert.ok(reportesActivos().some((x) => x.id === creado.id));

  const resuelto = await (await post(`/${creado.id}/resolver`)).json();
  assert.equal(resuelto.resuelto, true);
  assert.ok(!reportesActivos().some((x) => x.id === creado.id), 'resuelto ya no está activo');
  assert.equal((await post('/r999/resolver')).status, 404);

  servidor.closeAllConnections();
  servidor.close();
});

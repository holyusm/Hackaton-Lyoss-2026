// node --test server/*.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';

process.env.REPORTES_PATH = join(tmpdir(), `reportes-test-${process.pid}.json`);
const { rutasReportes, reportesActivos } = await import('./reportes.js');

const app = express().set('trust proxy', 1).use(express.json()).use('/r', rutasReportes);
const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}/r`;
const post = (ruta, body, ip = '10.0.0.1') => fetch(base + ruta, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  body: JSON.stringify(body),
});

after(() => {
  servidor.closeAllConnections();
  servidor.close();
});

test('ciclo de vida de un reporte', async () => {
  const ejemplos = (await (await fetch(base)).json()).length;
  assert.ok(ejemplos > 0, 'precarga ejemplos');

  assert.equal((await post('/', { tipo: 'meteorito', nodo_id: 'x', descripcion: 'a' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', descripcion: 'sin id' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', tramo_id: 't1', descripcion: 'dos ids' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'x', duracion_min: 0 })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'no-existe', descripcion: 'x' })).status, 400);
  assert.equal((await post('/', { tipo: 'otro', tramo_id: 't10', nodo_id: '', descripcion: 'id vacío' })).status, 400);

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

  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'larga', duracion_min: 241 })).status, 400);
  const otro = { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'spam' };
  for (let i = 1; i < 10; i++) assert.equal((await post('/', otro)).status, 201);
  assert.equal((await post('/', otro)).status, 429, 'tope por IP');
});

test('un reporte inválido no consume cupo', async () => {
  const ip = '10.0.0.2';
  const invalidoFormato = { tipo: 'meteorito', nodo_id: 'ascensor-a', descripcion: 'inválido' };
  const invalidoGrafo = { tipo: 'otro', nodo_id: 'no-existe', descripcion: 'nodo inexistente' };

  for (let i = 0; i < 6; i++) {
    assert.equal((await post('/', invalidoFormato, ip)).status, 400);
    assert.equal((await post('/', invalidoGrafo, ip)).status, 400);
  }

  const valido = { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'válido' };
  for (let i = 0; i < 10; i++) {
    assert.equal((await post('/', valido, ip)).status, 201, `envío válido ${i + 1} debe pasar`);
  }
  assert.equal((await post('/', valido, ip)).status, 429, '11° válido supera el tope');
  assert.equal((await post('/', invalidoGrafo, ip)).status, 400, 'inválido se rechaza al validar antes del cupo');
});

test('peticiones concurrentes no superan el tope por conexión', async () => {
  const ip = '10.0.0.3';
  const antes = reportesActivos().length;
  const total = 20;

  const respuestas = await Promise.all(
    Array.from({ length: total }, (_, i) => post('/', { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: `concurrente ${i}` }, ip)),
  );
  const estados = respuestas.map((r) => r.status);
  const creados = estados.filter((s) => s === 201).length;
  const limitados = estados.filter((s) => s === 429).length;

  assert.equal(creados, 10, 'no deben crearse más reportes que el tope por IP');
  assert.equal(limitados, total - 10, 'el resto de peticiones concurrentes deben recibir 429');
  assert.equal(reportesActivos().length, antes + 10, 'solo deben persistirse 10 reportes nuevos');
  assert.equal((await post('/', { tipo: 'otro', nodo_id: 'ascensor-a', descripcion: 'después del burst' }, ip)).status, 429, 'cupo agotado tras la ráfaga');
});

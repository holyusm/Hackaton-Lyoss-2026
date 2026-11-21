// node --test server/*.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { obtenerPunto } from './puntos.js';

const dir = await mkdtemp(join(tmpdir(), 'puntos-test-'));
let rutaActual = join(dir, 'puntos.json');
const errores = [];

const app = express();
app.get('/api/puntos/:id', obtenerPunto(async () => JSON.parse(await readFile(rutaActual, 'utf8'))));
app.use((err, req, res, next) => {
  errores.push(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'error interno' });
});

const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}/api/puntos`;

after(async () => {
  servidor.closeAllConnections();
  servidor.close();
  await rm(dir, { recursive: true, force: true });
});

test('devuelve un punto válido y 404 para uno inexistente', async () => {
  const p1 = {
    id: 'p1',
    nodo_id: 'entrada-principal',
    titulo: 'Entrada principal',
    texto_voz: 'Estás en la entrada principal.',
    indicaciones: [{ hacia: 'Ascensor A', texto: 'Avanza 40 metros sin escalones.' }],
  };
  rutaActual = join(dir, 'valido.json');
  await writeFile(rutaActual, JSON.stringify([p1]), 'utf8');

  const ok = await fetch(`${base}/p1`);
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), p1);

  const falta = await fetch(`${base}/no-existe`);
  assert.equal(falta.status, 404);
  const body = await falta.json();
  assert.equal(typeof body.error, 'string');
  assert.ok(body.error.includes('no-existe'));
});

test('devuelve 404 si puntos.json no existe', async () => {
  rutaActual = join(dir, 'ausente.json');
  const res = await fetch(`${base}/p1`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(typeof body.error, 'string');
});

test('pasa el error al middleware de Express si puntos.json tiene formato incorrecto', async () => {
  for (const [nombre, contenido] of [
    ['objeto.json', '{}'],
    ['nulo.json', 'null'],
    ['malformado.json', '{'],
  ]) {
    errores.length = 0;
    rutaActual = join(dir, nombre);
    await writeFile(rutaActual, contenido, 'utf8');

    const res = await fetch(`${base}/p1`);
    assert.equal(res.status, 500, `${nombre} debe responder 500`);
    const body = await res.json();
    assert.equal(typeof body.error, 'string', `${nombre} debe responder { error }`);
    assert.equal(errores.length, 1, `${nombre} debe delegar el error al middleware de Express`);
  }
});

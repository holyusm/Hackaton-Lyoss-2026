// node --test server/*.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { leerDatos } from './datos.js';
import { calcularRuta } from '../motor/ruta.js';

const archivoPrincipal = join(tmpdir(), `reportes-test-${process.pid}.json`);
process.env.REPORTES_PATH = archivoPrincipal;
const { rutasReportes, reportesActivos, crearReportes } = await import('./reportes.js');

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
  rmSync(archivoPrincipal, { force: true });
});

const grafoDosNodosT6 = {
  nodos: [
    { id: 'n1', nombre: 'Acceso A', tipo: 'entrada', lat: -33.034, lng: -71.595, edificio: 'A', piso: 0, descripcion: '' },
    { id: 'n2', nombre: 'Edificio B', tipo: 'edificio', lat: -33.035, lng: -71.596, edificio: 'B', piso: 0, descripcion: '' },
  ],
  tramos: [
    {
      id: 't6', desde: 'n1', hasta: 'n2', metros: 30, escalones: 0, pendiente: 'nula', rampa: true,
      ascensor_id: null, techado: false, superficie: 'lisa', minutos_medidos: 0.6, guia_tactil: true,
      notas: '', foto: null, sentido_unico: false,
    },
  ],
};

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

test('precarga ejemplos solo cuando el grafo tiene simulado === true', async (t) => {
  const sinArchivo = (sufijo) => join(tmpdir(), `reportes-precarga-${process.pid}-${sufijo}.json`);

  const sim = crearReportes({
    archivo: sinArchivo('simulado'),
    leerGrafoSync: () => ({ simulado: true, ...grafoDosNodosT6 }),
  });
  assert.ok(sim.reportesActivos().length > 0, 'grafo simulado debe precargar ejemplos');
  assert.ok(sim.reportesActivos().every((r) => r.ejemplo === true), 'ejemplos marcados con ejemplo: true');
  assert.ok(sim.reportesActivos().some((r) => r.tramo_id === 't6'));

  const real = crearReportes({
    archivo: sinArchivo('real'),
    leerGrafoSync: () => grafoDosNodosT6,
  });
  assert.deepEqual(real.reportesActivos(), [], 'grafo real no debe precargar ejemplos');

  const perfiles = await leerDatos('perfiles.json');
  const bloqueos = real.reportesActivos().map((r) => r.tramo_id || r.nodo_id);
  const ruta = calcularRuta(grafoDosNodosT6, perfiles, { desde: 'n1', hasta: 'n2', perfil: 'silla_ruedas', bloqueos });
  assert.equal(ruta.ok, true, 'ruta de silla de ruedas por t6 no queda bloqueada');
  assert.deepEqual(ruta.tramos, ['t6']);

  const sinGrafo = crearReportes({
    archivo: sinArchivo('sin-grafo'),
    leerGrafoSync: () => { throw new Error('ENOENT'); },
  });
  assert.deepEqual(sinGrafo.reportesActivos(), [], 'sin grafo arranca sin ejemplos');

  const falso = crearReportes({
    archivo: sinArchivo('falso'),
    leerGrafoSync: () => ({ simulado: false, ...grafoDosNodosT6 }),
  });
  assert.deepEqual(falso.reportesActivos(), [], 'simulado: false arranca sin ejemplos');

  const persistidoPath = sinArchivo('persistido');
  const expira = new Date(Date.now() + 60 * 60_000).toISOString();
  const creado = new Date().toISOString();
  const persistido = [
    {
      id: 'r1', tipo: 'obstaculo', tramo_id: 't6', nodo_id: null,
      descripcion: 'Andamio de ejemplo', creado, expira, resuelto: false, ejemplo: true,
    },
    {
      id: 'r7', tipo: 'piso_mojado', tramo_id: 't99', nodo_id: null,
      descripcion: 'Reporte real de usuario', creado, expira, resuelto: false,
    },
  ];
  writeFileSync(persistidoPath, JSON.stringify(persistido));
  t.after(() => rmSync(persistidoPath, { force: true }));

  const conReal = crearReportes({
    archivo: persistidoPath,
    leerGrafoSync: () => grafoDosNodosT6,
  });
  assert.deepEqual(conReal.reportesActivos().map((r) => r.id), ['r7'], 'en grafo real se descartan ejemplos persistidos');
  const rutaSinEjemplo = calcularRuta(grafoDosNodosT6, perfiles, {
    desde: 'n1', hasta: 'n2', perfil: 'silla_ruedas',
    bloqueos: conReal.reportesActivos().map((r) => r.tramo_id || r.nodo_id),
  });
  assert.equal(rutaSinEjemplo.ok, true, 'ruta de silla de ruedas por t6 no queda bloqueada por ejemplo persistido');
  assert.deepEqual(rutaSinEjemplo.tramos, ['t6']);

  const conSimulado = crearReportes({
    archivo: persistidoPath,
    leerGrafoSync: () => ({ simulado: true, ...grafoDosNodosT6 }),
  });
  assert.deepEqual(conSimulado.reportesActivos().map((r) => r.id), ['r1', 'r7'], 'en grafo simulado se conservan ambos');
});

test('migra archivo persistido de versión anterior sin marca ejemplo', (t) => {
  const legacyPath = join(tmpdir(), `reportes-legacy-${process.pid}.json`);
  const expira = new Date(Date.now() + 60 * 60_000).toISOString();
  const creado = new Date().toISOString();
  const persistidoAnterior = [
    {
      id: 'r1', tipo: 'obstaculo', tramo_id: 't6', nodo_id: null,
      descripcion: 'Andamio sobre los escalones del atajo a la biblioteca', creado, expira, resuelto: false,
    },
    {
      id: 'r2', tipo: 'piso_mojado', tramo_id: 't9', nodo_id: null,
      descripcion: 'Piso mojado en la rampa hacia el casino', creado, expira, resuelto: false,
    },
    {
      id: 'r3', tipo: 'obstaculo', tramo_id: 't6', nodo_id: null,
      descripcion: 'Corte temporal en t6 reportado por estudiante', creado, expira, resuelto: false,
    },
  ];
  writeFileSync(legacyPath, JSON.stringify(persistidoAnterior));
  t.after(() => rmSync(legacyPath, { force: true }));

  const conReal = crearReportes({
    archivo: legacyPath,
    leerGrafoSync: () => grafoDosNodosT6,
  });
  const activosReal = conReal.reportesActivos();
  assert.deepEqual(activosReal.map((r) => r.id), ['r3'], 'grafo real descarta ejemplos sin marca y conserva el reporte real en t6');
  assert.equal(activosReal[0].ejemplo, undefined, 'reporte real no se marca como ejemplo');

  const conSimulado = crearReportes({
    archivo: legacyPath,
    leerGrafoSync: () => ({ simulado: true, ...grafoDosNodosT6 }),
  });
  const activosSim = conSimulado.reportesActivos();
  assert.deepEqual(activosSim.map((r) => r.id), ['r1', 'r2', 'r3'], 'grafo simulado conserva los tres reportes');
  assert.equal(activosSim.find((r) => r.id === 'r1').ejemplo, true, 'primer ejemplo queda marcado con ejemplo: true');
  assert.equal(activosSim.find((r) => r.id === 'r2').ejemplo, true, 'segundo ejemplo queda marcado con ejemplo: true');
  assert.equal(activosSim.find((r) => r.id === 'r3').ejemplo, undefined, 'reporte real en t6 sigue sin marca ejemplo');
});

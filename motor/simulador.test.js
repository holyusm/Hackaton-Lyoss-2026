// node --test motor/*.test.js. Grafo chico escrito aquí para que no dependa del levantamiento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular, aplicarObras } from './simulador.js';

// Entrada (A) y Biblioteca (B) unidas por camino liso; la Sala (C) solo se alcanza desde B por una escalera.
const tramo = (id, desde, hasta, extra = {}) => ({
  id, desde, hasta, metros: 30, escalones: 0, pendiente: 'baja', rampa: false, ascensor_id: null, techado: false,
  superficie: 'lisa', minutos_medidos: 1, guia_tactil: true, notas: '', foto: null, sentido_unico: false, ...extra,
});
const GRAFO = {
  nodos: [
    { id: 'a', nombre: 'Entrada', tipo: 'entrada', lat: 0, lng: 0 },
    { id: 'b', nombre: 'Biblioteca', tipo: 'edificio', lat: 0, lng: 1 },
    { id: 'c', nombre: 'Sala C', tipo: 'sala', lat: 1, lng: 1 },
    { id: 'p', nombre: 'Patio', tipo: 'punto', lat: 1, lng: 0 },
  ],
  tramos: [
    tramo('t1', 'a', 'b'),
    tramo('t2', 'b', 'c', { escalones: 3 }),
    tramo('t3', 'a', 'p', { superficie: 'adoquin' }),
  ],
};
const PERFILES = [
  { id: 'estandar', nombre: 'Estándar', prohibido: {}, costos: {} },
  { id: 'silla_ruedas', nombre: 'Silla', prohibido: { escalones: true }, costos: {} },
  { id: 'movilidad_reducida', nombre: 'Movilidad', prohibido: {}, costos: { escalon: 15 } },
  { id: 'baja_vision', nombre: 'Visión', prohibido: {}, costos: {} },
];
const OBRAS = [
  { id: 'rampa-c', titulo: 'Rampa a la Sala C', tipo: 'rampa', costo_relativo: 'medio', perfiles_beneficiados: ['silla_ruedas'],
    cambios: [{ tramo_id: 't2', valores: { escalones: 0, rampa: true } }], tramos_nuevos: [], nodos_nuevos: [] },
  { id: 'nada', titulo: 'Techar el patio', tipo: 'techado', costo_relativo: 'bajo', perfiles_beneficiados: [],
    cambios: [{ tramo_id: 't3', valores: { techado: true } }], tramos_nuevos: [], nodos_nuevos: [] },
];

test('hoy: trayectos entre los 3 lugares (el patio no cuenta) y los 4 que tocan la sala tienen barrera', () => {
  const r = simular(GRAFO, PERFILES, OBRAS);
  assert.equal(r.perfil, 'silla_ruedas');
  assert.equal(r.hoy.trayectos_evaluados, 6);
  assert.equal(r.hoy.trayectos_con_barrera, 4);
  assert.equal(r.con_obras, null);
  assert.deepEqual(r.zonas.map((z) => [z.nodo_id, z.estado, z.trayectos_con_barrera]),
    [['a', 'con_barrera', 1], ['b', 'con_barrera', 1], ['c', 'con_barrera', 2]]);
});

test('obras: la rampa saca las 4 barreras, va primero y no expone sus cambios', () => {
  const r = simular(GRAFO, PERFILES, OBRAS);
  assert.deepEqual(r.obras.map((o) => [o.id, o.trayectos_sin_barrera]), [['rampa-c', 4], ['nada', 0]]);
  for (const campo of ['cambios', 'tramos_nuevos', 'nodos_nuevos']) assert.ok(!(campo in r.obras[0]));
  assert.equal(r.obras[0].titulo, 'Rampa a la Sala C');
});

test('con_obras: con la rampa no quedan barreras en silla ni en movilidad reducida', () => {
  const r = simular(GRAFO, PERFILES, OBRAS, { ids: ['rampa-c'] });
  assert.equal(r.con_obras.trayectos_con_barrera, 0);
  assert.ok(r.con_obras.trayectos_con_barrera < r.hoy.trayectos_con_barrera);
  assert.deepEqual(r.con_obras.trayectos_sin_barrera_por_perfil, { silla_ruedas: 4, movilidad_reducida: 4, baja_vision: 0 });
  assert.ok(r.zonas.every((z) => z.estado === 'accesible'));
});

test('movilidad reducida: los escalones son barrera aunque haya ruta', () => {
  const r = simular(GRAFO, PERFILES, OBRAS, { perfil: 'movilidad_reducida' });
  assert.equal(r.hoy.trayectos_con_barrera, 4);
  assert.equal(r.hoy.minutos_extra_prom, 0);
});

test('baja visión: un tramo sin guía táctil es barrera', () => {
  const sinGuia = structuredClone(GRAFO);
  sinGuia.tramos[0].guia_tactil = false;
  // t1 (a-b) sin guía: los 4 trayectos que pasan por la entrada; b<->c va solo por t2, que sí tiene.
  assert.equal(simular(sinGuia, PERFILES, OBRAS, { perfil: 'baja_vision' }).hoy.trayectos_con_barrera, 4);
  assert.equal(simular(GRAFO, PERFILES, OBRAS, { perfil: 'baja_vision' }).hoy.trayectos_con_barrera, 0);
});

test('estándar nunca tiene barreras; todos no da minutos', () => {
  assert.equal(simular(GRAFO, PERFILES, OBRAS, { perfil: 'estandar' }).hoy.trayectos_con_barrera, 0);
  const todos = simular(GRAFO, PERFILES, OBRAS, { perfil: 'todos', ids: ['rampa-c'] });
  assert.equal(todos.hoy.trayectos_con_barrera, 4);
  assert.equal(todos.hoy.minutos_extra_prom, null);
  assert.equal(todos.con_obras.minutos_extra_prom, null);
  assert.equal(todos.obras[0].minutos_ahorrados_prom, null);
  assert.ok(todos.zonas.every((z) => z.minutos_extra === null));
});

test('no muta el grafo ni las obras de entrada', () => {
  const grafo = structuredClone(GRAFO), obras = structuredClone(OBRAS);
  simular(grafo, PERFILES, obras, { perfil: 'todos', ids: ['rampa-c', 'nada'] });
  aplicarObras(grafo, obras);
  assert.deepEqual(grafo, GRAFO);
  assert.deepEqual(obras, OBRAS);
});

test('perfil u obra desconocidos lanzan error', () => {
  assert.throws(() => simular(GRAFO, PERFILES, OBRAS, { perfil: 'nada' }), /perfil desconocido/);
  assert.throws(() => simular(GRAFO, PERFILES, OBRAS, { ids: ['no-existe'] }), /obra desconocida/);
});

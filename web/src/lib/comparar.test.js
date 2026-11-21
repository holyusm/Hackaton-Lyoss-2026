import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compararPerfiles } from '../../../motor/ruta.js';
import { armarFilas, enumerar, fraseResumen, motivoSinRuta } from './comparar.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url)));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const sala = grafo.nodos.find((n) => n.id === 'sala-a201');
const comparar = (bloqueos = []) => compararPerfiles(grafo, perfiles, { desde: 'entrada-principal', hasta: 'sala-a201', bloqueos });

test('enumerar une con comas y "y"', () => {
  assert.equal(enumerar([]), '');
  assert.equal(enumerar(['a']), 'a');
  assert.equal(enumerar(['a', 'b', 'c']), 'a, b y c');
});

test('escena normal: 4 filas en orden, Estándar es la base y silla evita los escalones', () => {
  const filas = armarFilas(grafo, comparar());
  assert.deepEqual(filas.map((f) => f.id), ['estandar', 'silla_ruedas', 'movilidad_reducida', 'baja_vision']);
  const [base, silla] = filas;
  assert.deepEqual([base.difMetros, base.difMinutos, base.notaEscalones], ['Base', 'Base', 'Base']);
  assert.equal(silla.notaEscalones, `evita ${base.escalones - silla.escalones}`);
  assert.match(silla.difMetros, /^\+\d+ m$|^igual$/);
  assert.ok(silla.pasaPor.includes('Ascensor A'));
  assert.match(fraseResumen(filas, sala), /^En silla de ruedas este trayecto es \d+ m más largo y evita \d+ escalones\.$/);
});

test('ascensor y pasarela bloqueados: silla sin ruta y frase sinRuta', () => {
  const resultados = comparar(['ascensor-a', 'pasarela-b-a']);
  const filas = armarFilas(grafo, resultados);
  const silla = filas.find((f) => f.id === 'silla_ruedas');
  assert.equal(silla.ok, false);
  const minimo = Math.min(...filas.filter((f) => f.ok && f.id !== 'silla_ruedas').map((f) => f.escalones));
  assert.equal(fraseResumen(filas, sala),
    `En silla de ruedas hoy no hay ruta hacia la Sala A-201. Las rutas disponibles tienen al menos ${minimo} escalones.`);

  const consulta = { desde: "entrada-principal", hasta: "sala-a201", perfil: "silla_ruedas" };
  const barreras = [
    { tipo: 'ascensor_fuera_servicio', nodo_id: 'ascensor-a', tramo_id: null, creado: '2026-11-21T14:05:00Z' },
    { tipo: 'rampa_bloqueada', nodo_id: null, tramo_id: 't14', creado: '2026-11-21T14:10:00Z' },
  ];
  assert.equal(motivoSinRuta(barreras, grafo, resultados.silla_ruedas, consulta, perfiles),
    'El Ascensor A está fuera de servicio desde las 11:05 y la pasarela techada está bloqueada desde las 11:10.');
  assert.equal(motivoSinRuta([], grafo, resultados.silla_ruedas, consulta, perfiles), 'Sin ruta accesible para este perfil.');
  const conObstaculo = [{ tipo: 'obstaculo', tramo_id: 't10', nodo_id: null, creado: '2026-11-21T14:00:00Z' }, ...barreras];
  assert.equal(motivoSinRuta(conObstaculo, grafo, resultados.silla_ruedas, consulta, perfiles), motivoSinRuta(barreras, grafo, resultados.silla_ruedas, consulta, perfiles));
});

test('sin diferencias, la frase dice igual', () => {
  const r = { ok: true, metros: 50, minutos: 1, escalones: 0, nodos: ['a', 'b'], advertencias: [] };
  const g = { nodos: [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }], tramos: [] };
  const filas = armarFilas(g, { estandar: r, silla_ruedas: r });
  assert.equal(filas[1].difMetros, 'igual');
  assert.equal(fraseResumen(filas, null), 'Para silla de ruedas el trayecto es igual al Estándar.');
});

test('el corte de t8 se explica aunque haya un ascensor averiado en otro trayecto', () => {
  const consulta = { desde: 'biblioteca', hasta: 'bano-b', perfil: 'silla_ruedas' };
  const barreras = [
    { tramo_id: 't8', tipo: 'obstaculo', creado: '2026-11-21T12:00Z' },
    { nodo_id: 'ascensor-a', tipo: 'ascensor_fuera_servicio', creado: '2026-11-21T12:00Z' },
  ];
  const r = compararPerfiles(grafo, perfiles, { ...consulta, bloqueos: ['t8', 'ascensor-a'] });
  const motivo = motivoSinRuta(barreras, grafo, r.silla_ruedas, consulta, perfiles);
  assert.match(motivo, /obstáculo/);
  assert.doesNotMatch(motivo, /ascensor/i);
});

test('una bajada al patio se anuncia sin indicar que hay que subir', () => {
  const r = compararPerfiles(grafo, perfiles, { desde: 'edificio-a-p2', hasta: 'patio-central', bloqueos: ['ascensor-a', 't14'] });
  const frase = fraseResumen(armarFilas(grafo, r), grafo.nodos.find(n => n.id === 'patio-central'));
  assert.match(frase, /42 escalones/);
  assert.doesNotMatch(frase, /subir/);
});

test('fraseResumen usa singular con 1 escalón', () => {
  const fila = (id, metros, escalones) => ({ id, ok: true, metros, escalones });
  assert.equal(fraseResumen([fila('estandar', 100, 1), fila('silla_ruedas', 140, 0)], null),
    'En silla de ruedas este trayecto es 40 m más largo y evita 1 escalón.');
  assert.equal(fraseResumen([fila('estandar', 100, 1), fila('silla_ruedas', 100, 0)], null),
    'En silla de ruedas este trayecto evita 1 escalón.');
});

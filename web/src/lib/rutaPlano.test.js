import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta } from '../../../motor/ruta.js';
import { salasDe, buscarSalas, salaDeFeature, salasSinPoligono, marcasPiso, textoLugar } from './rutaPlano.js';

const leer = (r) => JSON.parse(readFileSync(new URL(r, import.meta.url), 'utf8'));
const grafo = leer('../../../data/campus.json');
const perfiles = leer('../../../data/perfiles.json');
const geo = leer('../plano/casa-central.geo.json');
const poligonosC2 = geo.features.filter((f) => f.properties.tipo === 'sala' && f.properties.nivel === '2' && f.geometry.type === 'Polygon');

test('salasDe devuelve las 30 salas y baños del C, piso 2, ordenadas', () => {
  const lista = salasDe(grafo, 'C', 2);
  assert.equal(lista.length, 30);
  assert.deepEqual(salasDe(grafo, 'C', 1), []);
  const nombres = lista.filter((n) => n.tipo === 'sala').map((n) => n.nombre);
  assert.deepEqual(nombres, [...nombres].sort((a, b) => a.localeCompare(b, 'es', { numeric: true })));
});

test('buscarSalas encuentra por nombre, por id y por departamento, sin tildes', () => {
  assert.ok(buscarSalas(grafo, 'c231').some((n) => n.id === 'sala-c231'));
  assert.ok(buscarSalas(grafo, 'SALA C20').length >= 2);
  assert.deepEqual(buscarSalas(grafo, ''), []);
  const con = { ...grafo, nodos: [...grafo.nodos, { id: 'sala-x', nombre: 'Laboratorio X', tipo: 'sala', edificio: 'C', piso: 2, lat: 0, lng: 0, departamento: 'Depto. de Informática' }] };
  assert.equal(buscarSalas(con, 'informatica')[0].id, 'sala-x');
  assert.ok(buscarSalas(grafo, 'sala', 3).length <= 3);
});

test('cada polígono con nombre del C2 corresponde a una sala del grafo, y los baños a un baño', () => {
  let con = 0;
  for (const f of poligonosC2) {
    const n = salaDeFeature(grafo, 'C', 2, f);
    if (f.properties.servicio === 'toilets') assert.equal(n?.tipo, 'bano');
    if (n) con += 1;
  }
  assert.equal(con, 30);
});

test('salasSinPoligono: las salas agregadas a mano sin polígono salen aparte', () => {
  assert.deepEqual(salasSinPoligono(grafo, 'C', 2, poligonosC2), []);
  const sola = { id: 'sala-c299', nombre: 'Sala C299', tipo: 'sala', edificio: 'C', piso: 2, lat: -33.0370, lng: -71.5953 };
  const g = { ...grafo, nodos: [...grafo.nodos, sola] };
  assert.deepEqual(salasSinPoligono(g, 'C', 2, poligonosC2).map((n) => n.id), ['sala-c299']);
});

test('marcasPiso: la ruta en silla a C231 tiene una marca de ascensor al piso 2; la estándar, de escalera', () => {
  const silla = calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'sala-c231', perfil: 'silla_ruedas' });
  const marcas = marcasPiso(grafo, silla);
  assert.equal(marcas.length, 1);
  assert.equal(marcas[0].texto, 'Ascensor al piso 2');
  const est = marcasPiso(grafo, calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'sala-c231', perfil: 'estandar' }));
  assert.equal(est[0].texto, 'Escalera al piso 2');
  assert.deepEqual(marcasPiso(grafo, { ok: false }), []);
  assert.deepEqual(marcasPiso(grafo, calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'casino', perfil: 'estandar' })), []);
});

test('textoLugar dice sala, edificio y piso', () => {
  assert.equal(textoLugar(grafo.nodos.find((n) => n.id === 'sala-c231')), 'Sala C231, Edificio C, piso 2');
  assert.equal(textoLugar(grafo.nodos.find((n) => n.id === 'entrada-principal')), 'Entrada principal');
});

test('salaDeFeature ignora los pasillos (líneas) del interior y no lanza', () => {
  const pasillo = geo.features.find((f) => f.properties.tipo === 'pasillo' && f.properties.nivel === '2');
  assert.ok(pasillo, 'el C tiene pasillos en el piso 2');
  assert.equal(salaDeFeature(grafo, 'C', 2, pasillo), null);
  const interiorC2 = geo.features.filter((f) => ['sala', 'pasillo'].includes(f.properties.tipo) && f.properties.nivel === '2');
  assert.deepEqual(salasSinPoligono(grafo, 'C', 2, interiorC2), []);
});

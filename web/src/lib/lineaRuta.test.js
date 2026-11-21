import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta } from '../../../motor/ruta.js';
import { armarRuta } from './pasos.js';
import { lineaRuta } from './lineaRuta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const posicion = (n) => [n.lat, n.lng];

const resolver = (desde, hasta, perfil = 'silla_ruedas') => calcularRuta(grafo, perfiles, { desde, hasta, perfil });
const linea = (res) => lineaRuta(grafo, res.tramos, res.nodos[0], posicion);

test('entrada-principal -> sala-a201 en silla: la función compartida da los mismos puntos que armarRuta, más que los nodos', () => {
  const res = resolver('entrada-principal', 'sala-a201');
  assert.equal(res.ok, true);
  const compartida = linea(res);
  const delMapa = armarRuta(grafo, res, { posicion }).coordenadas;
  assert.deepEqual(compartida, delMapa);
  assert.ok(compartida.length > res.nodos.length, `${compartida.length} puntos vs ${res.nodos.length} nodos`);
});

test('ida y vuelta (sala-a201 <-> entrada-principal) dan la misma línea invertida', () => {
  const ida = resolver('entrada-principal', 'sala-a201');
  const vuelta = resolver('sala-a201', 'entrada-principal');
  assert.equal(vuelta.ok, true);
  assert.deepEqual(linea(vuelta), [...linea(ida)].reverse());
  assert.deepEqual(armarRuta(grafo, vuelta, { posicion }).coordenadas, [...armarRuta(grafo, ida, { posicion }).coordenadas].reverse());
});

test('sin ruta o sin tramos la línea queda vacía', () => {
  assert.deepEqual(lineaRuta(grafo, [], 'entrada-principal', posicion), []);
});

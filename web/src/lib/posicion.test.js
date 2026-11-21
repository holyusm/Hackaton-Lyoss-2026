import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearPosicion } from './posicion.js';
import { armarRuta } from './pasos.js';
import { calcularRuta } from '../../../motor/ruta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');

test('la posición de un nodo es su [lat, lng]', () => {
  const { posicion } = crearPosicion(grafo);
  const n = grafo.nodos[0];
  assert.deepEqual(posicion(n), [n.lat, n.lng]);
});

test('sin plano, los límites rodean a todos los nodos', () => {
  const { bounds, conPlano } = crearPosicion(grafo);
  assert.equal(conPlano, false);
  const [[s, o], [n, e]] = bounds;
  for (const nodo of grafo.nodos) {
    assert.ok(nodo.lat > s && nodo.lat < n && nodo.lng > o && nodo.lng < e, `${nodo.id} fuera de los límites`);
  }
});

test('con los límites del plano usa esos', () => {
  const limites = [[-33.05, -71.63], [-33.04, -71.61]];
  const r = crearPosicion(grafo, { limites });
  assert.deepEqual(r.bounds, limites);
  assert.equal(r.conPlano, true);
});

test('armarRuta con posicion arma coordenadas y un punto por paso', () => {
  const { posicion } = crearPosicion(grafo);
  const res = calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'sala-a201', perfil: 'silla_ruedas' });
  const r = armarRuta(grafo, res, { posicion });
  assert.equal(r.coordenadas.length, res.nodos.length);
  assert.ok(r.pasos.every((p) => p.punto.length === 2 && p.punto.every(Number.isFinite)));
});

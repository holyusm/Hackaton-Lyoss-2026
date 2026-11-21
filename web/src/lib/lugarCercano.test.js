import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lugarCercano } from './lugarCercano.js';

const grafo = JSON.parse(readFileSync(new URL('../../../data/campus.json', import.meta.url), 'utf8'));

test('un punto sobre un lugar devuelve ese lugar', () => {
  for (const n of grafo.nodos) assert.equal(lugarCercano(grafo.nodos, [n.lat, n.lng]).id, n.id === 'edificio-a-p2' ? 'ascensor-a' : n.id);
});

test('un punto cerca de la Biblioteca devuelve la Biblioteca', () => {
  const b = grafo.nodos.find((n) => n.id === 'biblioteca');
  assert.equal(lugarCercano(grafo.nodos, [b.lat + 0.00002, b.lng - 0.00002]).id, 'biblioteca');
});

test('sin lugares devuelve null y se saltan los que no tienen coordenadas', () => {
  assert.equal(lugarCercano([], [0, 0]), null);
  assert.equal(lugarCercano([{ id: 'x' }, { id: 'y', lat: 1, lng: 1 }], [0, 0]).id, 'y');
});

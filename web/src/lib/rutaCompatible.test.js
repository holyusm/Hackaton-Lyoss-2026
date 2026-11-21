import assert from 'node:assert/strict';
import test from 'node:test';
import { rutaCompatible } from './rutaCompatible.js';

test('solo se muestran pasos que existen y conectan los nodos en el sentido solicitado', () => {
  const grafo = { nodos: [{ id: 'a' }, { id: 'b' }], tramos: [{ id: 't', desde: 'a', hasta: 'b', sentido_unico: true }] };
  const ruta = { ok: true, nodos: ['a', 'b'], tramos: ['t'] };
  assert.ok(rutaCompatible(grafo, ruta, 'a', 'b'));
  assert.equal(rutaCompatible(grafo, { ...ruta, tramos: ['viejo'] }, 'a', 'b'), false);
  assert.equal(rutaCompatible(grafo, { ...ruta, nodos: ['b', 'a'] }, 'b', 'a'), false);
  assert.equal(rutaCompatible(grafo, ruta, 'a', 'c'), false);
});

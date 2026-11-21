import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardarCache, leerCache, borrarCache } from './cache.js';

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test('guarda y lee la última respuesta con su hora', () => {
  const s = memoria();
  guardarCache('ruta', { metros: 75 }, 1000, s);
  const c = leerCache('ruta', s);
  assert.deepEqual(c.datos, { metros: 75 });
  assert.equal(c.hora.getTime(), 1000);
});

test('sin copia o con copia rota devuelve null', () => {
  const s = memoria();
  assert.equal(leerCache('nada', s), null);
  s.setItem('parejo:cache:rota', '{no es json');
  assert.equal(leerCache('rota', s), null);
});

test('borrar quita la copia', () => {
  const s = memoria();
  guardarCache('x', [1], 1, s);
  borrarCache('x', s);
  assert.equal(leerCache('x', s), null);
});

test('si el almacenamiento falla no lanza', () => {
  const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('cuota'); }, removeItem() { throw new Error('x'); } };
  assert.doesNotThrow(() => guardarCache('x', 1, 1, roto));
  assert.equal(leerCache('x', roto), null);
  assert.doesNotThrow(() => borrarCache('x', roto));
  assert.equal(leerCache('x', null), null);
});

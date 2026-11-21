import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paddingAjustado, ESPACIO_UTIL_MIN } from './paddingMapa.js';

test('hoja completa en móvil (704 / 696): no supera el alto y deja espacio útil positivo', () => {
  const p = paddingAjustado(704, 696);
  assert.ok(p.abajo >= 0 && p.arriba >= 0);
  assert.ok(704 - p.arriba - p.abajo >= ESPACIO_UTIL_MIN);
});

test('valores normales no cambian', () => {
  assert.deepEqual(paddingAjustado(704, 304), { arriba: 96, abajo: 344, lado: 40 });
  assert.deepEqual(paddingAjustado(900, 0, 1200), { arriba: 96, abajo: 40, lado: 40 });
});

test('contenedores muy bajos o inválidos nunca dan padding negativo', () => {
  for (const alto of [0, 30, 100, 176, 200, NaN, undefined, -50]) {
    const p = paddingAjustado(alto, 696);
    assert.ok(p.arriba >= 0 && p.abajo >= 0 && p.lado >= 0, `alto ${alto}`);
    assert.ok(Math.max(0, alto || 0) - p.arriba - p.abajo >= Math.min(ESPACIO_UTIL_MIN, Math.max(0, alto || 0)) - 1e-9, `alto ${alto}`);
  }
});

test('ancho muy estrecho reduce el padding lateral', () => {
  assert.ok(paddingAjustado(704, 304, 100).lado <= 10);
  assert.equal(paddingAjustado(704, 304, 0).lado, 0);
});

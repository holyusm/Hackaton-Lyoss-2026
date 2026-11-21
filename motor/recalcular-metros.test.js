import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recalcularGrafo } from './recalcular-metros.js';

const ejemplo = () => JSON.parse(readFileSync(new URL('../data/campus.json', import.meta.url)));
test('reserva las estimaciones para datos explícitamente simulados', () => {
  for (const simulado of [false, undefined]) assert.throws(() => recalcularGrafo({ ...ejemplo(), simulado }), /simulado/);
});
test('rechaza coordenadas ausentes y métricas inválidas que se conservarían', () => {
  const g = ejemplo();
  delete g.nodos[0].lat;
  assert.throws(() => recalcularGrafo(g), /Coordenadas/);
  const asc = ejemplo();
  asc.tramos.find(t => t.ascensor_id).minutos_medidos = null;
  assert.throws(() => recalcularGrafo(asc), /tiempo/);
});

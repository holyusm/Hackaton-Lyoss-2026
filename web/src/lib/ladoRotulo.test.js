import test from 'node:test';
import assert from 'node:assert/strict';
import { cajaRotulo, elegirLado } from './ladoRotulo.js';

const mapa = { ancho: 390, alto: 500 };
const pin = { x: 200, y: 250 };

test('sin obstáculos el rótulo va arriba, como siempre', () => {
  assert.equal(elegirLado(pin, 100, [], mapa), 'arriba');
});

test('si una etiqueta de barrera ocupa el lugar de arriba, pasa a la derecha', () => {
  const barrera = { x1: 150, x2: 250, y1: 170, y2: 198 };
  assert.equal(elegirLado(pin, 100, [barrera], mapa), 'derecha');
});

test('si arriba y la derecha están ocupados, usa la izquierda; luego abajo', () => {
  const arriba = cajaRotulo('arriba', pin, 100);
  const derecha = cajaRotulo('derecha', pin, 100);
  const izquierda = cajaRotulo('izquierda', pin, 100);
  assert.equal(elegirLado(pin, 100, [arriba, derecha], mapa), 'izquierda');
  assert.equal(elegirLado(pin, 100, [arriba, derecha, izquierda], mapa), 'abajo');
});

test('no elige un lado que se sale del mapa si hay otro que cabe', () => {
  const cerca = { x: 20, y: 250 };
  assert.equal(elegirLado(cerca, 100, [], mapa), 'derecha');
});

test('con todos ocupados devuelve el que menos choca', () => {
  const todos = ['arriba', 'derecha', 'izquierda', 'abajo'].map((l) => cajaRotulo(l, pin, 100));
  assert.ok(['arriba', 'derecha', 'izquierda', 'abajo'].includes(elegirLado(pin, 100, todos, mapa)));
});

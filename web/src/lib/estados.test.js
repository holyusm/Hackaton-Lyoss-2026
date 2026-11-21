import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoForzado, conHora } from './estados.js';

test('?estado= solo acepta los tres estados', () => {
  assert.equal(estadoForzado('?estado=carga'), 'carga');
  assert.equal(estadoForzado('?desde=a&estado=sinconexion'), 'sinconexion');
  assert.equal(estadoForzado('?estado=error'), 'error');
  assert.equal(estadoForzado('?estado=otro'), null);
  assert.equal(estadoForzado(''), null);
});

test('conHora pone la hora o quita la referencia si no hay', () => {
  const d = new Date(2026, 10, 21, 11, 42);
  assert.match(conHora('Ruta de las {hora}.', d), /^Ruta de las 11:42\.$/);
  assert.equal(conHora('Ruta de las {hora}.', null), 'Ruta.');
  assert.equal(conHora('Es la última ruta conocida, de las {hora}. Puede haber barreras nuevas.', null), 'Es la última ruta conocida. Puede haber barreras nuevas.');
});

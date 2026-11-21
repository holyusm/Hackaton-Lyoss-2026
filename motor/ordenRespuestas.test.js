import test from 'node:test';
import assert from 'node:assert/strict';
import { aceptarRespuesta } from '../web/src/lib/ordenRespuestas.js';

test('acepta respuestas en orden creciente y actualiza ultimaRespuesta', () => {
  const p1 = aceptarRespuesta(0, 1);
  assert.deepEqual(p1, { aceptar: true, ultimaRespuesta: 1 });

  const p2 = aceptarRespuesta(p1.ultimaRespuesta, 2);
  assert.deepEqual(p2, { aceptar: true, ultimaRespuesta: 2 });

  const p3 = aceptarRespuesta(p2.ultimaRespuesta, 3);
  assert.deepEqual(p3, { aceptar: true, ultimaRespuesta: 3 });
});

test('descarta una respuesta vieja que llega después de una más nueva', () => {
  const nueva = aceptarRespuesta(0, 2);
  assert.deepEqual(nueva, { aceptar: true, ultimaRespuesta: 2 });

  const vieja = aceptarRespuesta(nueva.ultimaRespuesta, 1);
  assert.deepEqual(vieja, { aceptar: false, ultimaRespuesta: 2 });
});

test('descarta una respuesta duplicada con el mismo número de secuencia', () => {
  const repetida = aceptarRespuesta(2, 2);
  assert.deepEqual(repetida, { aceptar: false, ultimaRespuesta: 2 });
});

test('en una secuencia desordenada solo acepta las respuestas más recientes', () => {
  let ultima = 0;
  const aceptadas = [];

  for (const llegada of [2, 1, 4, 3, 5]) {
    const paso = aceptarRespuesta(ultima, llegada);
    ultima = paso.ultimaRespuesta;
    if (paso.aceptar) aceptadas.push(llegada);
  }

  assert.deepEqual(aceptadas, [2, 4, 5]);
  assert.equal(ultima, 5);
});

test('descarta cualquier respuesta cuando la petición fue abortada al desmontar', () => {
  const paso = aceptarRespuesta(1, 2, true);
  assert.deepEqual(paso, { aceptar: false, ultimaRespuesta: 1 });
});

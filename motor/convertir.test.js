import test from 'node:test';
import assert from 'node:assert/strict';
import { convertir, num } from '../data/levantamiento/convertir.js';

const NODOS_CSV = [
  'id,nombre,tipo,lat,lng,edificio,piso,descripcion',
  'a,Nodo A,entrada,-33.0345,-71.5955,A,0,Origen',
  'b,Nodo B,edificio,-33.0348,-71.5952,B,0,Destino',
].join('\n');

function tramosCsv({ metros = '45.5', minutos = '1.2' } = {}) {
  return [
    'id,desde,hasta,metros,escalones,pendiente,rampa,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico',
    `t1,a,b,${metros},0,nula,no,,no,lisa,${minutos},no,,,no`,
  ].join('\n');
}

test('convertir acepta metros y minutos_medidos finitos válidos', () => {
  const res = convertir(NODOS_CSV, tramosCsv({ metros: '45.5', minutos: '1.2' }));
  assert.deepEqual(res.errores, []);
  assert.equal(res.tramos[0].metros, 45.5);
  assert.equal(res.tramos[0].minutos_medidos, 1.2);
});

for (const invalido of ['Infinity', '-Infinity', 'NaN']) {
  test(`convertir rechaza metros no finito (${invalido})`, () => {
    const res = convertir(NODOS_CSV, tramosCsv({ metros: invalido, minutos: '1.2' }));
    assert.equal(res.errores.length, 1);
    assert.match(res.errores[0], /metros/);
    assert.match(res.errores[0], new RegExp(invalido));
  });

  test(`convertir rechaza minutos_medidos no finito (${invalido})`, () => {
    const res = convertir(NODOS_CSV, tramosCsv({ metros: '30', minutos: invalido }));
    assert.equal(res.errores.length, 1);
    assert.match(res.errores[0], /minutos_medidos/);
    assert.match(res.errores[0], new RegExp(invalido));
  });
}

test('convertir rechaza tramo con metros y minutos_medidos en Infinity simultáneamente', () => {
  const res = convertir(NODOS_CSV, tramosCsv({ metros: 'Infinity', minutos: 'Infinity' }));
  assert.equal(res.errores.length, 2);
  assert.ok(res.errores.some((e) => e.includes('metros')));
  assert.ok(res.errores.some((e) => e.includes('minutos_medidos')));
});

test('num rechaza Infinity, -Infinity y NaN y acepta valores finitos', () => {
  for (const val of ['Infinity', '-Infinity', 'NaN', Infinity, -Infinity, NaN]) {
    const errores = [];
    const out = num(val, 'metros', 'tramo t1', { err: (m) => errores.push(m) });
    assert.equal(out, 0);
    assert.equal(errores.length, 1);
  }
  const erroresOk = [];
  assert.equal(num('12,5', 'minutos_medidos', 'tramo t1', { err: (m) => erroresOk.push(m) }), 12.5);
  assert.equal(num('0', 'metros', 'tramo t1', { err: (m) => erroresOk.push(m) }), 0);
  assert.deepEqual(erroresOk, []);
});

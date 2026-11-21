import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertir, num } from '../data/levantamiento/convertir.js';

const NODOS_CSV = [
  'id,nombre,tipo,lat,lng,edificio,piso,descripcion',
  'a,Nodo A,entrada,-33.0345,-71.5955,A,0,Origen',
  'b,Nodo B,edificio,-33.0348,-71.5952,B,0,Destino',
].join('\n');

function tramosCsv({ metros = '45.5', minutos = '1.2', ascensorId = '' } = {}) {
  return [
    'id,desde,hasta,metros,escalones,pendiente,rampa,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico',
    `t1,a,b,${metros},0,nula,no,${ascensorId},no,lisa,${minutos},no,,,no`,
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

test('convertir rechaza CSV vacíos o sin filas de datos', () => {
  const ambosVacios = convertir('', '');
  assert.equal(ambosVacios.errores.length, 2);
  assert.ok(ambosVacios.errores.some((e) => e.includes('nodos.csv')));
  assert.ok(ambosVacios.errores.some((e) => e.includes('tramos.csv')));

  const sinTramos = convertir(NODOS_CSV, '');
  assert.equal(sinTramos.errores.length, 1);
  assert.match(sinTramos.errores[0], /tramos\.csv/);

  const soloCabeceras = convertir(
    'id,nombre,tipo,lat,lng,edificio,piso,descripcion\n',
    'id,desde,hasta,metros,escalones,pendiente,rampa,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico\n',
  );
  assert.equal(soloCabeceras.errores.length, 2);
  assert.ok(soloCabeceras.errores.some((e) => e.includes('nodos.csv')));
  assert.ok(soloCabeceras.errores.some((e) => e.includes('tramos.csv')));
});

test('convertir.js --escribir con ambos CSV vacíos falla (exit 1) sin modificar campus.json', () => {
  const baseDir = mkdtempSync(join(tmpdir(), 'convertir-cli-'));
  try {
    const levDir = join(baseDir, 'levantamiento');
    mkdirSync(levDir, { recursive: true });
    writeFileSync(join(baseDir, 'package.json'), '{"type":"module"}\n');
    const campusOriginal = '{"sentinel":true}\n';
    const campusPath = join(baseDir, 'campus.json');
    writeFileSync(campusPath, campusOriginal);
    writeFileSync(join(levDir, 'nodos.csv'), '');
    writeFileSync(join(levDir, 'tramos.csv'), '');
    const scriptOriginal = fileURLToPath(new URL('../data/levantamiento/convertir.js', import.meta.url));
    const scriptTmp = join(levDir, 'convertir.js');
    copyFileSync(scriptOriginal, scriptTmp);

    const res = spawnSync(process.execPath, [scriptTmp, '--escribir'], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.equal(readFileSync(campusPath, 'utf8'), campusOriginal);
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
  }
});

test('convertir reporta columna faltante en tramos.csv (rampa) con error claro y sin excepción', () => {
  const tramosSinRampa = [
    'id,desde,hasta,metros,escalones,pendiente,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico',
    't1,a,b,45.5,0,nula,,no,lisa,1.2,no,,,no',
  ].join('\n');
  const res = convertir(NODOS_CSV, tramosSinRampa);
  assert.equal(res.errores.length, 1);
  assert.match(res.errores[0], /tramos\.csv/);
  assert.match(res.errores[0], /rampa/);
});

test('convertir reporta columna faltante en nodos.csv con error claro y sin excepción', () => {
  const nodosSinPiso = [
    'id,nombre,tipo,lat,lng,edificio,descripcion',
    'a,Nodo A,entrada,-33.0345,-71.5955,A,Origen',
    'b,Nodo B,edificio,-33.0348,-71.5952,B,Destino',
  ].join('\n');
  const res = convertir(nodosSinPiso, tramosCsv());
  assert.ok(res.errores.some((e) => e.includes('nodos.csv') && e.includes('piso')));
});

test('convertir emite exactamente un error cuando ascensor_id no existe', () => {
  const res = convertir(NODOS_CSV, tramosCsv({ ascensorId: 'asc-inexistente' }));
  assert.equal(res.errores.length, 1);
  assert.match(res.errores[0], /ascensor_id/);
  assert.match(res.errores[0], /no existe/);
});

test('convertir emite exactamente un error cuando ascensor_id apunta a un nodo que no es ascensor', () => {
  const res = convertir(NODOS_CSV, tramosCsv({ ascensorId: 'b' }));
  assert.equal(res.errores.length, 1);
  assert.match(res.errores[0], /ascensor_id/);
  assert.match(res.errores[0], /tipo ascensor/);
});

test('convertir acepta ascensor_id que apunta a un nodo tipo ascensor', () => {
  const nodosConAsc = [
    NODOS_CSV,
    'asc-a,Ascensor A,ascensor,-33.0346,-71.5954,A,0,Ascensor edificio A',
  ].join('\n');
  const res = convertir(nodosConAsc, tramosCsv({ ascensorId: 'asc-a' }));
  assert.deepEqual(res.errores, []);
  assert.equal(res.tramos[0].ascensor_id, 'asc-a');
});

test('convertir rechaza cabeceras duplicadas en tramos.csv (dos columnas escalones) y no produce tramos', () => {
  const tramosDuplicados = [
    'id,desde,hasta,metros,escalones,pendiente,rampa,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico,escalones',
    't1,a,b,45.5,42,nula,no,,no,lisa,1.2,no,,,no,0',
  ].join('\n');
  const res = convertir(NODOS_CSV, tramosDuplicados);
  assert.equal(res.errores.length, 1);
  assert.match(res.errores[0], /tramos\.csv/);
  assert.match(res.errores[0], /escalones/);
  assert.deepEqual(res.tramos, []);
});

test('convertir rechaza cabeceras duplicadas en nodos.csv tras quitar BOM y espacios', () => {
  const nodosDuplicados = [
    '\uFEFFid,nombre,tipo,lat,lng,edificio,piso,descripcion, id ',
    'a,Nodo A,entrada,-33.0345,-71.5955,A,0,Origen,a2',
    'b,Nodo B,edificio,-33.0348,-71.5952,B,0,Destino,b2',
  ].join('\n');
  const res = convertir(nodosDuplicados, tramosCsv());
  assert.ok(res.errores.some((e) => e.includes('nodos.csv') && e.includes('id')));
  assert.deepEqual(res.nodos, []);
});

test('convertir.js --escribir con dos columnas escalones falla (exit 1) sin sobrescribir campus.json', () => {
  const baseDir = mkdtempSync(join(tmpdir(), 'convertir-cli-'));
  try {
    const levDir = join(baseDir, 'levantamiento');
    mkdirSync(levDir, { recursive: true });
    writeFileSync(join(baseDir, 'package.json'), '{"type":"module"}\n');
    const campusOriginal = '{"sentinel":true}\n';
    const campusPath = join(baseDir, 'campus.json');
    writeFileSync(campusPath, campusOriginal);
    writeFileSync(join(levDir, 'nodos.csv'), NODOS_CSV);
    writeFileSync(
      join(levDir, 'tramos.csv'),
      [
        'id,desde,hasta,metros,escalones,pendiente,rampa,ascensor_id,techado,superficie,minutos_medidos,guia_tactil,notas,foto,sentido_unico,escalones',
        't1,a,b,45.5,42,nula,no,,no,lisa,1.2,no,,,no,0',
      ].join('\n'),
    );
    const scriptOriginal = fileURLToPath(new URL('../data/levantamiento/convertir.js', import.meta.url));
    const scriptTmp = join(levDir, 'convertir.js');
    copyFileSync(scriptOriginal, scriptTmp);

    const res = spawnSync(process.execPath, [scriptTmp, '--escribir'], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /escalones/);
    assert.equal(readFileSync(campusPath, 'utf8'), campusOriginal);
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
  }
});

test('convertir rechaza una comilla abierta y conserva las notas multilínea válidas', () => {
  const abrirNota = tramosCsv().replace(/,,,no$/, ',"nota');
  assert.match(convertir(NODOS_CSV, abrirNota).errores[0], /tramos\.csv: comilla sin cerrar/);
  const res = convertir(NODOS_CSV, abrirNota + '\nsegunda línea",,si');
  assert.deepEqual(res.errores, []);
  assert.equal(res.tramos[0].notas, 'nota\nsegunda línea');
  assert.equal(res.tramos[0].sentido_unico, true);
});

test('convertir rechaza un tramo con el mismo id que un nodo', () => {
  const res = convertir(NODOS_CSV, tramosCsv().replace('\nt1,', '\na,'));
  assert.match(res.errores[0], /tramo a: el id coincide con un nodo/);
});

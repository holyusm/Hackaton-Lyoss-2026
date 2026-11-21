import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearEdificios, pisosDe, pisoInicial, interior, nodoDestino, filtrarEdificios, limpiar } from '../plano/edificios-lib.js';

const leer = (r) => JSON.parse(readFileSync(new URL(r, import.meta.url), 'utf8'));
const geo = leer('../plano/casa-central.geo.json');
const grafo = leer('../../../data/campus.json');
const lista = crearEdificios(geo);
const por = (clave) => lista.find((e) => e.clave === clave);

test('agrupa por letra y luego por nombre, con las letras primero y en orden numérico', () => {
  const claves = lista.map((e) => e.clave);
  assert.equal(new Set(claves).size, claves.length, 'una entrada por clave');
  const letras = lista.filter((e) => e.letra).map((e) => e.letra);
  assert.ok(letras.indexOf('M') < letras.indexOf('M2'), 'M2 va después de M');
  const primerSinLetra = lista.findIndex((e) => !e.letra);
  assert.ok(lista.slice(0, primerSinLetra).every((e) => e.letra) && lista.slice(primerSinLetra).every((e) => !e.letra));
});

test('el Edificio C (dos polígonos) queda una sola vez, y el B sale de la relación sin nombre', () => {
  assert.equal(lista.filter((e) => e.letra === 'C').length, 1);
  const b = por('B');
  assert.equal(b.osm, 'relation/17542343');
  assert.equal(b.titulo, 'Edificio B');
  assert.match(b.sub, /nombre por confirmar/);
});

test('títulos y subtítulos: letra, nombre con subtítulo y arreglos de texto', () => {
  assert.equal(por('K').titulo, 'Edificio K');
  assert.equal(por('K').sub, 'CIAC');
  assert.ok(lista.some((e) => e.titulo === 'Edificio Comedores'), 'Comerdores se muestra como Comedores');
  assert.equal(limpiar('Comerdores'), 'Comedores');
  assert.ok(lista.every((e) => !e.titulo.includes('Comerdores')));
  assert.ok(lista.some((e) => e.titulo.startsWith('FEUTFSM')), 'el nombre largo de la Federación se acorta');
});

test('cada edificio trae bounds válidos y un centro dentro de ellos', () => {
  for (const e of lista) {
    const [[s, w], [n, ee]] = e.bounds;
    assert.ok(s < n && w < ee, `${e.clave}: bounds`);
    assert.ok(e.centro[0] >= s && e.centro[0] <= n && e.centro[1] >= w && e.centro[1] <= ee, `${e.clave}: centro fuera`);
  }
});

test('pisosDe: el C da -1, 1 y 2; con pisos conocidos 1..n (máximo 8); si no, solo el 1', () => {
  assert.deepEqual(pisosDe(por('C')), [-1, 1, 2]);
  assert.deepEqual(pisosDe(por('T')), [1, 2, 3, 4]);
  assert.deepEqual(pisosDe({ letra: null, pisos: 20 }), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(pisosDe(por('A')), [1]);
  assert.equal(pisoInicial(por('C')), 2);
  assert.equal(pisoInicial(por('A')), 1);
});

test('interior: el C tiene salas en el piso 2 (con baños) y pasillos en el -1; el 1 y otros edificios no tienen', () => {
  const piso2 = interior(geo, 'C', 2);
  assert.ok(piso2.filter((f) => f.properties.tipo === 'sala').length >= 28);
  assert.equal(piso2.filter((f) => f.properties.servicio === 'toilets').length, 2);
  const menos1 = interior(geo, 'C', -1);
  assert.equal(menos1.length, 3);
  assert.ok(menos1.every((f) => f.properties.tipo === 'pasillo'));
  assert.deepEqual(interior(geo, 'C', 1), []);
  assert.deepEqual(interior(geo, 'A', 2), []);
});

test('nodoDestino devuelve el nodo edificio de campus.json o null', () => {
  assert.equal(nodoDestino(grafo, 'B'), 'edificio-b');
  assert.equal(nodoDestino(grafo, 'Z'), null);
  assert.equal(nodoDestino(grafo, null), null);
});

test('filtrarEdificios busca por letra, título, subtítulo y alias sin mayúsculas ni tildes', () => {
  assert.equal(filtrarEdificios(lista, '').length, lista.length);
  assert.ok(filtrarEdificios(lista, 'biblioteca').some((e) => e.letra === 'U'));
  assert.ok(filtrarEdificios(lista, 'cafeteria').some((e) => e.letra === 'Q'));
  assert.ok(filtrarEdificios(lista, 'Casino').some((e) => e.clave === 'Edificio Comedores'));
  assert.ok(filtrarEdificios(lista, 'casino').some((e) => e.clave === 'Edificio Comedores'));
  assert.ok(filtrarEdificios(lista, 'kiosco').some((e) => e.clave === 'Kiosko'));
  assert.ok(filtrarEdificios(lista, 'rrhh').some((e) => e.clave === 'Dirección de Recursos Humanos'));
  assert.ok(filtrarEdificios(lista, 'enfermeria').some((e) => e.clave === 'Sansamed'));
  assert.deepEqual(filtrarEdificios(lista, 'xyzxyz'), []);
});

test('filtrarEdificios prioriza coincidencia exacta de letra, luego prefijo de nombre o alias, luego el resto', () => {
  const resC = filtrarEdificios(lista, 'C');
  assert.equal(resC[0].letra, 'C', 'C devuelve primero el Edificio C');
  assert.equal(filtrarEdificios(lista, '  c  ')[0].letra, 'C');

  const idxCasa = resC.findIndex((e) => e.clave === 'Casa Escuela de Graduados');
  const idxComedores = resC.findIndex((e) => e.clave === 'Edificio Comedores');
  const idxA = resC.findIndex((e) => e.letra === 'A');
  assert.ok(idxCasa > 0 && idxCasa < idxA, 'nombre que empieza con c va antes que coincidencia interna');
  assert.ok(idxComedores > 0 && idxComedores < idxA, 'alias que empieza con c (Casino) va antes que coincidencia interna');

  for (const e of lista.filter((x) => x.letra)) {
    const res = filtrarEdificios(lista, e.letra);
    assert.equal(res[0].letra, e.letra, `buscar "${e.letra}" devuelve primero Edificio ${e.letra}`);
  }

  const resM = filtrarEdificios(lista, 'M');
  assert.equal(resM[0].letra, 'M');
  assert.equal(resM[1].letra, 'M2');

  const muestra = [
    { clave: 'interno', letra: null, titulo: 'Edificio Alfa', sub: '', alias: [] },
    { clave: 'alias', letra: null, titulo: 'Almuerzo', sub: '', alias: ['Casino'] },
    { clave: 'prefijo', letra: null, titulo: 'Casa Central', sub: '', alias: [] },
    { clave: 'C', letra: 'C', titulo: 'Edificio C', sub: '', alias: [] },
  ];
  const copia = [...muestra];
  const ordenado = filtrarEdificios(muestra, 'c');
  assert.deepEqual(ordenado.map((e) => e.clave), ['C', 'alias', 'prefijo', 'interno']);
  assert.deepEqual(muestra, copia, 'no muta la lista recibida');
});

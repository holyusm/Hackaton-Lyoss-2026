import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  crearEdificios, pisosDe, pisoInicial, interior, nodoDestino, filtrarEdificios, limpiar, textoPisos, norm, FALTAN_EN_OSM, VECINOS,
} from '../plano/edificios-lib.js';

const leer = (r) => JSON.parse(readFileSync(new URL(r, import.meta.url), 'utf8'));
const geo = leer('../plano/casa-central.geo.json');
const grafo = leer('../../../data/campus.json');
const lista = crearEdificios(geo);
const por = (clave) => lista.find((e) => e.clave === clave);
const ejemplos = leer('../../../docs/diseno/vistas/lote-10-plano/datos-ejemplo.json');

test('la lista tiene los 25 edificios de datos-ejemplo, en su orden, sin el vecino Costa Santa María', () => {
  assert.equal(lista.length, 25);
  assert.deepEqual(lista.map((e) => e.clave), ejemplos.edificios.map((e) => e.clave));
  assert.deepEqual(VECINOS, ['way/1082210883']);
  assert.ok(lista.every((e) => e.osm !== 'way/1082210883'));
});

test('títulos, subtítulos, pisos y servicios coinciden con datos-ejemplo', () => {
  for (const ej of ejemplos.edificios) {
    const e = por(ej.clave);
    assert.equal(e.titulo, ej.titulo, `${ej.clave}: título`);
    assert.equal(e.sub, ej.subtitulo ?? '', `${ej.clave}: subtítulo`);
    assert.equal(textoPisos(e), ej.pisosTexto, `${ej.clave}: texto de pisos`);
    assert.equal(pisoInicial(e), ej.pisoInicial, `${ej.clave}: piso inicial`);
    assert.deepEqual(pisosDe(e), ej.pisos ?? [], `${ej.clave}: pisos`);
    assert.deepEqual(e.servicios, ej.servicios, `${ej.clave}: servicios`);
  }
});

test('FEUTFSM se parte en título y subtítulo; sin subtítulo no hay relleno', () => {
  const f = por('FEUTFSM, Federación de Estudiantes');
  assert.equal(f.titulo, 'FEUTFSM');
  assert.equal(f.sub, 'Federación de Estudiantes');
  assert.equal(por('Kiosko').sub, '');
  assert.ok(lista.every((e) => e.sub !== 'Edificio del campus'));
});

test('textoPisos: C con signo menos, plural, singular y por confirmar', () => {
  assert.equal(textoPisos(por('C')), 'Pisos −1, 1 y 2');
  assert.equal(textoPisos(por('T')), '4 pisos');
  assert.equal(textoPisos(por('Kiosko')), '1 piso');
  assert.equal(textoPisos(por('A')), 'Pisos por confirmar');
});

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

test('pisosDe: el C da -1, 1 y 2; con pisos conocidos 1..n (máximo 8); si no, ninguno', () => {
  assert.deepEqual(pisosDe(por('C')), [-1, 1, 2]);
  assert.deepEqual(pisosDe(por('T')), [1, 2, 3, 4]);
  assert.deepEqual(pisosDe({ letra: null, pisos: 20 }), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(pisosDe(por('A')), []);
  assert.equal(pisoInicial(por('C')), 2);
  assert.equal(pisoInicial(por('T')), 1);
  assert.equal(pisoInicial(por('A')), null);
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

test('filtrarEdificios busca por título, subtítulo y servicios sin mayúsculas ni tildes', () => {
  assert.equal(filtrarEdificios(lista, '').length, lista.length);
  assert.deepEqual(filtrarEdificios(lista, 'biblioteca').map((e) => e.clave), ['U']);
  assert.ok(filtrarEdificios(lista, 'cafeteria').some((e) => e.letra === 'Q'));
  assert.ok(filtrarEdificios(lista, 'kiosko').some((e) => e.clave === 'Kiosko'));
  assert.ok(filtrarEdificios(lista, 'recursos humanos').some((e) => e.clave === 'Dirección de Recursos Humanos'));
  assert.deepEqual(filtrarEdificios(lista, 'xyzxyz'), []);
  assert.equal(norm('  Cafetería '), 'cafeteria');
});

test('filtrarEdificios: "casino" llega a Comedores por su servicio, con motivo', () => {
  const res = filtrarEdificios(lista, 'Casino');
  assert.equal(res.length, 1);
  assert.equal(res[0].clave, 'Edificio Comedores');
  assert.equal(res[0].motivo, 'Servicio: Casino');
  assert.equal(por('Edificio Comedores').motivo, undefined, 'no muta el edificio original');
});

test('filtrarEdificios: un código busca solo la letra exacta', () => {
  assert.deepEqual(filtrarEdificios(lista, 'c').map((e) => e.letra), ['C']);
  assert.deepEqual(filtrarEdificios(lista, '  C  ').map((e) => e.letra), ['C']);
  assert.deepEqual(filtrarEdificios(lista, 'm2').map((e) => e.letra), ['M2']);
  assert.deepEqual(filtrarEdificios(lista, 'Edificio U').map((e) => e.letra), ['U']);
  for (const e of lista.filter((x) => x.letra)) assert.deepEqual(filtrarEdificios(lista, e.letra).map((x) => x.letra), [e.letra]);
  assert.deepEqual(filtrarEdificios(lista, 'Edificio H'), []);
  assert.ok(FALTAN_EN_OSM.includes('H'));
  assert.deepEqual(FALTAN_EN_OSM, ['H', 'O', 'J', 'I', 'N', 'F2', 'P2']);
});

test('filtrarEdificios devuelve los resultados en el orden de la lista (ejemplos de datos-ejemplo)', () => {
  const nombre = (e) => (e.motivo ? `${e.titulo} (servicio: ${e.motivo.replace('Servicio: ', '')})` : e.titulo);
  for (const ej of ejemplos.ejemplosBusqueda) {
    assert.deepEqual(filtrarEdificios(lista, ej.q).map(nombre), ej.resultados, `búsqueda «${ej.q}»`);
  }
  assert.equal(filtrarEdificios(lista, 'ca').length, 5);
  const copia = [...lista];
  filtrarEdificios(lista, 'ca');
  assert.deepEqual(lista, copia, 'no muta la lista recibida');
});

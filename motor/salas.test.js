import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta } from './ruta.js';
import { generarSalas } from '../data/levantamiento/salas.js';

const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const campus = JSON.parse(leer('../data/campus.json'));
const perfiles = JSON.parse(leer('../data/perfiles.json'));
const salasCsv = leer('../data/levantamiento/salas.csv');
const edificiosCsv = leer('../data/levantamiento/edificios.csv');
const ruta = (grafo, desde, hasta, perfil, bloqueos = []) => calcularRuta(grafo, perfiles, { desde, hasta, perfil, bloqueos });

test('campus.json está al día con salas.csv y edificios.csv (correr node data/levantamiento/salas.js --escribir)', () => {
  const { grafo, errores } = generarSalas(campus, salasCsv, edificiosCsv);
  assert.deepEqual(errores, []);
  assert.deepEqual(grafo.nodos.map((n) => n.id), campus.nodos.map((n) => n.id));
  assert.deepEqual(grafo.tramos.map((t) => [t.id, t.metros]), campus.tramos.map((t) => [t.id, t.metros]));
});

test('el generador es idempotente: volver a correrlo no duplica nada', () => {
  const una = generarSalas(campus, salasCsv, edificiosCsv).grafo;
  const dos = generarSalas(una, salasCsv, edificiosCsv).grafo;
  assert.deepEqual(dos, una);
  assert.equal(new Set(dos.nodos.map((n) => n.id)).size, dos.nodos.length);
});

test('las 29 salas y los 2 baños del C, piso 2, están en el grafo con su departamento opcional', () => {
  const del = campus.nodos.filter((n) => n.edificio === 'C' && n.piso === 2 && ['sala', 'bano'].includes(n.tipo));
  assert.equal(del.filter((n) => n.tipo === 'sala').length, 29);
  assert.equal(del.filter((n) => n.tipo === 'bano').length, 2);
  assert.ok(campus.nodos.find((n) => n.id === 'sala-c231'));
});

test('C224 (sin level en OSM, piso 2 inferido de sus vecinas) es ruteable en silla de ruedas por el ascensor C', () => {
  const r = ruta(campus, 'entrada-principal', 'sala-c224', 'silla_ruedas');
  assert.equal(r.ok, true);
  assert.ok(r.nodos.includes('ascensor-c'));
  assert.equal(r.escalones, 0);
});

test('en silla de ruedas, de la entrada principal a la sala C231 se pasa por el ascensor C', () => {
  const r = ruta(campus, 'entrada-principal', 'sala-c231', 'silla_ruedas');
  assert.equal(r.ok, true);
  assert.equal(r.escalones, 0);
  assert.ok(r.tramos.some((id) => campus.tramos.find((t) => t.id === id).ascensor_id === 'ascensor-c'));
});

test('con el ascensor C bloqueado no hay ruta en silla de ruedas, pero sí por la escalera en Estándar', () => {
  assert.equal(ruta(campus, 'entrada-principal', 'sala-c231', 'silla_ruedas', ['ascensor-c']).ok, false);
  const estandar = ruta(campus, 'entrada-principal', 'sala-c231', 'estandar', ['ascensor-c']);
  assert.equal(estandar.ok, true);
  assert.equal(estandar.escalones, 20);
});

test('de una sala a otra del mismo piso no se sube ni se baja', () => {
  const r = ruta(campus, 'sala-c231', 'sala-c207', 'silla_ruedas');
  assert.equal(r.ok, true);
  assert.equal(r.escalones, 0);
  assert.ok(r.metros <= 150);
});

test('los pasillos del generador no se ofrecen como destino (oculto)', () => {
  const pasillos = campus.nodos.filter((n) => /^[a-z0-9]+-p\d+$/.test(n.id) && n.generado === 'salas');
  assert.ok(pasillos.length >= 2);
  assert.ok(pasillos.every((n) => n.oculto === true && n.tipo === 'punto'));
});

// Agregar una fila a mano: una sala T301 en el piso 3 del Edificio T, sin ascensor levantado.
const EDIFICIOS_CON_T = `${edificiosCsv.trim()}\nT,-33.035300,-71.597200,patio-central,por_levantar,1;2;3\n`;
const SALAS_CON_T = `${salasCsv.trim()}\nsala-t301,Laboratorio T301,sala,T,3,Depto. de Informática,,,levantamiento de prueba\n`;

test('agregar una fila a salas.csv y correr el generador deja la sala ruteable, con su departamento', () => {
  const { grafo, errores } = generarSalas(campus, SALAS_CON_T, EDIFICIOS_CON_T);
  assert.deepEqual(errores, []);
  const nodo = grafo.nodos.find((n) => n.id === 'sala-t301');
  assert.equal(nodo.piso, 3);
  assert.equal(nodo.departamento, 'Depto. de Informática');
  assert.match(nodo.descripcion, /Depto\. de Informática/);
  assert.equal(ruta(grafo, 'entrada-principal', 'sala-t301', 'estandar').ok, true);
});

test('sin ascensor levantado, silla de ruedas no llega a un piso alto: esa es la barrera', () => {
  const { grafo } = generarSalas(campus, SALAS_CON_T, EDIFICIOS_CON_T);
  assert.equal(ruta(grafo, 'entrada-principal', 'sala-t301', 'silla_ruedas').ok, false);
});

test('el generador rechaza datos inválidos con un mensaje que dice archivo y fila', () => {
  const malo = (salas, edificios = edificiosCsv) => generarSalas(campus, salas, edificios).errores;
  assert.match(malo(`${salasCsv.trim()}\nsala-x,X,laboratorio,C,2,,,,\n`)[0], /salas\.csv sala-x: tipo debe ser sala o bano/);
  assert.match(malo(`${salasCsv.trim()}\nsala-y,Y,sala,Z,1,,,,\n`)[0], /salas\.csv sala-y: el edificio "Z" no está en edificios\.csv/);
  assert.match(malo(`${salasCsv.trim()}\nsala-z,Z,sala,C,9,,,,\n`)[0], /el piso 9 no está en los pisos de C/);
  assert.match(malo(salasCsv, 'letra,entrada_lat,entrada_lng,conecta_a,ascensor,pisos\nC,-33.03,-71.59,no-existe,si,1;2\n')[0], /conecta_a "no-existe" no existe/);
  assert.match(malo(salasCsv, 'letra,entrada_lat,entrada_lng,conecta_a,ascensor,pisos\nC,-33.03,-71.59,edificio-b,quizas,1;2\n')[0], /ascensor debe ser si, no o por_levantar/);
});

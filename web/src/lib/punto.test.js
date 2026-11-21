import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarPunto, frasesPunto, horaHablada } from './punto.js';

const grafo = { nodos: [
  { id: 'entrada-principal', nombre: 'Entrada principal', descripcion: 'Portón principal de Casa Central' },
  { id: 'patio-central', nombre: 'Patio central' },
] };
const punto = {
  id: 'p1', nodo_id: 'entrada-principal', titulo: 'Entrada principal',
  indicaciones: [
    { hacia: 'Patio central', texto: 'Avanza 130 metros por la rampa, sin escalones.' },
    { hacia: 'Kiosko fantasma', texto: 'Sigue de frente.' },
  ],
};
const barrera = { id: 'r1', nodo_id: 'entrada-principal', nivel: 'bloqueo', descripcion: 'Piso mojado en el portón.', expira: '2026-11-21T15:35:00Z' };

test('horaHablada', () => {
  assert.equal(horaHablada('12:35'), '12 y 35');
  assert.equal(horaHablada('12:00'), '12 en punto');
  assert.equal(horaHablada('09:05'), '9 y 5');
});

test('sin barrera: dónde estás primero, después cada destino; un destino sin nodo no tiene enlace', () => {
  const m = armarPunto(punto, grafo, [], 'silla_ruedas');
  assert.equal(m.titulo, 'Estás en: Entrada principal');
  assert.equal(m.descripcion, 'Portón principal de Casa Central');
  assert.equal(m.barrera, null);
  assert.equal(m.destinos[0].enlace, '/mapa?desde=entrada-principal&hasta=patio-central&perfil=silla_ruedas');
  assert.equal(m.destinos[1].enlace, null);
  assert.deepEqual(frasesPunto(m).map((f) => f.clave), ['lugar', 'patio-central', 'destino-1']);
  assert.equal(frasesPunto(m)[0].texto, 'Estás en: Entrada principal. Portón principal de Casa Central.');
  assert.equal(frasesPunto(m)[1].texto, 'Patio central: avanza 130 metros por la rampa, sin escalones.');
});

test('con barrera: el aviso va primero y la hora se dice hablada', () => {
  const m = armarPunto(punto, grafo, [barrera, { ...barrera, id: 'r2', nodo_id: 'otro' }], null);
  assert.equal(m.barrera.titulo, 'Atención: piso mojado en el portón.');
  assert.equal(m.barrera.vence, '12:35');
  const f = frasesPunto(m);
  assert.equal(f[0].clave, 'aviso');
  assert.equal(f[0].texto, 'Atención: piso mojado en el portón. El aviso vence a las 12 y 35.');
  assert.equal(m.destinos[0].enlace, '/mapa?desde=entrada-principal&hasta=patio-central&perfil=estandar');
});

test('sin perfil guardado el enlace Llévame usa estandar; con perfil lo conserva', () => {
  const base = '/mapa?desde=entrada-principal&hasta=patio-central&perfil=';
  assert.equal(armarPunto(punto, grafo, []).destinos[0].enlace, base + 'estandar');
  assert.equal(armarPunto(punto, grafo, [], null).destinos[0].enlace, base + 'estandar');
  assert.equal(armarPunto(punto, grafo, [], 'perfil_inventado').destinos[0].enlace, base + 'estandar');
  assert.equal(armarPunto(punto, grafo, [], 'silla_ruedas').destinos[0].enlace, base + 'silla_ruedas');
  assert.equal(armarPunto(punto, grafo, [], 'silla_ruedas').destinos[1].enlace, null);
});

test('ningún texto lleva separadores prohibidos', () => {
  const textos = frasesPunto(armarPunto(punto, grafo, [barrera])).map((f) => f.texto).join(' ');
  for (const c of ['·', '—', '–']) assert.ok(!textos.includes(c), c);
});

test('el QR sustituye también en la voz la indicación de un tramo bloqueado', () => {
  const g = { ...grafo, tramos: [{ id: 't8', desde: 'patio-central', hasta: 'entrada-principal' }] };
  const m = armarPunto(punto, g, [{ ...barrera, nodo_id: null, tramo_id: 't8' }]);
  assert.match(m.destinos[0].indicacion, /bloqueo/);
  assert.doesNotMatch(frasesPunto(m).map(f => f.texto).join(' '), /130 metros/);
  assert.equal(m.destinos[1].indicacion, 'Sigue de frente.');
});

test('la voz anuncia primero si las barreras no se pudieron verificar', () => {
  const modelo = armarPunto(punto, grafo, [barrera]);
  const estado = 'No pudimos verificar las barreras actuales.';
  const frases = frasesPunto(modelo, estado);
  assert.deepEqual(frases.slice(0, 3).map((f) => f.clave), ['estado-barreras', 'aviso', 'lugar']);
  assert.equal(frases[0].texto, estado);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta, compararPerfiles } from './ruta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const base = { desde: 'entrada-principal', hasta: 'sala-a201' };

test('estándar toma la escalera (más corta)', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'estandar' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t1', 't4', 't5']);
  assert.equal(r.metros, 90);
  assert.equal(r.escalones, 42);
});

test('silla de ruedas usa el ascensor, sin escalones', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t1', 't2', 't3', 't5']);
  assert.equal(r.escalones, 0);
});

test('movilidad reducida evita la escalera aunque no esté prohibida', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'movilidad_reducida' });
  assert.deepEqual(r.tramos, ['t1', 't2', 't3', 't5']);
});

test('ascensor y pasarela bloqueados: silla sin ruta, estándar sigue', () => {
  const c = compararPerfiles(grafo, perfiles, { ...base, bloqueos: ['ascensor-a', 'pasarela-b-a'] });
  assert.equal(c.silla_ruedas.ok, false);
  assert.match(c.silla_ruedas.motivo, /sin ruta accesible/);
  assert.equal(c.estandar.ok, true);
});

test('bloquear un tramo por id', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'estandar', bloqueos: ['t4'] });
  assert.deepEqual(r.tramos, ['t1', 't2', 't3', 't5']);
});

test('sentido único: casino→entrada usa t10, entrada→casino no', () => {
  const ida = calcularRuta(grafo, perfiles, { desde: 'casino', hasta: 'entrada-principal', perfil: 'estandar' });
  assert.deepEqual(ida.tramos, ['t10']);
  const vuelta = calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'casino', perfil: 'estandar' });
  assert.equal(vuelta.tramos.includes('t10'), false);
});

test('ids o perfil desconocidos devuelven ok:false', () => {
  assert.equal(calcularRuta(grafo, perfiles, { ...base, perfil: 'x' }).ok, false);
  assert.equal(calcularRuta(grafo, perfiles, { desde: 'zz', hasta: 'casino', perfil: 'estandar' }).ok, false);
});

test('compararPerfiles devuelve una entrada por perfil', () => {
  const c = compararPerfiles(grafo, perfiles, base);
  assert.deepEqual(Object.keys(c).sort(), perfiles.map((p) => p.id).sort());
});

test('origen igual a destino: ruta vacía', () => {
  const r = calcularRuta(grafo, perfiles, { desde: 'casino', hasta: 'casino', perfil: 'estandar' });
  assert.equal(r.ok, true);
  assert.equal(r.metros, 0);
});

test('advertencias siguen el sentido real del recorrido (ida y vuelta)', () => {
  const ida = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas' });
  assert.ok(ida.advertencias.includes('Usa el Ascensor A hasta el Edificio A, piso 2'));
  const vuelta = calcularRuta(grafo, perfiles, { desde: 'sala-a201', hasta: 'entrada-principal', perfil: 'silla_ruedas' });
  assert.equal(vuelta.ok, true);
  assert.ok(vuelta.advertencias.includes('Usa el Ascensor A desde el Edificio A, piso 2'));
  assert.equal(vuelta.advertencias.some((a) => a.includes('hasta el Edificio A, piso 2')), false);
});

test('escalera de bajada: la advertencia nombra origen y destino en orden real', () => {
  const r = calcularRuta(grafo, perfiles, { desde: 'sala-a201', hasta: 'entrada-principal', perfil: 'estandar' });
  assert.ok(r.advertencias.includes('Hay 42 escalones entre Edificio A, piso 2 y Patio central'));
});

test('las advertencias no llevan flechas ni puntos medios', () => {
  for (const perfil of ['estandar', 'silla_ruedas']) {
    for (const [desde, hasta] of [[base.desde, base.hasta], [base.hasta, base.desde]]) {
      const r = calcularRuta(grafo, perfiles, { desde, hasta, perfil });
      for (const a of r.advertencias) assert.doesNotMatch(a, /[→·]|--|—/, a);
    }
  }
});

test('recálculo de la demo: ascensor bloqueado sale por la rampa del Edificio B, con unos 40 m y 1 min más', () => {
  const normal = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas' });
  const sinAscensor = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas', bloqueos: ['ascensor-a'] });
  assert.equal(normal.ok, true);
  assert.equal(sinAscensor.ok, true);
  assert.deepEqual(sinAscensor.nodos, ['entrada-principal', 'patio-central', 'edificio-b', 'rampa-b', 'pasarela-b-a', 'edificio-a-p2', 'sala-a201']);
  assert.equal(sinAscensor.escalones, 0);
  assert.equal(sinAscensor.metros - normal.metros, 40);
  assert.equal(Math.round((sinAscensor.minutos - normal.minutos) * 10) / 10, 1);
  assert.notDeepEqual(sinAscensor.tramos, normal.tramos);
});

test('con el ascensor y la pasarela bloqueados, la silla de ruedas no tiene ruta', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas', bloqueos: ['ascensor-a', 'pasarela-b-a'] });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /sin ruta accesible/);
});

test('bloquear solo la pasarela no afecta a la ruta por el ascensor', () => {
  const normal = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas' });
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas', bloqueos: ['pasarela-b-a'] });
  assert.deepEqual(r.tramos, normal.tramos);
});

test('la alternativa por B también se puede bloquear por id de tramo', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas', bloqueos: ['ascensor-a', 't14'] });
  assert.equal(r.ok, false);
});

test('un grafo editado con un ascensor_id inexistente no lanza y da un diagnóstico', () => {
  const roto = { ...grafo, tramos: grafo.tramos.map((t) => (t.ascensor_id ? { ...t, ascensor_id: 'ascensor-fantasma' } : t)) };
  let r;
  assert.doesNotThrow(() => { r = calcularRuta(roto, perfiles, { ...base, perfil: 'silla_ruedas' }); });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /grafo inválido.*ascensor_id "ascensor-fantasma"/);
});

test('un tramo con desde o hasta inexistente da un diagnóstico', () => {
  const roto = { ...grafo, tramos: [{ ...grafo.tramos[0], hasta: 'no-existe' }, ...grafo.tramos.slice(1)] };
  const r = calcularRuta(roto, perfiles, { ...base, perfil: 'estandar' });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /hasta "no-existe"/);
});

test('los extremos vacíos o ausentes dan un diagnóstico aunque estén fuera de la ruta', () => {
  for (const campo of ['desde', 'hasta']) {
    for (const valor of ['', undefined]) {
      const copia = structuredClone(grafo);
      copia.tramos[0][campo] = valor;
      const r = calcularRuta(copia, perfiles, { desde: 'biblioteca', hasta: 'bano-b', perfil: 'silla_ruedas' });
      assert.equal(r.ok, false);
      assert.match(r.motivo, new RegExp(`grafo inválido.*t1.*${campo}`));
    }
  }
});

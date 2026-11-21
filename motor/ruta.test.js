import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta, compararPerfiles, conArticulo } from './ruta.js';
import { armarRuta } from '../web/src/lib/pasos.js';
import { armarFilas, fraseResumen } from '../web/src/lib/comparar.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const base = { desde: 'entrada-principal', hasta: 'sala-a201' };

test('estándar toma la escalera (más corta)', () => {
  const r = calcularRuta(grafo, perfiles, { ...base, perfil: 'estandar' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t1', 't4', 't5']);
  assert.equal(r.metros, 320);
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

test('recálculo de la demo: ascensor bloqueado sale por la rampa del Edificio B, con unos 120 m más', () => {
  const normal = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas' });
  const sinAscensor = calcularRuta(grafo, perfiles, { ...base, perfil: 'silla_ruedas', bloqueos: ['ascensor-a'] });
  assert.equal(normal.ok, true);
  assert.equal(sinAscensor.ok, true);
  assert.deepEqual(sinAscensor.nodos, ['entrada-principal', 'patio-central', 'edificio-b', 'rampa-b', 'pasarela-b-a', 'edificio-a-p2', 'sala-a201']);
  assert.equal(sinAscensor.escalones, 0);
  assert.equal(sinAscensor.metros - normal.metros, 120);
  assert.equal(Math.round((sinAscensor.minutos - normal.minutos) * 10) / 10, 0.9);
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

test('ascensor bloqueado: se puede salir del vestíbulo (origen) por un tramo que no pasa por el ascensor', () => {
  const r = calcularRuta(grafo, perfiles, { desde: 'ascensor-a', hasta: 'patio-central', perfil: 'silla_ruedas', bloqueos: ['ascensor-a'] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t2']);
  assert.deepEqual(r.nodos, ['ascensor-a', 'patio-central']);
});

test('ascensor bloqueado como destino: se llega al vestíbulo por t2', () => {
  const r = calcularRuta(grafo, perfiles, { desde: 'patio-central', hasta: 'ascensor-a', perfil: 'silla_ruedas', bloqueos: ['ascensor-a'] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t2']);
});

test('ascensor bloqueado como origen: la silla no usa t3, sale por el desvío del Edificio B', () => {
  const r = calcularRuta(grafo, perfiles, { desde: 'ascensor-a', hasta: 'edificio-a-p2', perfil: 'silla_ruedas', bloqueos: ['ascensor-a'] });
  assert.equal(r.ok, true);
  assert.ok(!r.tramos.includes('t3'));
  assert.deepEqual(r.nodos, ['ascensor-a', 'patio-central', 'edificio-b', 'rampa-b', 'pasarela-b-a', 'edificio-a-p2']);
  assert.equal(r.escalones, 0);
});

test('un nodo bloqueado que no es ascensor sigue siendo intransitable (origen, destino y paso)', () => {
  const pasarela = { ...base, perfil: 'silla_ruedas', bloqueos: ['pasarela-b-a'] };
  assert.equal(calcularRuta(grafo, perfiles, { ...pasarela, desde: 'pasarela-b-a' }).ok, false);
  assert.equal(calcularRuta(grafo, perfiles, { ...pasarela, hasta: 'pasarela-b-a' }).ok, false);
  const sinPaso = calcularRuta(grafo, perfiles, { ...pasarela, bloqueos: ['ascensor-a', 'pasarela-b-a'] });
  assert.equal(sinPaso.ok, false);
});

test('conArticulo usa "la" para Biblioteca y nombres femeninos, sin cambiar los textos existentes', () => {
  const nodo = (id) => grafo.nodos.find((n) => n.id === id);
  assert.equal(conArticulo(nodo('biblioteca')), 'la Biblioteca');
  assert.equal(conArticulo({ id: 'bib-sur', nombre: 'Biblioteca Sur', tipo: 'edificio' }), 'la Biblioteca Sur');
  assert.equal(conArticulo(nodo('sala-a201')), 'la Sala A-201');
  assert.equal(conArticulo(nodo('entrada-principal')), 'la Entrada principal');
  assert.equal(conArticulo(nodo('rampa-b')), 'la Rampa del Edificio B, piso 2');
  assert.equal(conArticulo(nodo('pasarela-b-a')), 'la Pasarela entre los edificios B y A');
  // Textos existentes no cambian
  assert.equal(conArticulo(nodo('ascensor-a')), 'el Ascensor A');
  assert.equal(conArticulo(nodo('edificio-a-p2')), 'el Edificio A, piso 2');
  assert.equal(conArticulo(nodo('edificio-b')), 'el Edificio B');
  assert.equal(conArticulo(nodo('casino')), 'el Casino');
  assert.equal(conArticulo(nodo('bano-b')), 'el Baño accesible B');
  assert.equal(conArticulo(nodo('patio-central')), 'Patio central');
});

test('los textos generados para destino biblioteca usan "la Biblioteca" y nunca "el Biblioteca"', () => {
  const biblioteca = grafo.nodos.find((n) => n.id === 'biblioteca');

  // Pasos en /mapa: entrada-principal -> biblioteca y patio-central -> biblioteca
  const directa = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'biblioteca', perfil: 'estandar' }));
  assert.equal(directa.pasos.at(-1).instruccion, 'La Biblioteca está a 140 m.');
  const desdePatio = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'patio-central', hasta: 'biblioteca', perfil: 'estandar' }));
  assert.ok(desdePatio.pasos.some((p) => /la Biblioteca/i.test(p.instruccion)));

  // Frase resumen en /comparar cuando silla de ruedas no tiene ruta hacia biblioteca
  const comp = compararPerfiles(grafo, perfiles, { desde: 'entrada-principal', hasta: 'biblioteca' });
  const frase = fraseResumen(armarFilas(grafo, comp), biblioteca);
  assert.match(frase, /En silla de ruedas hoy no hay ruta hacia la Biblioteca\./);

  // Advertencia del motor cuando un tramo con ascensor_id llega a biblioteca
  const obra = leer('obras.json').find((o) => o.id === 'plataforma-patio-biblioteca');
  const grafoConObra = {
    ...grafo,
    nodos: [...grafo.nodos, ...obra.nodos_nuevos],
    tramos: [...grafo.tramos, ...obra.tramos_nuevos],
  };
  const conPlataforma = calcularRuta(grafoConObra, perfiles, { desde: 'patio-central', hasta: 'biblioteca', perfil: 'silla_ruedas' });
  assert.equal(conPlataforma.ok, true);
  assert.ok(conPlataforma.advertencias.includes('Usa la Plataforma elevadora del patio hasta la Biblioteca'));

  // Ningún texto generado para destino biblioteca contiene "el Biblioteca"
  const textos = [
    ...directa.pasos.map((p) => p.instruccion),
    ...desdePatio.pasos.map((p) => p.instruccion),
    frase,
    ...conPlataforma.advertencias,
  ];
  for (const t of textos) assert.doesNotMatch(t, /\bel Biblioteca\b/i, t);
});

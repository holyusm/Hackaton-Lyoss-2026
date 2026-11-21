import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta } from '../../../motor/ruta.js';
import { armarRuta } from './pasos.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const consulta = { desde: 'entrada-principal', hasta: 'sala-a201', perfil: 'silla_ruedas' };
const ruta = (extra = {}) => armarRuta(grafo, calcularRuta(grafo, perfiles, { ...consulta, ...extra }));

test('ruta de silla de ruedas por el ascensor: un paso por tramo, con el texto del diseño', () => {
  const r = ruta();
  assert.deepEqual(r.pasos.map((p) => p.instruccion), [
    'Avanza 270 m por la rampa hasta Patio central.',
    'Cruza 45 m por el pasillo techado hasta el Ascensor A.',
    'Sube al piso 2.',
    'La Sala A-201 está a 5 m.',
  ]);
  assert.deepEqual(r.pasos.map((p) => p.icono), ['TrendUp', 'Umbrella', 'Elevator', 'Door']);
  assert.deepEqual(r.pasos.map((p) => p.nodo), ['patio-central', 'ascensor-a', 'edificio-a-p2', 'sala-a201']);
});

test('el id solo cambia cuando cambia la ruta', () => {
  assert.equal(ruta().id, 't1-t2-t3-t5');
  assert.equal(ruta().id, ruta().id);
  assert.notEqual(ruta().id, ruta({ bloqueos: ['ascensor-a'] }).id);
});

test('ruta alternativa por el Edificio B usa los nombres de los tramos', () => {
  const r = ruta({ bloqueos: ['ascensor-a'] });
  const textos = r.pasos.map((p) => p.instruccion);
  assert.ok(textos.includes('Cruza 100 m por el borde del patio hasta el Edificio B.'));
  assert.ok(textos.includes('Sube por la rampa del Edificio B al piso 2.'));
  assert.ok(textos.some((t) => t.includes('la pasarela techada')));
  assert.equal(textos.at(-1), 'La Sala A-201 está a 5 m.');
});

test('la vuelta baja en ascensor y usa el orden real de los nodos', () => {
  const r = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'sala-a201', hasta: 'entrada-principal', perfil: 'silla_ruedas' }));
  assert.ok(r.pasos.map((p) => p.instruccion).includes('Baja al piso 0.'));
});

test('una escalera se dice con sus escalones y sube o baja', () => {
  const est = armarRuta(grafo, calcularRuta(grafo, perfiles, { ...consulta, perfil: 'estandar' }));
  const escalera = est.pasos.find((p) => p.tramo === 'escalera');
  assert.equal(escalera.instruccion, 'Sube 42 escalones hasta el Edificio A, piso 2.');
  assert.equal(escalera.icono, 'Stairs');
});

test('el detalle describe pendiente, piso y techo', () => {
  const r = ruta();
  assert.equal(r.pasos[0].detalle, 'Rampa suave, piso liso, al aire libre, con guía táctil');
  assert.equal(r.pasos[1].detalle, 'Plano, piso liso, techado');
});

test('ningún texto lleva flechas, puntos medios ni guiones largos', () => {
  for (const extra of [{}, { bloqueos: ['ascensor-a'] }, { perfil: 'estandar' }]) {
    for (const p of ruta(extra).pasos) {
      assert.doesNotMatch(`${p.instruccion} ${p.detalle}`, /[→·—]|--/, p.instruccion);
    }
  }
});

test('sin plano (aLatLng) las coordenadas quedan vacías; con x,y y aLatLng se arman', () => {
  assert.deepEqual(ruta().coordenadas, []);
  const g = structuredClone(grafo);
  g.nodos.forEach((n, i) => { n.x = i * 10; n.y = i * 5; });
  g.tramos.forEach((t) => { delete t.trazado; });
  const res = calcularRuta(g, perfiles, consulta);
  const r = armarRuta(g, res, { aLatLng: (x, y) => [y, x] });
  assert.equal(r.coordenadas.length, res.nodos.length);
  assert.equal(r.pasos.every((p) => p.punto && p.punto.length === 2), true);
});

test('sin ruta devuelve una ruta vacía', () => {
  const r = armarRuta(grafo, { ok: false, motivo: 'x' });
  assert.deepEqual(r, { id: '', pasos: [], coordenadas: [] });
});

test('el último tramo por rampa que cambia de piso conserva subir o bajar', () => {
  const sube = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'edificio-b', hasta: 'rampa-b', perfil: 'silla_ruedas' }));
  assert.equal(sube.pasos.at(-1).instruccion, 'Sube por la rampa del Edificio B al piso 2.');
  assert.equal(sube.pasos.at(-1).tramo, 'rampa');
  const baja = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'rampa-b', hasta: 'edificio-b', perfil: 'silla_ruedas' }));
  assert.equal(baja.pasos.at(-1).instruccion, 'Baja por la rampa del Edificio B al piso 0.');
  assert.equal(baja.pasos.at(-1).tramo, 'rampa');
});

test('las coordenadas siguen el trazado de cada tramo, y al volver van al revés', () => {
  const posicion = (n) => [n.lat, n.lng];
  const ida = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'entrada-principal', hasta: 'patio-central', perfil: 'estandar' }), { posicion });
  const t1 = grafo.tramos.find((t) => t.id === 't1');
  assert.ok(t1.trazado.length > 0, 'el tramo t1 debe tener trazado');
  assert.equal(ida.coordenadas.length, t1.trazado.length + 2);
  assert.deepEqual(ida.coordenadas.slice(1, -1), t1.trazado);
  const vuelta = armarRuta(grafo, calcularRuta(grafo, perfiles, { desde: 'patio-central', hasta: 'entrada-principal', perfil: 'estandar' }), { posicion });
  assert.deepEqual(vuelta.coordenadas, [...ida.coordenadas].reverse());
  assert.equal(ida.pasos[0].punto.length, 2);
});

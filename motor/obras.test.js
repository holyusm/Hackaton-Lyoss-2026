import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aplicarObras, simular } from './simulador.js';
import { calcularRuta } from './ruta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const obras = leer('obras.json');

const TIPOS = ['rampa', 'ascensor', 'superficie', 'guia_tactil', 'techado'];
const COSTOS = ['bajo', 'medio', 'alto'];
const nodoIds = new Set(grafo.nodos.map((n) => n.id));
const tramoIds = new Set(grafo.tramos.map((t) => t.id));

test('hay entre 5 y 8 obras y cubren rampa, ascensor, superficie y guía táctil', () => {
  assert.ok(obras.length >= 5 && obras.length <= 8, `hay ${obras.length}`);
  for (const tipo of ['rampa', 'ascensor', 'superficie', 'guia_tactil']) {
    assert.ok(obras.some((o) => o.tipo === tipo), `falta una obra de tipo ${tipo}`);
  }
});

test('ids únicos, tipo y costo_relativo válidos, títulos sin flechas ni guion largo', () => {
  assert.equal(new Set(obras.map((o) => o.id)).size, obras.length);
  for (const o of obras) {
    assert.ok(TIPOS.includes(o.tipo), `${o.id}: tipo ${o.tipo}`);
    assert.ok(COSTOS.includes(o.costo_relativo), `${o.id}: costo ${o.costo_relativo}`);
    assert.ok(o.titulo && o.lugar, `${o.id}: falta titulo o lugar`);
    assert.doesNotMatch(o.titulo, /[→←↑↓—–]/, `${o.id}: el título lleva flecha o guion largo`);
  }
});

test('perfiles_beneficiados son ids de perfiles.json', () => {
  const ids = new Set(perfiles.map((p) => p.id));
  for (const o of obras) {
    assert.ok(o.perfiles_beneficiados.length > 0, `${o.id}: sin perfiles`);
    for (const p of o.perfiles_beneficiados) assert.ok(ids.has(p), `${o.id}: perfil ${p}`);
  }
});

test('todo tramo_id de cambios existe en campus.json', () => {
  for (const o of obras) for (const c of o.cambios) assert.ok(tramoIds.has(c.tramo_id), `${o.id}: tramo ${c.tramo_id}`);
});

test('los ids nuevos no chocan con el grafo ni entre obras, y los tramos nuevos conectan nodos que existen', () => {
  const vistos = new Set([...nodoIds, ...tramoIds]);
  for (const o of obras) {
    const propios = new Set(o.nodos_nuevos.map((n) => n.id));
    for (const x of [...o.nodos_nuevos, ...o.tramos_nuevos]) {
      assert.ok(!vistos.has(x.id), `${o.id}: el id ${x.id} ya existe`);
      vistos.add(x.id);
    }
    for (const t of o.tramos_nuevos) {
      for (const campo of ['desde', 'hasta']) assert.ok(nodoIds.has(t[campo]) || propios.has(t[campo]), `${o.id}: ${campo} ${t[campo]}`);
      if (t.ascensor_id) assert.ok(propios.has(t.ascensor_id) || nodoIds.has(t.ascensor_id), `${o.id}: ascensor ${t.ascensor_id}`);
    }
  }
});

test('cada obra, salvo techado, quita la barrera de al menos un trayecto para algún perfil', () => {
  const evaluados = ['silla_ruedas', 'movilidad_reducida', 'baja_vision'];
  for (const o of obras.filter((x) => x.tipo !== 'techado')) {
    const quitadas = evaluados.map((perfil) => simular(grafo, perfiles, [o], { perfil }).obras[0].trayectos_sin_barrera);
    assert.ok(quitadas.some((n) => n > 0), `${o.id} no quita ninguna barrera (${quitadas.join(', ')})`);
  }
});

test('hoy la Biblioteca no tiene ruta en silla de ruedas y la rampa del patio la arregla', () => {
  assert.equal(grafo.simulado, true, 'el grafo simulado debe seguir marcado como simulado');
  const consulta = { desde: 'entrada-principal', hasta: 'biblioteca', perfil: 'silla_ruedas' };
  assert.equal(calcularRuta(grafo, perfiles, consulta).ok, false);
  const rampa = obras.find((o) => o.id === 'rampa-patio-biblioteca');
  assert.equal(calcularRuta(aplicarObras(grafo, [rampa]), perfiles, consulta).ok, true);
  const hoy = simular(grafo, perfiles, obras, { perfil: 'silla_ruedas' });
  assert.ok(hoy.hoy.trayectos_con_barrera > 0, 'en silla de ruedas debe haber trayectos con barrera hoy');
  assert.equal(hoy.obras[0].id, 'rampa-patio-biblioteca', 'la rampa del patio queda primera en el ranking');
});

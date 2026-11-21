import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const puntos = leer('puntos.json');
const nodoPorId = new Map(grafo.nodos.map((n) => [n.id, n]));

// Vecinos a los que se puede ir desde cada nodo, respetando el sentido único.
const vecinos = new Map(grafo.nodos.map((n) => [n.id, new Set()]));
for (const t of grafo.tramos) {
  vecinos.get(t.desde).add(t.hasta);
  if (!t.sentido_unico) vecinos.get(t.hasta).add(t.desde);
}

test('puntos.json es una lista de 4 a 6 puntos con ids únicos', () => {
  assert.ok(Array.isArray(puntos));
  assert.ok(puntos.length >= 4 && puntos.length <= 6);
  assert.equal(new Set(puntos.map((p) => p.id)).size, puntos.length);
});

test('p1 es la entrada principal (la demo escanea /punto/p1)', () => {
  assert.equal(puntos.find((p) => p.id === 'p1')?.nodo_id, 'entrada-principal');
});

test('cada punto tiene la forma del contrato §4', () => {
  for (const p of puntos) {
    for (const k of ['id', 'nodo_id', 'titulo', 'texto_voz']) {
      assert.equal(typeof p[k], 'string', `${p.id}: falta ${k}`);
      assert.ok(p[k].trim().length > 0, `${p.id}: ${k} vacío`);
    }
    assert.ok(Array.isArray(p.indicaciones) && p.indicaciones.length > 0, `${p.id}: sin indicaciones`);
    for (const i of p.indicaciones) {
      assert.ok(i.hacia && i.texto, `${p.id}: indicación incompleta`);
    }
  }
});

test('cada nodo_id existe en data/campus.json', () => {
  for (const p of puntos) assert.ok(nodoPorId.has(p.nodo_id), `${p.id}: nodo ${p.nodo_id} no existe`);
});

test('cada "hacia" es un nodo alcanzable directamente desde el nodo del punto', () => {
  const idPorNombre = new Map(grafo.nodos.map((n) => [n.nombre, n.id]));
  for (const p of puntos) {
    for (const i of p.indicaciones) {
      const destino = idPorNombre.get(i.hacia);
      assert.ok(destino, `${p.id}: "${i.hacia}" no es el nombre de ningún nodo`);
      assert.ok(vecinos.get(p.nodo_id).has(destino), `${p.id}: ${p.nodo_id} no conecta con ${destino}`);
    }
  }
});

test('el texto de voz no depende de ver el mapa', () => {
  for (const p of puntos) {
    assert.doesNotMatch(p.texto_voz, /\b(mira|ver el mapa|en pantalla|haz clic|toca el)\b/i, `${p.id}: depende de la vista`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularRuta } from './ruta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');
const puntos = leer('puntos.json');
const nodoPorId = new Map(grafo.nodos.map((n) => [n.id, n]));
const idPorNombre = new Map(grafo.nodos.map((n) => [n.nombre, n.id]));
const redondear5 = (m) => Math.round(m / 5) * 5;
const citarMetros = (texto) => [...texto.matchAll(/(\d+)\s*metros\b/gi)].map((m) => Number(m[1]));

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

test('p3: con el ascensor A bloqueado existe desvío en silla de ruedas al Edificio A, piso 2 y los metros citados coinciden', () => {
  const p3 = puntos.find((p) => p.id === 'p3');
  assert.ok(p3, 'falta el punto p3');

  // En motor/ruta.js bloquear el nodo 'ascensor-a' también impide usarlo como origen (`desde`).
  // Para calcular desde p3.nodo_id ('ascensor-a') bloqueamos los tramos del ascensor (`ascensor_id === 'ascensor-a'`),
  // y además validamos con `bloqueos: ['ascensor-a']` desde el vecino inmediato ('patio-central') más el tramo de salida.
  const tramosAscensor = grafo.tramos.filter((t) => t.ascensor_id === p3.nodo_id).map((t) => t.id);
  assert.ok(tramosAscensor.length > 0, 'el ascensor debe tener al menos un tramo');

  const desdeP3 = calcularRuta(grafo, perfiles, {
    desde: p3.nodo_id,
    hasta: 'edificio-a-p2',
    perfil: 'silla_ruedas',
    bloqueos: tramosAscensor,
  });
  assert.equal(desdeP3.ok, true, 'debe existir ruta en silla de ruedas desde p3 sin usar el ascensor');
  assert.equal(desdeP3.escalones, 0, 'el desvío en silla de ruedas no puede tener escalones');

  const desdePatio = calcularRuta(grafo, perfiles, {
    desde: 'patio-central',
    hasta: 'edificio-a-p2',
    perfil: 'silla_ruedas',
    bloqueos: ['ascensor-a'],
  });
  assert.equal(desdePatio.ok, true, 'debe existir ruta en silla de ruedas desde patio-central con ascensor-a bloqueado');
  assert.equal(desdePatio.escalones, 0);

  const tramoAlPatio = grafo.tramos.find(
    (t) =>
      !t.ascensor_id &&
      ((t.desde === p3.nodo_id && t.hasta === 'patio-central') ||
        (!t.sentido_unico && t.desde === 'patio-central' && t.hasta === p3.nodo_id)),
  );
  assert.ok(tramoAlPatio, 'p3 debe conectar con patio-central sin pasar por el ascensor');
  assert.equal(tramoAlPatio.metros + desdePatio.metros, desdeP3.metros);

  const metrosEsperadosP3 = redondear5(desdeP3.metros);
  const metrosEsperadosPatio = redondear5(desdePatio.metros);

  const indPiso2 = p3.indicaciones.find((i) => i.hacia === 'Edificio A, piso 2');
  const indPatio = p3.indicaciones.find((i) => i.hacia === 'Patio central');
  assert.ok(indPiso2, 'p3 debe tener indicación hacia Edificio A, piso 2');
  assert.ok(indPatio, 'p3 debe tener indicación hacia Patio central');

  assert.ok(
    citarMetros(p3.texto_voz).includes(metrosEsperadosP3),
    `p3.texto_voz debe citar ${metrosEsperadosP3} metros (redondeo a 5 m de ${desdeP3.metros} m)`,
  );
  assert.ok(
    citarMetros(indPiso2.texto).includes(metrosEsperadosP3),
    `p3 indicación a Edificio A, piso 2 debe citar ${metrosEsperadosP3} metros`,
  );
  assert.ok(
    citarMetros(indPatio.texto).includes(metrosEsperadosPatio),
    `p3 indicación a Patio central debe citar ${metrosEsperadosPatio} metros`,
  );

  for (const texto of [p3.texto_voz, ...p3.indicaciones.map((i) => i.texto)]) {
    assert.doesNotMatch(texto, /[→·—–]|--/, `símbolo no apto para voz en p3: "${texto}"`);
  }
  assert.match(p3.texto_voz, /barreras activas/i);
  assert.match(indPiso2.texto, /barreras activas/i);
});

test('cada indicación hacia un nodo vecino cita los metros del tramo directo (redondeo a 5 m)', () => {
  for (const p of puntos) {
    for (const i of p.indicaciones) {
      const destino = idPorNombre.get(i.hacia);
      if (!destino || !vecinos.get(p.nodo_id)?.has(destino)) continue;

      const tramosDirectos = grafo.tramos.filter(
        (t) =>
          (t.desde === p.nodo_id && t.hasta === destino) ||
          (!t.sentido_unico && t.desde === destino && t.hasta === p.nodo_id),
      );
      assert.ok(tramosDirectos.length > 0, `${p.id}: falta tramo directo entre ${p.nodo_id} y ${destino}`);

      const esperados = tramosDirectos.map((t) => redondear5(t.metros));
      const citados = citarMetros(i.texto);
      assert.ok(
        esperados.some((m) => citados.includes(m)),
        `${p.id} -> "${i.hacia}": "${i.texto}" debe citar ${esperados.join(' o ')} metros (citados: ${citados.join(', ') || 'ninguno'})`,
      );
    }
  }
});

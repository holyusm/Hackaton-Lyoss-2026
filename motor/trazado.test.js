import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { haversine, largoTramo } from './recalcular-metros.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const grafo = leer('../data/campus.json');
const plano = leer('../web/src/plano/casa-central.geo.json');
const nodos = new Map(grafo.nodos.map((n) => [n.id, n]));

// Edificios del plano como anillos [lng, lat] (exterior y patios interiores) en metros planos.
const K_LAT = 111320;
const K_LNG = 111320 * Math.cos((-33.035 * Math.PI) / 180);
const aXY = ([lng, lat]) => [(lng + 71.5955) * K_LNG, (lat + 33.035) * K_LAT];
const edificios = plano.features.filter((f) => f.properties.tipo === 'edificio').flatMap((f) => {
  const poligonos = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return poligonos.map(([exterior, ...huecos]) => ({ exterior: exterior.map(aXY), huecos: huecos.map((h) => h.map(aXY)) }));
});
const dentro = ([x, y], anillo) => {
  let c = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [x1, y1] = anillo[i], [x2, y2] = anillo[j];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) c = !c;
  }
  return c;
};
const enEdificio = (p, e) => dentro(p, e.exterior) && !e.huecos.some((h) => dentro(p, h));
const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
const secruzan = (a, b, c, d) => orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
const lados = (anillo) => anillo.map((p, i) => [p, anillo[(i + 1) % anillo.length]]);
const cruzaEdificio = (a, b, e) => [e.exterior, ...e.huecos].some((anillo) => lados(anillo).some(([c, d]) => secruzan(a, b, c, d)));

const conTrazado = grafo.tramos.filter((t) => !t.ascensor_id);

test('todos los tramos a pie tienen trazado', () => {
  for (const t of conTrazado) assert.ok(Array.isArray(t.trazado), `${t.id} sin trazado`);
});

test('metros es el largo real del trazado, con una tolerancia de 10 % (o 5 m)', () => {
  for (const t of conTrazado) {
    const real = largoTramo(t, nodos.get(t.desde), nodos.get(t.hasta));
    assert.ok(Math.abs(t.metros - real) <= Math.max(5, real * 0.1), `${t.id}: metros ${t.metros}, largo real ${Math.round(real)}`);
  }
});

test('el largo del trazado no supera 2,5 veces la distancia en línea recta más 150 m', () => {
  for (const t of conTrazado) {
    const recto = haversine(nodos.get(t.desde), nodos.get(t.hasta));
    const real = largoTramo(t, nodos.get(t.desde), nodos.get(t.hasta));
    assert.ok(real <= recto * 2.5 + 150, `${t.id}: ${Math.round(real)} m para ${Math.round(recto)} m en línea recta`);
  }
});

test('ningún trazado cruza un edificio, salvo dentro del edificio donde empieza o termina', () => {
  for (const t of conTrazado) {
    const linea = [nodos.get(t.desde), ...(t.trazado ?? []).map(([lat, lng]) => ({ lat, lng })), nodos.get(t.hasta)].map((p) => aXY([p.lng, p.lat]));
    const propios = new Set();
    edificios.forEach((e, i) => { if (enEdificio(linea[0], e) || enEdificio(linea.at(-1), e)) propios.add(i); });
    for (let k = 0; k < linea.length - 1; k++) {
      edificios.forEach((e, i) => {
        if (propios.has(i)) return;
        assert.ok(!cruzaEdificio(linea[k], linea[k + 1], e), `${t.id}: el tramo ${k + 1} de su línea cruza un edificio`);
        if (k > 0) assert.ok(!enEdificio(linea[k], e), `${t.id}: un punto del trazado cae dentro de un edificio`);
      });
    }
  }
});

test('los puntos del trazado están dentro de los límites del plano', () => {
  const [[s, o], [n, e]] = plano.limites;
  for (const t of conTrazado) for (const [lat, lng] of t.trazado ?? []) assert.ok(lat >= s && lat <= n && lng >= o && lng <= e, `${t.id}: punto fuera del plano`);
});

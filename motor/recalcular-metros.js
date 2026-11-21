// Recalcula `metros` y `minutos_medidos` en data/campus.json a partir de las coordenadas
// reales (lat/lng) de sus nodos. Idempotente: volver a correrlo deja el mismo resultado.
// Uso: node motor/recalcular-metros.js
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADIO_TIERRA_M = 6371000;
const VELOCIDAD_M_POR_MIN = 72; // 1,2 m/s
const MIN_POR_ESCALON = 2 / 60; // 2 s por escalón

export function haversine(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

const redondear5 = (m) => Math.max(5, Math.round(m / 5) * 5);
const redondear1 = (x) => Math.round(x * 10) / 10;

export function recalcularTramo(tramo, nodosPorId) {
  const origen = nodosPorId.get(tramo.desde);
  const destino = nodosPorId.get(tramo.hasta);
  if (!origen) throw new Error(`tramo ${tramo.id}: origen "${tramo.desde}" no existe`);
  if (!destino) throw new Error(`tramo ${tramo.id}: destino "${tramo.hasta}" no existe`);

  const dist = haversine(origen, destino);
  const esAscensor = Boolean(tramo.ascensor_id);
  const esVerticalCorto = origen.piso !== destino.piso && dist < 5;

  const metros = esAscensor || esVerticalCorto ? tramo.metros : redondear5(dist);
  const minutos_medidos = esAscensor
    ? tramo.minutos_medidos
    : redondear1(metros / VELOCIDAD_M_POR_MIN + (tramo.escalones ?? 0) * MIN_POR_ESCALON);

  const nota = esAscensor
    ? 'ascensor (conserva)'
    : esVerticalCorto
      ? 'cambio de piso < 5 m (conserva metros)'
      : '';

  return {
    tramo: { ...tramo, metros, minutos_medidos },
    fila: {
      id: tramo.id,
      desde: tramo.desde,
      hasta: tramo.hasta,
      haversine: redondear1(dist),
      metrosAntes: tramo.metros,
      metrosDespues: metros,
      minutosAntes: tramo.minutos_medidos,
      minutosDespues: minutos_medidos,
      nota,
    },
  };
}

export function recalcularGrafo(grafo) {
  const nodosPorId = new Map(grafo.nodos.map((n) => [n.id, n]));
  const tramos = [];
  const filas = [];
  for (const t of grafo.tramos) {
    const res = recalcularTramo(t, nodosPorId);
    tramos.push(res.tramo);
    filas.push(res.fila);
  }
  return { grafo: { ...grafo, tramos }, filas };
}

function formatoObjetoLinea(obj) {
  const pares = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return `{ ${pares.join(', ')} }`;
}

export function formatearCampus(grafo) {
  const entradas = Object.entries(grafo).map(([k, v]) => {
    if (Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
      const items = v.map((x) => `    ${formatoObjetoLinea(x)}`).join(',\n');
      return `  ${JSON.stringify(k)}: [\n${items}\n  ]`;
    }
    return `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });
  return `{\n${entradas.join(',\n')}\n}\n`;
}

export function tablaMarkdown(filas) {
  const cabecera = [
    '| id | desde | hasta | metros antes | metros después | minutos antes | minutos después |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
  ];
  const cuerpo = filas.map(
    (f) => `| ${f.id} | ${f.desde} | ${f.hasta} | ${f.metrosAntes} | ${f.metrosDespues} | ${f.minutosAntes} | ${f.minutosDespues} |`,
  );
  return [...cabecera, ...cuerpo].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rutaCampus = new URL('../data/campus.json', import.meta.url);
  const original = JSON.parse(readFileSync(rutaCampus, 'utf8'));
  const { grafo, filas } = recalcularGrafo(original);
  writeFileSync(rutaCampus, formatearCampus(grafo));
  console.log(tablaMarkdown(filas));
}

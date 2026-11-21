// Cifras de impacto para el pitch: compara rutas por perfil con el motor real.
// Uso: node motor/impacto.js   (imprime tabla Markdown y resumen; nada calculado a mano)
// Sin dependencias. Lee data/campus.json y data/perfiles.json y llama a compararPerfiles.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compararPerfiles } from './ruta.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));

// Pares con ids reales del grafo. Los que llevan `bloqueos` son escenarios con un ascensor fuera de servicio.
export const PARES = [
  { desde: 'entrada-principal', hasta: 'sala-a201' },
  { desde: 'entrada-principal', hasta: 'biblioteca' },
  { desde: 'entrada-principal', hasta: 'casino' },
  { desde: 'entrada-principal', hasta: 'bano-b' },
  { desde: 'entrada-principal', hasta: 'edificio-a-p2' },
  { desde: 'entrada-principal', hasta: 'sala-a201', bloqueos: ['ascensor-a'] },
  { desde: 'entrada-principal', hasta: 'sala-c231' },
  { desde: 'entrada-principal', hasta: 'sala-c231', bloqueos: ['ascensor-c'] },
];

// Una fila por par: { desde, hasta, bloqueos, nombreDesde, nombreHasta, resultados }.
// `resultados` es exactamente lo que devuelve compararPerfiles (el mismo cálculo de GET /api/comparar).
export function filas(grafo = leer('campus.json'), perfiles = leer('perfiles.json'), pares = PARES) {
  const nombre = new Map(grafo.nodos.map((n) => [n.id, n.nombre]));
  return pares.map((p) => {
    const bloqueos = p.bloqueos || [];
    return {
      desde: p.desde,
      hasta: p.hasta,
      bloqueos,
      nombreDesde: nombre.get(p.desde),
      nombreHasta: nombre.get(p.hasta),
      resultados: compararPerfiles(grafo, perfiles, { desde: p.desde, hasta: p.hasta, bloqueos }),
    };
  });
}

const num = (n) => String(n).replace('.', ',');
const celda = (r) => (r.ok ? `${num(r.metros)} m · ${num(r.minutos)} min · ${r.escalones} esc.` : 'sin ruta accesible');
const etiqueta = (f) => `${f.nombreDesde} → ${f.nombreHasta}${f.bloqueos.length ? ` (bloqueo: ${f.bloqueos.join(', ')})` : ''}`;

export function tablaMarkdown(rows, perfiles = leer('perfiles.json')) {
  const lineas = [
    `| Origen → destino | ${perfiles.map((p) => p.nombre).join(' | ')} |`,
    `|---|${perfiles.map(() => '---').join('|')}|`,
  ];
  for (const f of rows) lineas.push(`| ${etiqueta(f)} | ${perfiles.map((p) => celda(f.resultados[p.id])).join(' | ')} |`);
  return lineas.join('\n');
}

const redondea = (n) => Math.round(n * 10) / 10;

// Resumen de impacto del perfil `perfil` frente al estándar.
export function resumen(rows, perfil = 'silla_ruedas') {
  // Destinos = pares sin bloqueos (el escenario con el ascensor bloqueado repite un destino).
  const destinos = rows.filter((f) => !f.bloqueos.length);
  const imposibles = destinos.filter((f) => !f.resultados[perfil].ok);
  const comparables = rows.filter((f) => f.resultados[perfil].ok && f.resultados.estandar.ok);
  const difs = comparables.map((f) => ({
    f,
    metros: redondea(f.resultados[perfil].metros - f.resultados.estandar.metros),
    minutos: redondea(f.resultados[perfil].minutos - f.resultados.estandar.minutos),
  }));
  // El promedio solo usa pares sin bloqueos: el escenario de demo se reporta aparte.
  const normales = difs.filter((d) => !d.f.bloqueos.length);
  const prom = (k) => (normales.length ? redondea(normales.reduce((s, d) => s + d[k], 0) / normales.length) : null);
  return { total: rows.length, destinos: destinos.length, imposibles, comparables, difs, normales: normales.length, promMetros: prom('metros'), promMinutos: prom('minutos') };
}

const signo = (n) => (n > 0 ? `+${num(n)}` : num(n));

export function resumenMarkdown(rows, perfiles = leer('perfiles.json')) {
  const nombreSilla = perfiles.find((p) => p.id === 'silla_ruedas').nombre.toLowerCase();
  const s = resumen(rows, 'silla_ruedas');
  const l = [];
  l.push(`- Pares evaluados: ${s.total} (los de bloqueo son escenarios con un ascensor fuera de servicio).`);
  l.push(`- Pares sin ruta accesible en ${nombreSilla}: ${s.imposibles.length} de los ${s.destinos} destinos${s.imposibles.length ? ` (${s.imposibles.map(etiqueta).join('; ')})` : ''}.`);
  l.push(`- Pares con ruta en ${nombreSilla} y en estándar: ${s.comparables.length}. Diferencia de la ruta accesible frente a la estándar (metros, minutos):`);
  for (const d of s.difs) {
    const e = d.f.resultados.estandar;
    const a = d.f.resultados.silla_ruedas;
    const texto = d.metros === 0 && d.minutos === 0 ? 'misma ruta en metros y minutos' : `${signo(d.metros)} m, ${signo(d.minutos)} min (${d.minutos < 0 ? 'la accesible es más rápida' : d.minutos > 0 ? 'la accesible es más lenta' : 'mismo tiempo'})`;
    l.push(`  - ${etiqueta(d.f)}: ${texto}; escalones evitados: ${e.escalones - a.escalones}.`);
  }
  if (s.normales) l.push(`- Promedio de los ${s.normales} pares sin bloqueo: ${signo(s.promMetros)} m y ${signo(s.promMinutos)} min.`);
  return l.join('\n');
}

export function informe() {
  const perfiles = leer('perfiles.json');
  const rows = filas(leer('campus.json'), perfiles);
  return `${tablaMarkdown(rows, perfiles)}\n\n${resumenMarkdown(rows, perfiles)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(informe());

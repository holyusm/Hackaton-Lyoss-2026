// Simulador de obras "¿Qué arreglar primero?" (Lote 8). Contrato: docs/contratos.md §7.
// Módulo puro, sin dependencias. Siempre sobre el campus construido: sin reportes (bloqueos = []).
import { calcularRuta } from './ruta.js';

const LUGARES = new Set(['entrada', 'edificio', 'sala', 'bano']);
const EVALUADOS = ['silla_ruedas', 'movilidad_reducida', 'baja_vision'];
const PISO_MALO = new Set(['adoquin', 'irregular']);
const OCULTOS = ['cambios', 'tramos_nuevos', 'nodos_nuevos'];

const r1 = (x) => Math.round(x * 10) / 10;
// Sin muestras no hay promedio: null ("sin trayectos comparables"), no 0, que diría "sin desvío" (#133).
const promedio = (xs) => (xs.length ? r1(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

// Copia del grafo con las obras aplicadas. Nunca toca el original.
export function aplicarObras(grafo, obras) {
  const g = structuredClone(grafo);
  const tramos = new Map(g.tramos.map((t) => [t.id, t]));
  for (const o of obras) {
    // Un tramo_id inexistente se ignora: data/obras.json lo valida en sus tests (motor/obras.test.js).
    for (const c of o.cambios ?? []) if (tramos.has(c.tramo_id)) Object.assign(tramos.get(c.tramo_id), c.valores);
    g.nodos.push(...structuredClone(o.nodos_nuevos ?? []));
    g.tramos.push(...structuredClone(o.tramos_nuevos ?? []));
  }
  return g;
}

// Trayecto con barrera según GLOSSARY.md.
function conBarrera(perfil, ruta, tramos) {
  if (perfil === 'estandar') return false;
  if (!ruta.ok) return true;
  if (perfil === 'movilidad_reducida') return ruta.escalones > 0;
  if (perfil === 'baja_vision') {
    return ruta.tramos.some((id) => { const t = tramos.get(id); return PISO_MALO.has(t.superficie) || t.guia_tactil === false; });
  }
  return false; // silla_ruedas: solo cuando no hay ruta
}

// Para cada perfil, el resultado de cada trayecto ("a>b") en este grafo.
function evaluar(grafo, perfiles, lugares, perfilIds) {
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  const ev = {};
  for (const p of new Set(['estandar', ...perfilIds])) {
    const m = new Map();
    for (const a of lugares) for (const b of lugares) {
      if (a === b) continue;
      const r = calcularRuta(grafo, perfiles, { desde: a, hasta: b, perfil: p, bloqueos: [] });
      m.set(`${a}>${b}`, { ok: r.ok, minutos: r.minutos, barrera: conBarrera(p, r, tramos) });
    }
    ev[p] = m;
  }
  return ev;
}

const barreraEn = (ev, perfil, k) =>
  perfil === 'todos' ? EVALUADOS.some((p) => ev[p].get(k).barrera) : ev[perfil].get(k).barrera;

// Minutos de más que el perfil tarda frente a Estándar en un trayecto (null si alguno no tiene ruta).
// Nunca negativo: Estándar se elige por metros y no por minutos, así que a veces otra ruta tarda menos;
// eso no es un "desvío" (#141).
function extra(ev, perfil, k) {
  const r = ev[perfil].get(k), e = ev.estandar.get(k);
  return r.ok && e.ok ? Math.max(0, r.minutos - e.minutos) : null;
}

function resumen(ev, perfil, claves) {
  return {
    trayectos_evaluados: claves.length,
    trayectos_con_barrera: claves.filter((k) => barreraEn(ev, perfil, k)).length,
    minutos_extra_prom: perfil === 'todos' ? null : promedio(claves.map((k) => extra(ev, perfil, k)).filter((x) => x !== null)),
  };
}

const sinBarreraTras = (antes, despues, perfil, claves) =>
  claves.filter((k) => barreraEn(antes, perfil, k) && !barreraEn(despues, perfil, k)).length;

export function simular(grafo, perfiles, obras, { perfil = 'silla_ruedas', ids = [] } = {}) {
  if (perfil !== 'todos' && !perfiles.some((p) => p.id === perfil)) throw new Error(`perfil desconocido: ${perfil}`);
  const faltante = ids.find((id) => !obras.some((o) => o.id === id));
  if (faltante) throw new Error(`obra desconocida: ${faltante}`);
  const elegidas = ids.map((id) => obras.find((o) => o.id === id));

  const lugares = grafo.nodos.filter((n) => LUGARES.has(n.tipo)).map((n) => n.id);
  const claves = lugares.flatMap((a) => lugares.filter((b) => b !== a).map((b) => `${a}>${b}`));
  const delPerfil = perfil === 'todos' ? EVALUADOS : [perfil];
  // Con obras elegidas hace falta Hoy en los tres perfiles para trayectos_sin_barrera_por_perfil.
  const paraHoy = ids.length ? [...new Set([...delPerfil, ...EVALUADOS])] : delPerfil;

  const hoy = evaluar(grafo, perfiles, lugares, paraHoy);

  const listaObras = obras.map((o) => {
    const ev = evaluar(aplicarObras(grafo, [o]), perfiles, lugares, delPerfil);
    const ahorros = perfil === 'todos' ? null : claves
      .filter((k) => hoy[perfil].get(k).ok && ev[perfil].get(k).ok)
      .map((k) => hoy[perfil].get(k).minutos - ev[perfil].get(k).minutos);
    const visible = Object.fromEntries(Object.entries(o).filter(([c]) => !OCULTOS.includes(c)));
    return { ...visible, trayectos_sin_barrera: sinBarreraTras(hoy, ev, perfil, claves), minutos_ahorrados_prom: ahorros && promedio(ahorros) };
  }).sort((a, b) => b.trayectos_sin_barrera - a.trayectos_sin_barrera
    || (b.minutos_ahorrados_prom ?? 0) - (a.minutos_ahorrados_prom ?? 0));

  let conObras = null;
  let actual = hoy;
  if (ids.length) {
    actual = evaluar(aplicarObras(grafo, elegidas), perfiles, lugares, paraHoy);
    conObras = {
      ...resumen(actual, perfil, claves),
      trayectos_sin_barrera_por_perfil: Object.fromEntries(EVALUADOS.map((p) => [p, sinBarreraTras(hoy, actual, p, claves)])),
    };
  }

  const zonas = lugares.map((id) => {
    const n = grafo.nodos.find((x) => x.id === id);
    const llegan = claves.filter((k) => k.endsWith(`>${id}`));
    const conB = llegan.filter((k) => barreraEn(actual, perfil, k)).length;
    const minutos = perfil === 'todos' ? null
      : promedio(llegan.map((k) => extra(actual, perfil, k)).filter((x) => x !== null));
    const estado = conB > 0 ? 'con_barrera' : minutos > 0.5 ? 'desvio' : 'accesible';
    return { nodo_id: id, nombre: n.nombre, lat: n.lat, lng: n.lng, estado, trayectos_con_barrera: conB, minutos_extra: minutos };
  });

  return { perfil, hoy: resumen(hoy, perfil, claves), con_obras: conObras, obras: listaObras, zonas };
}

// Lógica pura de la lista de edificios de /plano (Lote 10). Sin React ni imports de JSON: se prueba con node:test.
// `edificios.js` la aplica al GeoJSON del plano.

// Edificios sin nombre en OSM que el equipo identificó.
export const EXTRA = {
  'relation/17542343': { letra: 'B', sub: 'Edificio central · nombre por confirmar' },
};

export function limpiar(nombre) {
  return (nombre || '')
    .replace('Comerdores', 'Comedores')
    .replace('Federación de Estudiantes de la Universidad Técnica Federico Santa María', 'FEUTFSM · Federación de Estudiantes');
}

// Anillos exteriores [lng, lat] de un Polygon o MultiPolygon.
const anillos = (geometry) => (geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]));

// Área y centroide de un anillo [lng, lat]. Se restan las coordenadas del primer punto: con valores de -71 y -33 y
// diferencias de 1e-6, los productos cruzados pierden toda la precisión.
function medidas(anillo) {
  const [x0, y0] = anillo[0];
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const xi = anillo[i][0] - x0, yi = anillo[i][1] - y0, xj = anillo[j][0] - x0, yj = anillo[j][1] - y0;
    const f = xj * yi - xi * yj;
    a += f; x += (xj + xi) * f; y += (yj + yi) * f;
  }
  if (Math.abs(a) < 1e-18) return { lat: y0, lng: x0, area: 0 };
  return { lat: y0 + y / (3 * a), lng: x0 + x / (3 * a), area: Math.abs(a / 2) };
}

function cajaDe(geometry) {
  let s = Infinity, w = Infinity, n = -Infinity, e = -Infinity;
  for (const anillo of anillos(geometry)) for (const [lng, lat] of anillo) { s = Math.min(s, lat); n = Math.max(n, lat); w = Math.min(w, lng); e = Math.max(e, lng); }
  return [[s, w], [n, e]];
}

/**
 * Edificios del campus agrupados por letra y, si no hay, por nombre. De cada grupo se queda el polígono más grande.
 * Orden: primero los que tienen letra (A, B, C... con orden numérico: M2 después de M) y luego los que solo tienen nombre.
 * @returns [{ clave, letra, titulo, sub, pisos, osm, feature, bounds, centro, area }]
 */
export function crearEdificios(geo) {
  const porClave = new Map();
  for (const feature of geo.features) {
    const p = feature.properties;
    if (p.tipo !== 'edificio' || !p.campus) continue;
    const extra = EXTRA[p.osm] ?? {};
    const letra = extra.letra || p.letra || null;
    const nombre = limpiar(extra.nombre || p.nombre);
    if (!letra && !nombre) continue;
    const clave = letra || nombre;
    const grande = anillos(feature.geometry).map(medidas).sort((a, b) => b.area - a.area)[0];
    const previo = porClave.get(clave);
    if (previo && previo.area >= grande.area) continue;
    const partes = nombre.split(' - ');
    porClave.set(clave, {
      clave, letra, osm: p.osm,
      titulo: letra ? `Edificio ${letra}` : partes[0],
      sub: extra.sub || partes[1] || (letra ? '' : 'Edificio del campus'),
      pisos: p.pisos ? Number(p.pisos) : null,
      feature, bounds: cajaDe(feature.geometry), centro: [grande.lat, grande.lng], area: grande.area,
    });
  }
  return [...porClave.values()].sort((a, b) => {
    if (Boolean(a.letra) !== Boolean(b.letra)) return a.letra ? -1 : 1;
    return (a.letra || a.titulo).localeCompare(b.letra || b.titulo, 'es', { numeric: true });
  });
}

// Centro [lat, lng] de un polígono (para poner la etiqueta de una sala).
export function centroDe(geometry) {
  const grande = anillos(geometry).map(medidas).sort((a, b) => b.area - a.area)[0];
  return [grande.lat, grande.lng];
}

// ¿Este feature de edificio pertenece al grupo `clave`? (el C tiene dos polígonos: se resaltan los dos)
export function perteneceA(feature, clave) {
  const p = feature.properties;
  if (p.tipo !== 'edificio' || !p.campus) return false;
  const extra = EXTRA[p.osm] ?? {};
  return (extra.letra || p.letra || limpiar(extra.nombre || p.nombre)) === clave;
}

// Pisos que se ofrecen en la ficha: el C es -1, 1 y 2; si se conoce el número de pisos, 1..pisos (máximo 8); si no, solo el 1.
export function pisosDe(edificio) {
  if (edificio.letra === 'C') return [-1, 1, 2];
  if (edificio.pisos) return Array.from({ length: Math.min(edificio.pisos, 8) }, (_, i) => i + 1);
  return [1];
}

export const pisoInicial = (edificio) => (edificio.letra === 'C' ? 2 : 1);

// Salas y pasillos de un edificio en un piso. Hoy solo el C tiene interior en OSM.
export function interior(geo, letra, piso) {
  if (letra !== 'C') return [];
  return geo.features.filter((f) => (f.properties.tipo === 'sala' || f.properties.tipo === 'pasillo') && f.properties.nivel === String(piso));
}

// id del nodo de data/campus.json que representa al edificio (para "Cómo llegar sin barreras"), o null.
export function nodoDestino(grafo, letra) {
  if (!letra) return null;
  return grafo.nodos.find((n) => n.edificio === letra && n.tipo === 'edificio')?.id ?? null;
}

// Búsqueda por letra, título y subtítulo, sin mayúsculas ni tildes.
const norm = (s) => (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export function filtrarEdificios(lista, q) {
  const t = norm(q);
  if (!t) return lista;
  return lista.filter((e) => norm(`${e.letra ?? ''} ${e.titulo} ${e.sub}`).includes(t));
}

// Genera casa-central.geo.json a partir de OpenStreetMap (Overpass).
// Se corre a mano, una vez: node web/src/plano/generar.mjs
// Datos © colaboradores de OpenStreetMap, licencia ODbL.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RELACION = 8187017; // "Universidad Técnica Federico Santa María", Casa Central
// Límites del campus con un margen para ver calles y edificios vecinos.
const CAJA = [-33.0380, -71.5990, -33.0328, -71.5905]; // sur, oeste, norte, este

const consulta = `
[out:json][timeout:90];
rel(${RELACION});map_to_area->.campus;
way[building](area.campus)->.edificiosCampus;
.edificiosCampus out ids;
(
  rel(${RELACION});
  way[building](${CAJA});
  rel[building](${CAJA});
  way[highway~"^(footway|pedestrian|steps|path|corridor|service|residential|tertiary|secondary|primary|living_street)$"](${CAJA});
  way[indoor](area.campus);
  node[entrance](area.campus);
  node[amenity](area.campus);
  node[highway=elevator](area.campus);
);
out body geom;
`;

const r6 = (n) => Math.round(n * 1e6) / 1e6;
const anillo = (geom) => geom.map((p) => [r6(p.lon), r6(p.lat)]);
const cerrado = (geom) => geom.length > 3 && geom[0].lat === geom.at(-1).lat && geom[0].lon === geom.at(-1).lon;

// Une los tramos "outer" de una relación en anillos cerrados.
function unirAnillos(miembros) {
  const tramos = miembros.map((m) => m.geometry.map((p) => [p.lon, p.lat]));
  const anillos = [];
  const igual = (a, b) => a[0] === b[0] && a[1] === b[1];
  while (tramos.length) {
    let anillo = tramos.shift();
    let avanzo = true;
    while (!igual(anillo[0], anillo.at(-1)) && avanzo) {
      avanzo = false;
      for (let i = 0; i < tramos.length; i++) {
        const t = tramos[i];
        if (igual(anillo.at(-1), t[0])) anillo = anillo.concat(t.slice(1));
        else if (igual(anillo.at(-1), t.at(-1))) anillo = anillo.concat(t.slice(0, -1).reverse());
        else continue;
        tramos.splice(i, 1); avanzo = true; break;
      }
    }
    anillos.push(anillo);
  }
  return anillos;
}

function dentro([x, y], anillo) {
  let si = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i], [xj, yj] = anillo[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) si = !si;
  }
  return si;
}

function centro(geom) {
  let x = 0, y = 0;
  for (const p of geom) { x += p.lon; y += p.lat; }
  return [x / geom.length, y / geom.length];
}

function letraDe(nombre = '') {
  const m = nombre.match(/^Edificio\s+([A-Z]\d?)\b/);
  return m ? m[1] : null;
}

function tipoDe(t) {
  if (t.building) return 'edificio';
  if (t.indoor) return t.indoor === 'room' || t.indoor === 'area' ? 'sala' : 'pasillo';
  if (t.highway === 'steps') return 'escalera';
  if (t.highway === 'pedestrian') return 'patio';
  if (['footway', 'path', 'corridor'].includes(t.highway)) return t.ramp === 'yes' || t.incline ? 'rampa' : 'sendero';
  if (t.highway === 'elevator') return 'ascensor';
  if (t.highway) return 'calle';
  if (t.entrance) return 'entrada';
  if (t.amenity) return 'servicio';
  return null;
}

async function main() {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': 'campus-prototype/0.1', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(consulta),
  });
  if (!res.ok) throw new Error(`Overpass respondió ${res.status}`);
  const { elements } = await res.json();

  const delCampus = new Set();
  const features = [];
  let limites = null;
  let anillosCampus = [];
  const pendientes = [];

  for (const e of elements) {
    if (!e.geometry && !e.members && e.lat === undefined) { delCampus.add(e.id); continue; }
    const t = e.tags || {};

    if (e.type === 'relation' && e.id === RELACION) {
      const exteriores = e.members.filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry);
      anillosCampus = unirAnillos(exteriores);
      limites = e.bounds;
      features.push({
        type: 'Feature',
        properties: { tipo: 'campus', nombre: t.name },
        geometry: { type: 'Polygon', coordinates: anillosCampus.map((a) => a.map(([x, y]) => [r6(x), r6(y)])) },
      });
      continue;
    }

    const tipo = tipoDe(t);
    if (!tipo) continue;
    const props = { tipo, osm: `${e.type}/${e.id}` };
    if (t.name) props.nombre = t.name;
    if (t.ref) props.ref = t.ref;
    if (t.level) props.nivel = t.level;
    if (t['building:levels']) props.pisos = Number(t['building:levels']);
    if (t.wheelchair) props.silla = t.wheelchair;
    if (t.amenity) props.servicio = t.amenity;
    if (tipo === 'edificio') {
      // Fuera del contorno igual cuentan los edificios que la USM opera (Sansamed, FEUTFSM, RR.HH.).
      const usm = /Santa Mar[ií]a|UTFSM|Sansamed|Recursos Humanos/i;
      props.campus = (e.type === 'way' && delCampus.has(e.id)) || usm.test(t.operator || '') || usm.test(t.name || '');
      const g = e.geometry || e.members?.find((m) => m.role === 'outer' && m.geometry)?.geometry;
      if (g) pendientes.push([props, centro(g)]);
      const letra = letraDe(t.name);
      if (letra) props.letra = letra;
    }

    let geometry = null;
    if (e.type === 'node') {
      geometry = { type: 'Point', coordinates: [r6(e.lon), r6(e.lat)] };
    } else if (e.type === 'way' && e.geometry) {
      const poligono = (tipo === 'edificio' || tipo === 'sala' || (tipo === 'patio' && t.area === 'yes')) && cerrado(e.geometry);
      geometry = poligono
        ? { type: 'Polygon', coordinates: [anillo(e.geometry)] }
        : { type: 'LineString', coordinates: anillo(e.geometry) };
    } else if (e.type === 'relation' && e.members) {
      const ext = e.members.filter((m) => m.role === 'outer' && m.geometry && cerrado(m.geometry));
      if (ext.length) geometry = { type: 'MultiPolygon', coordinates: ext.map((m) => [anillo(m.geometry)]) };
    }
    if (geometry) features.push({ type: 'Feature', properties: props, geometry });
  }

  // Un edificio es del campus si su centro cae dentro del contorno de la relación.
  for (const [props, c] of pendientes) {
    if (anillosCampus.some((a) => dentro(c, a))) props.campus = true;
  }

  // Orden de dibujo: calles, campus, patios, edificios, salas, senderos, escaleras, puntos.
  const orden = ['calle', 'campus', 'patio', 'edificio', 'sala', 'pasillo', 'sendero', 'rampa', 'escalera', 'entrada', 'ascensor', 'servicio'];
  features.sort((a, b) => orden.indexOf(a.properties.tipo) - orden.indexOf(b.properties.tipo));

  const salida = {
    type: 'FeatureCollection',
    atribucion: '© colaboradores de OpenStreetMap (ODbL)',
    generado: new Date().toISOString(),
    limites: limites && [[limites.minlat, limites.minlon], [limites.maxlat, limites.maxlon]],
    features,
  };
  const destino = fileURLToPath(new URL('./casa-central.geo.json', import.meta.url));
  writeFileSync(destino, JSON.stringify(salida) + '\n');

  const cuenta = {};
  for (const f of features) cuenta[f.properties.tipo] = (cuenta[f.properties.tipo] || 0) + 1;
  console.log('Escrito', destino, cuenta);
}

main().catch((err) => { console.error(err); process.exit(1); });

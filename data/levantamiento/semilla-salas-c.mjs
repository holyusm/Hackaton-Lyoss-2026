// Genera la semilla de data/levantamiento/salas.csv: las salas y baños reales del Edificio C, piso 2, desde OSM.
// Se corrió una vez; después el equipo edita salas.csv a mano. Uso: node data/levantamiento/semilla-salas-c.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { centroDe } from '../../web/src/plano/edificios-lib.js';

const geo = JSON.parse(readFileSync(new URL('../../web/src/plano/casa-central.geo.json', import.meta.url), 'utf8'));
const salas = geo.features
  .filter((f) => f.properties.tipo === 'sala' && f.properties.nivel === '2' && f.geometry.type === 'Polygon')
  .map((f) => ({ p: f.properties, centro: centroDe(f.geometry) }));

const filas = [];
let banos = 0;
for (const { p, centro } of salas) {
  const [lat, lng] = centro.map((x) => x.toFixed(6));
  if (p.servicio === 'toilets') {
    banos += 1;
    filas.push(['bano-c2-' + banos, `Baño del piso 2 del Edificio C (${banos})`, 'bano', 'C', 2, '', lat, lng, 'OSM']);
    continue;
  }
  const codigo = /^C\d{3}S?$/.test(p.ref ?? '') ? p.ref : /^C\d{3}$/.test(p.nombre ?? '') ? p.nombre : null;
  if (!codigo) continue; // las 5 sin nombre en OSM no se pueden identificar: se agregan a mano cuando se levanten
  const nombre = p.nombre && p.nombre !== codigo ? `${p.nombre[0].toUpperCase()}${p.nombre.slice(1)} ${codigo}` : `Sala ${codigo}`;
  filas.push([`sala-${codigo.toLowerCase()}`, nombre, 'sala', 'C', 2, '', lat, lng, 'OSM']);
}
filas.sort((a, b) => a[0].localeCompare(b[0]));
const csv = ['id,nombre,tipo,edificio,piso,departamento,lat,lng,notas', ...filas.map((f) => f.join(','))].join('\n') + '\n';
writeFileSync(new URL('./salas.csv', import.meta.url), csv);
console.log(`${filas.length} lugares (${filas.length - banos} salas y ${banos} baños)`);

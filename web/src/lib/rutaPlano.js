// Lógica pura de las salas y la ruta en /plano (#189, P2). Sin React ni red: se prueba con node:test.
import { centroDe } from '../plano/edificios-lib.js';

const esLugarInterior = (n) => (n.tipo === 'sala' || n.tipo === 'bano') && n.edificio;
const norm = (s) => (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// Salas y baños de un edificio en un piso, ordenados por nombre.
export function salasDe(grafo, letra, piso) {
  return grafo.nodos.filter((n) => esLugarInterior(n) && n.edificio === letra && n.piso === piso).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
}

// Búsqueda de salas por nombre, id o departamento (sin mayúsculas ni tildes). Máximo `limite` resultados.
export function buscarSalas(grafo, q, limite = 8) {
  const t = norm(q);
  if (!t) return [];
  return grafo.nodos.filter((n) => esLugarInterior(n) && norm(`${n.nombre} ${n.id} ${n.departamento ?? ''}`).includes(t)).slice(0, limite);
}

// La sala o el baño del grafo que corresponde a un polígono del plano (el más cercano a su centro, a menos de 8 m).
export function salaDeFeature(grafo, letra, piso, feature) {
  // Los pasillos del interior son líneas: no corresponden a ninguna sala.
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') return null;
  const [lat, lng] = centroDe(feature.geometry);
  const kLng = Math.cos((lat * Math.PI) / 180);
  let mejor = null;
  let dMejor = Infinity;
  for (const n of salasDe(grafo, letra, piso)) {
    const d = Math.hypot((n.lat - lat) * 111320, (n.lng - lng) * 111320 * kLng);
    if (d < dMejor) { dMejor = d; mejor = n; }
  }
  return dMejor <= 8 ? mejor : null;
}

// Las salas que no tienen polígono en el plano (las agregadas a mano en otros edificios) se dibujan como marcador.
export function salasSinPoligono(grafo, letra, piso, features) {
  const dibujadas = new Set(features.map((f) => salaDeFeature(grafo, letra, piso, f)?.id).filter(Boolean));
  return salasDe(grafo, letra, piso).filter((n) => !dibujadas.has(n.id));
}

export const textoLugar = (n) => {
  if (!n) return '';
  const donde = n.edificio ? `, Edificio ${n.edificio}${n.piso > 0 ? `, piso ${n.piso}` : ''}` : '';
  return `${n.nombre}${n.tipo === 'sala' || n.tipo === 'bano' ? donde : ''}`;
};

/**
 * Marcas de cambio de piso de una ruta: una por tramo que cambia de piso, en el nodo de llegada.
 * @returns [{ punto: [lat, lng], texto: 'Ascensor al piso 2', paso: índice del paso }]
 */
export function marcasPiso(grafo, resultado) {
  if (!resultado?.ok) return [];
  const nodos = new Map(grafo.nodos.map((n) => [n.id, n]));
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  return resultado.tramos.flatMap((id, i) => {
    const de = nodos.get(resultado.nodos[i]);
    const a = nodos.get(resultado.nodos[i + 1]);
    if (!de || !a || de.piso === a.piso) return [];
    const t = tramos.get(id);
    // Solo ascensor y escalera: un cambio de numeración sin escalones (la puerta del edificio) no es un cambio de piso para la persona.
    if (!t.ascensor_id && !(t.escalones > 0)) return [];
    const medio = t.ascensor_id ? 'Ascensor' : 'Escalera';
    return [{ punto: [a.lat, a.lng], texto: `${medio} al piso ${a.piso}`, paso: i }];
  });
}

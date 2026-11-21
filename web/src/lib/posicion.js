// Posición de cada nodo en el mapa de /mapa. Leaflet usa el CRS normal (sin teselas): [lat, lng] reales del grafo.
//
// `limites` son los de web/src/plano/ (LIMITES, de José) cuando existe el plano; sin ellos se usa la caja de los
// nodos con un margen, para que la ruta se vea completa igualmente.
export function crearPosicion(grafo, { limites } = {}) {
  const posicion = (n) => [n.lat, n.lng];
  if (limites) return { posicion, bounds: limites, conPlano: true };

  const lats = grafo.nodos.map((n) => n.lat);
  const lngs = grafo.nodos.map((n) => n.lng);
  const margen = 0.0004; // unos 45 m
  return {
    posicion,
    bounds: [[Math.min(...lats) - margen, Math.min(...lngs) - margen], [Math.max(...lats) + margen, Math.max(...lngs) + margen]],
    conPlano: false,
  };
}

// Línea de una ruta sobre el mapa, compartida por /mapa (pasos.js) y /comparar (MapaComparar.jsx).
// Cada tramo puede traer `trazado`: puntos intermedios [lat, lng] guardados en el sentido `desde` -> `hasta`.
// Aquí se recorren en el sentido real del viaje (se invierten si se va de `hasta` a `desde`).
// Funciones puras: sin React ni red.

const valido = (p) => Array.isArray(p) && p.length > 0 && p.every(Number.isFinite);

/**
 * Línea de un tramo en el sentido del recorrido: desde el nodo `de`, por el trazado (si lo tiene) hasta `a`.
 * @param tramo     tramo del grafo
 * @param de, a     nodos (objetos) en el orden real del recorrido
 * @param posicion  (nodo) -> [lat, lng] | null
 * @returns lista de [lat, lng]; vacía si falta la posición de algún extremo.
 */
export function lineaDeTramo(tramo, de, a, posicion) {
  const pDe = posicion(de);
  const pA = posicion(a);
  if (!valido(pDe) || !valido(pA)) return [];
  const medio = (tramo.trazado ?? []).filter(valido);
  const orden = tramo.desde === de.id ? medio : [...medio].reverse();
  return [pDe, ...orden, pA].filter(valido);
}

/**
 * Coordenadas de toda la ruta siguiendo el trazado de cada tramo en el sentido correcto.
 * @param grafo      data/campus.json
 * @param tramoIds   ids de los tramos del resultado (resultado.tramos), en orden
 * @param inicioId   id del nodo de partida (resultado.nodos[0])
 * @param posicion   (nodo) -> [lat, lng] | null
 * @returns lista de [lat, lng] sin repetir el punto de unión entre tramos.
 */
export function lineaRuta(grafo, tramoIds, inicioId, posicion) {
  const nodos = new Map(grafo.nodos.map((n) => [n.id, n]));
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  const coordenadas = [];
  let actual = nodos.get(inicioId);
  tramoIds.forEach((id, i) => {
    const tramo = tramos.get(id);
    if (!tramo || !actual) return;
    const siguiente = nodos.get(tramo.desde === actual.id ? tramo.hasta : tramo.desde);
    const linea = lineaDeTramo(tramo, actual, siguiente, posicion);
    coordenadas.push(...(i === 0 ? linea : linea.slice(1)));
    actual = siguiente;
  });
  return coordenadas;
}

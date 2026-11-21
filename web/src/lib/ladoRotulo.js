// Dónde poner el rótulo del destino en /mapa para que no tape las etiquetas de barrera ni los marcadores.
// Todo en píxeles del contenedor del mapa. El pin mide 48 x 48 y su punta está en (x, y); el rótulo mide `ancho` x 36.
const ALTO = 36;
const LADOS = ['arriba', 'derecha', 'izquierda', 'abajo'];

export function cajaRotulo(lado, { x, y }, ancho) {
  if (lado === 'arriba') return { x1: x - ancho / 2, x2: x + ancho / 2, y1: y - 86, y2: y - 50 };
  if (lado === 'derecha') return { x1: x + 30, x2: x + 30 + ancho, y1: y - 41, y2: y - 41 + ALTO };
  if (lado === 'izquierda') return { x1: x - 30 - ancho, x2: x - 30, y1: y - 41, y2: y - 41 + ALTO };
  return { x1: x - ancho / 2, x2: x + ancho / 2, y1: y + 6, y2: y + 6 + ALTO };
}

const choca = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
const dentro = (c, { ancho, alto }) => c.x1 >= 0 && c.y1 >= 0 && c.x2 <= ancho && c.y2 <= alto;

/**
 * @param pin          { x, y } punta del pin del destino
 * @param ancho        ancho estimado del rótulo
 * @param obstaculos   cajas { x1, y1, x2, y2 } (etiquetas de barrera, marcadores de pasos)
 * @param contenedor   { ancho, alto } del mapa
 * @returns 'arriba' | 'derecha' | 'izquierda' | 'abajo': el primero que no choca y cabe; si ninguno, el que menos choca
 */
export function elegirLado(pin, ancho, obstaculos, contenedor) {
  let mejor = { lado: 'arriba', choques: Infinity };
  for (const lado of LADOS) {
    const caja = cajaRotulo(lado, pin, ancho);
    const choques = obstaculos.filter((o) => choca(caja, o)).length + (dentro(caja, contenedor) ? 0 : 0.5);
    if (choques === 0) return lado;
    if (choques < mejor.choques) mejor = { lado, choques };
  }
  return mejor.lado;
}

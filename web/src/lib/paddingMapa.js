// Padding para fitBounds del mapa de /mapa. Función pura: acota el padding vertical al alto real del contenedor.
// Si arriba + abajo >= alto, Leaflet obtiene size.y < 0 y lanza "Invalid LatLng object: (NaN, NaN)".
export const PADDING_ARRIBA = 96;
export const PADDING_LADO = 40;
export const MARGEN_ABAJO = 40;
export const ESPACIO_UTIL_MIN = 80;

const finito = (v) => (Number.isFinite(v) ? v : 0);

// Devuelve { arriba, abajo, lado } en px; arriba + abajo nunca deja menos de ESPACIO_UTIL_MIN px útiles
// (si el contenedor es muy bajo se reduce primero el padding inferior, nunca queda negativo).
export function paddingAjustado(altoMapa, alturaHoja = 0, anchoMapa = Infinity) {
  const alto = Math.max(0, finito(altoMapa));
  const disponible = Math.max(0, alto - ESPACIO_UTIL_MIN);
  let arriba = PADDING_ARRIBA;
  let abajo = Math.max(0, finito(alturaHoja)) + MARGEN_ABAJO;
  if (arriba + abajo > disponible) {
    arriba = Math.min(arriba, disponible);
    abajo = Math.max(0, disponible - arriba);
  }
  const ancho = Number.isFinite(anchoMapa) ? Math.max(0, anchoMapa) : Infinity;
  const lado = Math.max(0, Math.min(PADDING_LADO, (ancho - ESPACIO_UTIL_MIN) / 2));
  return { arriba, abajo, lado };
}

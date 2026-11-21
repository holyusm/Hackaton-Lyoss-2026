// Lugar del campus más cercano a un punto [lat, lng] (para marcar la barrera en el plano chico de /reportar).
// Distancia plana: en un campus de 500 m la diferencia con haversine no cambia cuál es el más cercano.
export function lugarCercano(lugares, [lat, lng]) {
  const kLng = Math.cos((lat * Math.PI) / 180);
  let mejor = null;
  let dMejor = Infinity;
  for (const l of lugares) {
    if (!Number.isFinite(l.lat) || !Number.isFinite(l.lng)) continue;
    const d = (l.lat - lat) ** 2 + ((l.lng - lng) * kLng) ** 2;
    if (d < dMejor) { dMejor = d; mejor = l; }
  }
  return mejor;
}

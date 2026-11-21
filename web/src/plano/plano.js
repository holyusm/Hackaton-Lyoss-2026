// Plano de Casa Central generado desde OpenStreetMap (ver README.md).
// Coordenadas reales WGS84: [lat, lng] para Leaflet, [lng, lat] dentro del GeoJSON.
import datos from './casa-central.geo.json' with { type: 'json' };
import { crearEdificios } from './edificios-lib.js';

export const geojson = datos;

// Límites del campus (relación OSM 8187017): [[sur, oeste], [norte, este]].
export const LIMITES = datos.limites;

// Límites con margen para maxBounds: deja ver las calles de acceso.
const MARGEN = 0.0012;
export const LIMITES_VISTA = [
  [LIMITES[0][0] - MARGEN, LIMITES[0][1] - MARGEN],
  [LIMITES[1][0] + MARGEN, LIMITES[1][1] + MARGEN],
];

export const CENTRO = [
  (LIMITES[0][0] + LIMITES[1][0]) / 2,
  (LIMITES[0][1] + LIMITES[1][1]) / 2,
];

export const ZOOM = { min: 17, max: 20, inicial: 18 };

export const ATRIBUCION =
  '© colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// El color sale de plano.css (tokens), no de aquí: así cambia con el tema.
// Edificios que OSM marca como del campus pero son vecinos (Edificio Costa Santa María, residencial): se dibujan como barrio.
const VECINOS = new Set(['way/1082210883']);

export function estilo(feature) {
  const { tipo, campus, osm } = feature.properties;
  let clase = `plano-${tipo}`;
  if (tipo === 'edificio' && campus && !VECINOS.has(osm)) clase += ' plano-edificio--campus';
  return { className: clase, interactive: false };
}

// Letras de los edificios del campus (incluye los de EXTRA, como el B).
// Reutiliza crearEdificios para calcular el centroide con precisión (restando el
// origen del anillo) y elegir el polígono más grande cuando se repite una letra (Edificio C).
export const LETRAS = crearEdificios(datos)
  .filter((e) => e.letra)
  .map(({ letra, centro }) => ({ letra, latlng: centro }));

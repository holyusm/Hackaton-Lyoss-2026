// Plano de Casa Central generado desde OpenStreetMap (ver README.md).
// Coordenadas reales WGS84: [lat, lng] para Leaflet, [lng, lat] dentro del GeoJSON.
import datos from './casa-central.geo.json';

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
export function estilo(feature) {
  const { tipo, campus } = feature.properties;
  let clase = `plano-${tipo}`;
  if (tipo === 'edificio' && campus) clase += ' plano-edificio--campus';
  return { className: clase, interactive: false };
}

// Centro de un anillo [lng, lat] ponderado por área (cae dentro en edificios convexos).
function centroAnillo(anillo) {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i], [xj, yj] = anillo[j];
    const f = xj * yi - xi * yj;
    a += f; x += (xj + xi) * f; y += (yj + yi) * f;
  }
  if (Math.abs(a) < 1e-14) return { lat: anillo[0][1], lng: anillo[0][0], area: 0 };
  return { lat: y / (3 * a), lng: x / (3 * a), area: Math.abs(a / 2) };
}

function anilloExterior(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates[0];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates[0][0];
  return null;
}

// Letras de los edificios del campus. Si una letra aparece en varios polígonos
// (Edificio C), se pone en el más grande.
export const LETRAS = (() => {
  const porLetra = new Map();
  for (const f of datos.features) {
    const { tipo, letra, campus } = f.properties;
    if (tipo !== 'edificio' || !letra || !campus) continue;
    const anillo = anilloExterior(f.geometry);
    if (!anillo) continue;
    const c = centroAnillo(anillo);
    const previo = porLetra.get(letra);
    if (!previo || c.area > previo.area) porLetra.set(letra, { letra, ...c });
  }
  return [...porLetra.values()].map(({ letra, lat, lng }) => ({ letra, latlng: [lat, lng] }));
})();

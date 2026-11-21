// Edificios del campus para /plano (Lote 10), calculados una vez del GeoJSON. La lógica vive en edificios-lib.js.
import { geojson } from './plano.js';
import { crearEdificios, interior as interiorDe } from './edificios-lib.js';
import edificioP from './interiores/edificio-p.geo.json';

export {
  EXTRA, VECINOS, FALTAN_EN_OSM, limpiar, norm, pisosDe, pisoInicial, textoPisos, nodoDestino, filtrarEdificios, perteneceA, centroDe,
} from './edificios-lib.js';

export const EDIFICIOS = crearEdificios(geojson);
// Interiores dibujados por el equipo (boceto a escala aproximada) se suman a los de OSM.
const conInteriores = { features: [...geojson.features, ...edificioP.features] };
export const interior = (letra, piso) => interiorDe(conInteriores, letra, piso);

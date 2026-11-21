// Edificios del campus para /plano (Lote 10), calculados una vez del GeoJSON. La lógica vive en edificios-lib.js.
import { geojson } from './plano.js';
import { crearEdificios, interior as interiorDe } from './edificios-lib.js';

export { EXTRA, limpiar, pisosDe, pisoInicial, nodoDestino, filtrarEdificios, perteneceA } from './edificios-lib.js';

export const EDIFICIOS = crearEdificios(geojson);
export const interior = (letra, piso) => interiorDe(geojson, letra, piso);

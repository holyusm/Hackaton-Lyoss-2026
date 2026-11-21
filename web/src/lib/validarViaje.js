// Valida el origen y destino elegidos en Inicio contra los IDs conocidos del grafo.
// Función pura: sin React ni red, se prueba con node:test.

export const ERROR_DESDE = 'Elige un punto de partida del campus.';
export const ERROR_HASTA = 'Elige un destino del campus.';
export const ERROR_IGUAL = 'Elige un destino distinto al punto de partida.';

/**
 * @param {{ desde: string | null, hasta: string | null, cargando: boolean, ids?: Iterable<string> | null }} params
 * @returns {{ errorDesde: string | null, errorHasta: string | null, igual: boolean, motivo: string | null }}
 */
export function validarViaje({ desde, hasta, cargando, ids }) {
  const conocidos = ids instanceof Set ? ids : new Set(ids ?? []);
  const errorDesde = !cargando && !conocidos.has(desde) ? ERROR_DESDE : null;
  const errorHasta = !cargando && Boolean(hasta) && !conocidos.has(hasta) ? ERROR_HASTA : null;
  const igual = Boolean(hasta && hasta === desde);
  const motivo = (cargando && 'Cargando lugares del campus…')
    || errorDesde
    || (!hasta && 'Elige a dónde vas para ver tu ruta.')
    || errorHasta
    || (igual ? ERROR_IGUAL : null);

  return { errorDesde, errorHasta, igual, motivo };
}

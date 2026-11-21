// Última respuesta buena de cada endpoint (Lote 7, sin conexión).
// Se guarda en localStorage como parejo:cache:<clave> = { datos, hora }. Si el almacenamiento
// falla (modo privado, cuota), la app sigue igual, solo que sin copia para mostrar offline.
const PREFIJO = 'parejo:cache:';
const almacen = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

export function guardarCache(clave, datos, ahora = Date.now(), s = almacen()) {
  try { s?.setItem(PREFIJO + clave, JSON.stringify({ datos, hora: ahora })); } catch { /* sin espacio */ }
}

// Devuelve { datos, hora: Date } o null.
export function leerCache(clave, s = almacen()) {
  try {
    const crudo = s?.getItem(PREFIJO + clave);
    if (!crudo) return null;
    const { datos, hora } = JSON.parse(crudo);
    return datos === undefined ? null : { datos, hora: new Date(hora) };
  } catch { return null; }
}

export function borrarCache(clave, s = almacen()) {
  try { s?.removeItem(PREFIJO + clave); } catch { /* */ }
}

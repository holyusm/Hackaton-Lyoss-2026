// Regla compartida de severidad de barreras entre el motor/API y el mapa.
// Módulo puro ESM, sin dependencias (importable desde Node y desde el navegador vía Vite).
//
// Comportamiento actual: todo tipo de reporte activo es 'bloqueo' (corta el paso en /api/ruta
// y se muestra como bloqueo en el mapa). Si el equipo decide que algún tipo (por ejemplo
// 'piso_mojado' u 'otro') sea solo una alerta informativa sin bloquear tramos, agrégalo a SOLO_ALERTA.
const SOLO_ALERTA = new Set();

export const nivelReporte = (reporte) => (SOLO_ALERTA.has(reporte?.tipo) ? 'alerta' : 'bloqueo');

export const bloqueosDe = (reportes = []) =>
  reportes
    .filter((r) => nivelReporte(r) === 'bloqueo')
    .map((r) => r.tramo_id || r.nodo_id)
    .filter(Boolean);

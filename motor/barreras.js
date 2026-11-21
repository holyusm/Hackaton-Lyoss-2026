// Regla compartida de severidad de barreras entre el motor/API y el mapa.
// Módulo puro ESM, sin dependencias (importable desde Node y desde el navegador vía Vite).
//
// Todo tipo de reporte activo es 'bloqueo' (corta el paso en /api/ruta y se muestra como bloqueo en el mapa),
// salvo los de SOLO_ALERTA: se avisan en el mapa pero no bloquean tramos ni nodos.
// 'piso_mojado' es solo alerta (decisión del equipo): se puede pasar con cuidado y no debe dejar un destino sin ruta.
const SOLO_ALERTA = new Set(['piso_mojado']);

export const nivelReporte = (reporte) => (SOLO_ALERTA.has(reporte?.tipo) ? 'alerta' : 'bloqueo');

export const bloqueosDe = (reportes = []) =>
  reportes
    .filter((r) => nivelReporte(r) === 'bloqueo')
    .map((r) => r.tramo_id || r.nodo_id)
    .filter(Boolean);

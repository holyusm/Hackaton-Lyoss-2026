// Lógica pura de /reportar (Lote 4): tipos, duraciones, validación y el cuerpo que espera POST /api/reportes.
// Sin React ni red, se prueba con node:test. Textos sin guion largo ni "·".

// `id` es el del diseño; `tipo` es el del contrato (docs/contratos.md §3). `icono` es el nombre del ícono de Phosphor.
export const TIPOS_REPORTE = [
  { id: 'ascensor', tipo: 'ascensor_fuera_servicio', nombre: 'Ascensor fuera de servicio', icono: 'Elevator' },
  { id: 'obstaculo', tipo: 'obstaculo', nombre: 'Obstáculo', icono: 'TrafficCone' },
  { id: 'rampa', tipo: 'rampa_bloqueada', nombre: 'Rampa bloqueada', icono: 'Prohibit' },
  { id: 'mojado', tipo: 'piso_mojado', nombre: 'Piso mojado', icono: 'Drop' },
  { id: 'otro', tipo: 'otro', nombre: 'Otro', icono: 'DotsThree' },
];

export const DURACIONES = [
  { id: '30m', etiqueta: '30 min', minutos: 30 },
  { id: '1h', etiqueta: '1 h', minutos: 60 },
  { id: '2h', etiqueta: '2 h', minutos: 120 },
  { id: '4h', etiqueta: '4 h', minutos: 240 },
];
export const DURACION_INICIAL = '2h';
export const MAX_DETALLE = 140;

export const ERROR_TIPO = 'Elige qué pasa.';
export const ERROR_LUGAR = 'Elige dónde está la barrera.';

const porTipoContrato = (tipo) => TIPOS_REPORTE.find((t) => t.tipo === tipo);

// form: { tipo (id del diseño), lugar (id de nodo), detalle, duracion }. Devuelve solo los campos con error.
export function validarReporte({ tipo, lugar }) {
  const errores = {};
  if (!TIPOS_REPORTE.some((t) => t.id === tipo)) errores.tipo = ERROR_TIPO;
  if (!lugar) errores.lugar = ERROR_LUGAR;
  return errores;
}

const nombreNodo = (grafo, id) => grafo?.nodos?.find((n) => n.id === id)?.nombre ?? null;

// "Ascensor A detenido" si es un ascensor en un lugar; si no, el nombre del tipo.
export function tituloReporte(reporte, grafo) {
  const nodo = grafo?.nodos?.find((n) => n.id === reporte.nodo_id);
  if (reporte.tipo === 'ascensor_fuera_servicio' && nodo?.tipo === 'ascensor') return `${nodo.nombre.split(',')[0].trim()} detenido`;
  return porTipoContrato(reporte.tipo)?.nombre ?? 'Barrera';
}

export function lugarReporte(reporte, grafo) {
  if (reporte.nodo_id) return nombreNodo(grafo, reporte.nodo_id) ?? 'Lugar del campus';
  if (reporte.tramo_id) {
    const t = grafo?.tramos?.find((x) => x.id === reporte.tramo_id);
    return t ? `Entre ${nombreNodo(grafo, t.desde)} y ${nombreNodo(grafo, t.hasta)}` : 'Lugar del campus';
  }
  return 'Lugar del campus';
}

// Cuerpo de POST /api/reportes. `descripcion` es obligatoria en el servidor: sin detalle se manda el título.
export function cuerpoReporte({ tipo, lugar, detalle = '', duracion = DURACION_INICIAL }, grafo) {
  const t = TIPOS_REPORTE.find((x) => x.id === tipo);
  const minutos = DURACIONES.find((d) => d.id === duracion)?.minutos ?? 120;
  const descripcion = detalle.trim() || tituloReporte({ tipo: t.tipo, nodo_id: lugar }, grafo);
  return { tipo: t.tipo, nodo_id: lugar, descripcion, duracion_min: minutos };
}

const hora = (iso) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// "12 min", "1 h" o "1 h 5 min".
export function haceCuanto(creado, ahora = Date.now()) {
  const min = Math.max(1, Math.floor((ahora - new Date(creado).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

export const metaReporte = (reporte, ahora = Date.now()) => `Reportado hace ${haceCuanto(reporte.creado, ahora)}. Vence a las ${hora(reporte.expira)}.`;

// Ícono (nombre de Phosphor) de una barrera ya creada.
export const iconoReporte = (reporte) => porTipoContrato(reporte.tipo)?.icono ?? 'DotsThree';

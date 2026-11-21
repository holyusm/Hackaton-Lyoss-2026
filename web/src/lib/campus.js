// Lógica pura de /campus (Lote 8): frases, orden de obras, lugares "Nuevo" y etiquetas de zona.
// Textos: docs/diseno/vistas/lote-8-campus/datos-ejemplo.json (textos). Datos: GET /api/simulador (contrato §7).

export const PERFILES_MEDIBLES = ['silla_ruedas', 'movilidad_reducida', 'baja_vision'];

export const DEFINICION_BARRERA = {
  silla_ruedas: 'Un trayecto tiene barrera cuando no hay ruta sin escalones.',
  movilidad_reducida: 'Un trayecto tiene barrera cuando su ruta obliga a subir escalones.',
  baja_vision: 'Un trayecto tiene barrera cuando su ruta pasa por adoquín, piso irregular o sin guía podotáctil.',
  todos: 'Un trayecto tiene barrera cuando la tiene para al menos uno de los tres perfiles.',
};

export const NOMBRE_PERFIL = {
  silla_ruedas: 'Silla de ruedas',
  movilidad_reducida: 'Movilidad reducida',
  baja_vision: 'Baja visión',
  todos: 'Todos los perfiles',
  estandar: 'Estándar',
};

export const ETIQUETA_CON_BARRERA = {
  silla_ruedas: 'Sin ruta',
  movilidad_reducida: 'Con escalones',
  baja_vision: 'Sin guía',
  todos: 'Con barrera',
};

export const BAJADA_ORDEN = {
  trayectos: 'Ordenadas por trayectos que dejan de tener barrera.',
  minutos: 'Ordenadas por minutos ahorrados en promedio.',
  costo: 'Ordenadas por costo relativo, del más bajo al más alto.',
};

export const TEXTO_COSTO = { bajo: 'Costo bajo', medio: 'Costo medio', alto: 'Costo alto' };

// "Por perfil" en la franja comparativa.
export const FRASE_POR_PERFIL = {
  silla_ruedas: (n) => `${trayectos(n)} más con ruta`,
  movilidad_reducida: (n) => `${trayectos(n)} más sin escalones`,
  baja_vision: (n) => `${trayectos(n)} más sin barrera`,
};

export const SUPUESTOS = [
  'Trayecto: ir de una entrada, edificio, sala o baño a otro. La ida y la vuelta cuentan aparte.',
  'Medimos el campus tal como está construido. Los reportes del momento (un ascensor detenido) no cuentan aquí: se ven en Reportar.',
  'El costo de cada obra es una estimación relativa del equipo, no un presupuesto.',
  'Datos del levantamiento del equipo del 21 de noviembre de 2026 y datos de ejemplo donde faltó medir.',
];

// Nombre corto de cada obra para el anuncio del lector ("Con la rampa del patio central, …").
const NOMBRE_CORTO_OBRA = {
  'rampa-patio-biblioteca': 'la rampa del patio central',
  'piso-liso-camino-biblioteca': 'el piso liso del camino a la Biblioteca',
  'guia-tactil-entrada-casino': 'la guía táctil al Casino',
  'guia-tactil-edificio-b-a': 'la guía táctil del Edificio B',
  'plataforma-patio-biblioteca': 'la plataforma elevadora del patio central',
  'techo-patio-casino': 'el techo del camino al Casino',
};

export const trayectos = (n) => `${n} ${n === 1 ? 'trayecto' : 'trayectos'}`;
export const minutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const minuscula = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function nombreCortoObra(obra) {
  return NOMBRE_CORTO_OBRA[obra.id] ?? `la obra "${minuscula(obra.titulo)}"`;
}

// Frase del pitch bajo las cifras de hoy (README §2).
export function frasePitch(perfil, hoy) {
  if (!hoy) return '';
  const { trayectos_con_barrera: n, trayectos_evaluados: total } = hoy;
  if (perfil === 'todos') return `Hoy, ${n} de ${total} trayectos tienen barrera para al menos uno de los tres perfiles.`;
  if (n === 0) return `Hoy, ningún trayecto de Casa Central tiene barrera en ${minuscula(NOMBRE_PERFIL[perfil] ?? perfil)}.`;
  if (n / total > 0.85) {
    const por = {
      silla_ruedas: 'no tienen ruta sin escalones',
      movilidad_reducida: 'obligan a subir escalones',
      baja_vision: 'pasan por adoquín, piso irregular o sin guía podotáctil',
    }[perfil];
    return `En ${minuscula(NOMBRE_PERFIL[perfil])}, casi todos los trayectos (${n} de ${total}) ${por}.`;
  }
  const k = Math.round(total / n);
  if (perfil === 'silla_ruedas') return `Hoy, 1 de cada ${k} trayectos de Casa Central no se puede hacer en silla de ruedas.`;
  if (perfil === 'movilidad_reducida') return `En movilidad reducida, 1 de cada ${k} trayectos obliga a subir escalones.`;
  if (perfil === 'baja_vision') return `En baja visión, 1 de cada ${k} trayectos pasa por adoquín, piso irregular o sin guía podotáctil.`;
  return '';
}

// Anuncio aria-live al cambiar las obras simuladas.
export function anuncioSimulacion(activas, hoy, conObras, perfil) {
  if (!conObras || !hoy || !activas.length) return '';
  const quien = activas.length === 1 ? `Con ${nombreCortoObra(activas[0])}` : `Con ${activas.length} obras`;
  const n = PERFILES_MEDIBLES.includes(perfil)
    ? conObras.trayectos_sin_barrera_por_perfil?.[perfil] ?? 0
    : Math.max(0, hoy.trayectos_con_barrera - conObras.trayectos_con_barrera);
  const cola = {
    silla_ruedas: `${n === 1 ? 'tiene' : 'tienen'} ruta en silla de ruedas`,
    movilidad_reducida: `${n === 1 ? 'queda' : 'quedan'} sin escalones con movilidad reducida`,
    baja_vision: `${n === 1 ? 'queda' : 'quedan'} sin barrera en baja visión`,
    todos: `${n === 1 ? 'queda' : 'quedan'} sin barrera para los tres perfiles`,
  }[perfil] ?? 'quedan sin barrera';
  return `${quien}, ${trayectos(n)} más ${cola}.`;
}

const RANGO_COSTO = { bajo: 0, medio: 1, alto: 2 };
const costo = (o) => RANGO_COSTO[o.costo_relativo] ?? 3;
const min = (o) => o.minutos_ahorrados_prom ?? 0;

// Orden de la lista "Obras que más ayudan". Devuelve { ayudan, noAyudan }; las que no quitan barreras van al final, por costo.
export function ordenarObras(obras, orden = 'trayectos') {
  const ayudan = obras.filter((o) => o.trayectos_sin_barrera > 0);
  const noAyudan = obras.filter((o) => !(o.trayectos_sin_barrera > 0)).sort((a, b) => costo(a) - costo(b));
  const cmp = {
    trayectos: (a, b) => b.trayectos_sin_barrera - a.trayectos_sin_barrera || min(b) - min(a),
    minutos: (a, b) => min(b) - min(a) || b.trayectos_sin_barrera - a.trayectos_sin_barrera,
    costo: (a, b) => costo(a) - costo(b) || b.trayectos_sin_barrera - a.trayectos_sin_barrera,
  }[orden];
  return { ayudan: [...ayudan].sort(cmp), noAyudan };
}

// nodo_id de los lugares cuyo estado cambió entre dos respuestas (para la píldora "Nuevo").
export function estadosNuevos(antes, ahora) {
  const nuevos = new Set();
  if (!antes || !ahora) return nuevos;
  const previo = new Map(antes.map((z) => [z.nodo_id, z.estado]));
  for (const z of ahora) if (previo.has(z.nodo_id) && previo.get(z.nodo_id) !== z.estado) nuevos.add(z.nodo_id);
  return nuevos;
}

// Estado de un lugar con la misma regla del motor.
export function estadoZona(z) {
  if (z.trayectos_con_barrera > 0) return 'con_barrera';
  if ((z.minutos_extra ?? 0) > 0.5) return 'desvio';
  return 'accesible';
}

// Texto de estado de un lugar (etiqueta del marcador y columna Estado de la tabla).
export function etiquetaZona(z, perfil) {
  const estado = z.estado ?? estadoZona(z);
  if (estado === 'con_barrera') return `${ETIQUETA_CON_BARRERA[perfil] ?? 'Con barrera'}: ${trayectos(z.trayectos_con_barrera)}`;
  if (estado === 'desvio') return `Con desvío de ${Math.round(z.minutos_extra)} min`;
  return 'Accesible';
}

// "Nuevo" solo para lugares que MEJORAN (el estado sube de con_barrera a desvío o accesible): si se quita una obra y un lugar
// empeora, no es "nuevo". Compara dos respuestas del mismo perfil.
const NIVEL_ESTADO = { con_barrera: 0, desvio: 1, accesible: 2 };
export function zonasMejoradas(antes, ahora) {
  const mejoradas = new Set();
  if (!antes || !ahora) return mejoradas;
  const previo = new Map(antes.map((z) => [z.nodo_id, z.estado ?? estadoZona(z)]));
  for (const z of ahora) {
    const e = previo.get(z.nodo_id);
    if (e !== undefined && NIVEL_ESTADO[z.estado ?? estadoZona(z)] > NIVEL_ESTADO[e]) mejoradas.add(z.nodo_id);
  }
  return mejoradas;
}

// Dónde se dibuja cada obra en el plano. El servidor no entrega coordenadas de las obras (solo el "lugar"): estas posiciones son
// APROXIMADAS, cerca del lugar al que sirven, y se declaran como tal en la leyenda del plano. Una obra sin entrada aquí no se dibuja.
export const UBICACION_OBRA = {
  'rampa-patio-biblioteca': [-33.03447, -71.59512],
  'plataforma-patio-biblioteca': [-33.03447, -71.59494],
  'piso-liso-camino-biblioteca': [-33.0348, -71.59522],
  'guia-tactil-entrada-casino': [-33.03467, -71.59556],
  'guia-tactil-edificio-b-a': [-33.03536, -71.59526],
  'techo-patio-casino': [-33.03505, -71.59527],
};
export const ubicacionObra = (obra) => UBICACION_OBRA[obra.id] ?? null;

// Resumen del plano para lectores de pantalla (el plano es role="img"; la misma información está en la tabla).
export function resumenPlano(zonas, perfil) {
  if (!zonas?.length) return 'Plano de Casa Central sin lugares medidos.';
  const con = zonas.filter((z) => (z.estado ?? estadoZona(z)) === 'con_barrera').length;
  const des = zonas.filter((z) => (z.estado ?? estadoZona(z)) === 'desvio').length;
  const acc = zonas.length - con - des;
  const partes = [];
  if (con) partes.push(`${con} con barrera`);
  if (des) partes.push(`${des} con desvío`);
  if (acc) partes.push(`${acc} ${acc === 1 ? 'accesible' : 'accesibles'}`);
  return `Plano de Casa Central con ${zonas.length} lugares para ${NOMBRE_PERFIL[perfil] ?? perfil}: ${partes.join(', ')}. Todo lo del plano está también en la lista de lugares.`;
}

// Nombre corto de cada lugar para el plano compacto del móvil (la etiqueta cabe en una línea).
const NOMBRE_CORTO = {
  'entrada-principal': 'Entrada',
  'edificio-a-p2': 'Edificio A',
  'sala-a201': 'Sala A-201',
  biblioteca: 'Biblioteca',
  'bano-b': 'Baño B',
  casino: 'Casino',
  'edificio-b': 'Edificio B',
};
export const nombreCorto = (zona) => NOMBRE_CORTO[zona.nodo_id] ?? zona.nombre;

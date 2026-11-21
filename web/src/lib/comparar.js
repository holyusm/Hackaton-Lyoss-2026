// Comparación de perfiles para /comparar (Lote 3). Funciones puras: sin React ni red.
import { bloqueosDe } from '../../../motor/barreras.js';
import { calcularRuta, conArticulo } from '../../../motor/ruta.js';

export const ORDEN = ['estandar', 'silla_ruedas', 'movilidad_reducida', 'baja_vision'];

const metros = (n) => Math.round(n).toLocaleString('es-CL');
const minutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const r1 = (n) => Math.round(n * 10) / 10;

// "a", "a y b", "a, b y c".
export const enumerar = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Una fila por perfil, con las diferencias frente a Estándar ya escritas como texto.
export function armarFilas(grafo, resultados) {
  const nombre = new Map(grafo.nodos.map((n) => [n.id, n.nombre]));
  const base = resultados.estandar;
  return ORDEN.filter((id) => resultados[id]).map((id) => {
    const r = resultados[id];
    if (!r.ok) return { id, ok: false, motivo: r.motivo, nodos: [] };
    const esBase = id === 'estandar';
    const comparable = base?.ok && !esBase;
    const dm = comparable ? Math.round(r.metros - base.metros) : 0;
    const dt = comparable ? r1(r.minutos - base.minutos) : 0;
    const de = comparable ? base.escalones - r.escalones : 0;
    return {
      id, ok: true, metros: r.metros, minutos: r.minutos, escalones: r.escalones,
      difMetros: esBase ? 'Base' : !comparable ? '' : dm > 0 ? `+${metros(dm)} m` : dm === 0 ? 'igual' : `${metros(-dm)} m menos`,
      difMinutos: esBase ? 'Base' : !comparable ? '' : dt > 0 ? `+${minutos(dt)} min` : dt === 0 ? 'igual' : `${minutos(-dt)} min menos`,
      notaEscalones: esBase ? 'Base' : !comparable ? '' : de > 0 ? `evita ${de}` : de === 0 ? 'igual' : `+${-de}`,
      pasaPor: enumerar(r.nodos.slice(1, -1).map((n) => nombre.get(n))),
      advertencias: r.advertencias ?? [],
      nodos: r.nodos,
    };
  });
}

// Frase para el pitch, siempre sobre Silla de ruedas (datos-ejemplo.json, frasesResumen).
export function fraseResumen(filas, destino) {
  const silla = filas.find((f) => f.id === 'silla_ruedas');
  const base = filas.find((f) => f.id === 'estandar');
  const hacia = destino ? conArticulo(destino) : 'el destino';
  if (!silla || !base?.ok) return '';
  if (!silla.ok) {
    const otros = filas.filter((f) => f.id !== 'silla_ruedas' && f.ok);
    const minimo = Math.min(...otros.map((f) => f.escalones));
    const resto = !otros.length ? '' : minimo === 0
      ? ' Hay perfiles con ruta sin escalones.'
      : ` Las rutas disponibles tienen al menos ${minimo} escalones.`;
    return `En silla de ruedas hoy no hay ruta hacia ${hacia}.${resto}`;
  }
  const dm = Math.round(silla.metros - base.metros);
  const evita = base.escalones - silla.escalones;
  if (dm > 0 && evita > 0) return `En silla de ruedas este trayecto es ${metros(dm)} m más largo y evita ${evita} escalones.`;
  if (dm > 0 && evita === 0) return `En silla de ruedas este trayecto es ${metros(dm)} m más largo, con los mismos escalones.`;
  // Decisión nuestra: mismo largo o más corto pero sin escalones (no hay plantilla en el diseño).
  if (evita > 0) return `En silla de ruedas este trayecto evita ${evita} escalones.`;
  return 'Para silla de ruedas el trayecto es igual al Estándar.';
}

const ESTADO = {
  ascensor_fuera_servicio: 'está fuera de servicio',
  rampa_bloqueada: 'está bloqueada',
  obstaculo: 'tiene un obstáculo',
  piso_mojado: 'tiene el piso mojado',
  otro: 'tiene un problema',
};
const hora = (iso) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Santiago' });

// Por qué un perfil no tiene ruta, en palabras: las barreras activas o, sin ellas, el motivo del motor.
export function motivoSinRuta(barreras, grafo, resultado, consulta, perfiles) {
  const nodos = new Map(grafo.nodos.map((n) => [n.id, n]));
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  const general = resultado?.motivo ? mayuscula(resultado.motivo) + '.' : '';
  const bloqueos = [...new Set(bloqueosDe(barreras))];
  if (!bloqueos.length || calcularRuta(grafo, perfiles, { ...consulta, bloqueos }).ok) return general;
  // Un bloqueo explica el corte si retirarlo por sí solo restablece la ruta de este perfil.
  const causantes = new Set(bloqueos.filter((id) => calcularRuta(grafo, perfiles, {
    ...consulta, bloqueos: bloqueos.filter((otro) => otro !== id),
  }).ok));
  const partes = barreras.filter((b) => causantes.has(b.tramo_id || b.nodo_id)).map((b) => {
    const t = tramos.get(b.tramo_id);
    const sujeto = b.nodo_id && nodos.has(b.nodo_id) ? conArticulo(nodos.get(b.nodo_id))
      : t ? (t.nombre ?? `el tramo entre ${nodos.get(t.desde)?.nombre} y ${nodos.get(t.hasta)?.nombre}`)
        : null;
    return sujeto && `${sujeto} ${ESTADO[b.tipo] ?? ESTADO.otro} desde las ${hora(b.creado)}`;
  }).filter(Boolean);
  if (!partes.length) return general;
  return `${mayuscula(enumerar(partes))}.`;
}

import { bloqueosDe } from '../../../motor/barreras.js';

// Punto QR (/punto/:id, Lote 5). Funciones puras: arman lo que se ve y lo que se lee en voz alta,
// en el mismo orden, para que la voz y la pantalla nunca se separen.

const NIVEL = { bloqueo: 2, alerta: 1 };
const minuscula = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const sinPuntoFinal = (s) => String(s ?? '').trim().replace(/[.\s]+$/, '');

export const hora = (iso) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Santiago' });

// "12:35" -> "12 y 35"; "12:00" -> "12 en punto". Así lo dice bien cualquier voz.
export function horaHablada(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return m === 0 ? `${h} en punto` : `${h} y ${m}`;
}

// punto: Punto del contrato §4. grafo: { nodos }. barreras: useBarreras().barreras. perfil: id o null.
export function armarPunto(punto, grafo, barreras = [], perfil = null) {
  const nodos = grafo?.nodos ?? [];
  const aqui = nodos.find((n) => n.id === punto.nodo_id);
  const activa = barreras
    .filter((b) => b.nodo_id === punto.nodo_id)
    .sort((a, b) => (NIVEL[b.nivel] ?? 0) - (NIVEL[a.nivel] ?? 0))[0];

  const bloqueos = new Set(bloqueosDe(barreras));
  const destinos = (punto.indicaciones ?? []).map((ind, i) => {
    const nodo = nodos.find((n) => n.id === ind.nodo_id) ?? nodos.find((n) => n.nombre === ind.hacia) ?? null;
    const q = nodo ? new URLSearchParams({ desde: punto.nodo_id, hasta: nodo.id }) : null;
    if (q) q.set('perfil', perfil || 'estandar');
    const corte = grafo?.tramos?.some((t) => {
      const conecta = (t.desde === punto.nodo_id && t.hasta === nodo?.id)
        || (!t.sentido_unico && t.hasta === punto.nodo_id && t.desde === nodo?.id);
      return conecta && (bloqueos.has(t.id) || bloqueos.has(t.ascensor_id));
    });
    const bloqueado = corte || bloqueos.has(punto.nodo_id) || bloqueos.has(nodo?.id);
    const indicacion = bloqueado ? 'Hay un bloqueo en este acceso. Consulta la ruta actualizada antes de avanzar.' : ind.texto;
    return { id: nodo?.id ?? `destino-${i}`, nombre: ind.hacia, nodo, indicacion, enlace: q ? `/mapa?${q}` : null };
  });

  return {
    titulo: `Estás en: ${punto.titulo ?? aqui?.nombre ?? ''}`,
    descripcion: punto.descripcion ?? aqui?.descripcion ?? '',
    barrera: activa ? {
      titulo: `Atención: ${minuscula(sinPuntoFinal(activa.descripcion))}.`,
      vence: hora(activa.expira),
    } : null,
    destinos,
  };
}

// Bloques en el orden de lectura: aviso, dónde estás y cada destino. La clave sirve para resaltar el bloque.
export function frasesPunto(m) {
  const frases = [];
  if (m.barrera) {
    frases.push({ clave: 'aviso', nombre: 'el aviso', texto: `${m.barrera.titulo} El aviso vence a las ${horaHablada(m.barrera.vence)}.` });
  }
  frases.push({ clave: 'lugar', nombre: 'dónde estás', texto: m.descripcion ? `${m.titulo}. ${sinPuntoFinal(m.descripcion)}.` : `${m.titulo}.` });
  for (const d of m.destinos) frases.push({ clave: d.id, nombre: d.nombre, texto: `${d.nombre}: ${minuscula(d.indicacion)}` });
  return frases;
}

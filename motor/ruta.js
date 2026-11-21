// Motor de rutas accesibles por perfil (Dijkstra). Módulo puro, sin dependencias.
// Contrato: docs/contratos.md §3.

const PENDIENTE_BASE = { nula: 1, baja: 1, media: 1, alta: 1 };

function tramoBloqueado(tramo, bloqueados, grafoNodos) {
  if (bloqueados.has(tramo.id)) return true;
  if (tramo.ascensor_id && bloqueados.has(tramo.ascensor_id)) return true;
  return false;
}

function prohibidoParaPerfil(tramo, perfil) {
  const p = perfil.prohibido || {};
  if (p.escalones && tramo.escalones > 0) return true;
  if (Array.isArray(p.pendiente) && p.pendiente.includes(tramo.pendiente)) return true;
  if (Array.isArray(p.superficie) && p.superficie.includes(tramo.superficie)) return true;
  return false;
}

function costoTramo(tramo, perfil) {
  const c = perfil.costos || {};
  const multPend = (c.pendiente && c.pendiente[tramo.pendiente]) ?? PENDIENTE_BASE[tramo.pendiente] ?? 1;
  const multSup = (c.superficie && c.superficie[tramo.superficie]) ?? 1;
  const multGuia = tramo.guia_tactil ? 1 : (c.sin_guia_tactil ?? 1);
  return tramo.metros * multPend * multSup * multGuia + tramo.escalones * (c.escalon ?? 0);
}

// `de` y `a` son los nodos en el orden en que se recorre el tramo (no el orden desde/hasta del dato).
function advertenciasDe(tramo, de, a, nombres) {
  const w = [];
  const via = `${nombres.get(de)} → ${nombres.get(a)}`;
  if (tramo.escalones > 0) w.push(`${tramo.escalones} escalones (${via})`);
  if (tramo.pendiente === 'alta') w.push(`Pendiente alta (${via})`);
  if (tramo.superficie === 'irregular') w.push(`Superficie irregular (${via})`);
  if (tramo.superficie === 'adoquin') w.push(`Adoquín (${via})`);
  if (tramo.ascensor_id) w.push(`Usa ascensor (${via})`);
  return w;
}

export function calcularRuta(grafo, perfiles, { desde, hasta, perfil, bloqueos = [] }) {
  const nombres = new Map(grafo.nodos.map((n) => [n.id, n.nombre]));
  if (!nombres.has(desde)) return { ok: false, motivo: `origen desconocido: ${desde}` };
  if (!nombres.has(hasta)) return { ok: false, motivo: `destino desconocido: ${hasta}` };
  const prof = perfiles.find((p) => p.id === perfil);
  if (!prof) return { ok: false, motivo: `perfil desconocido: ${perfil}` };

  const bloqueados = new Set(bloqueos);
  if (bloqueados.has(desde) || bloqueados.has(hasta)) {
    return { ok: false, motivo: 'sin ruta accesible para este perfil' };
  }

  // Aristas dirigidas utilizables.
  const ady = new Map(grafo.nodos.map((n) => [n.id, []]));
  for (const t of grafo.tramos) {
    if (tramoBloqueado(t, bloqueados) || prohibidoParaPerfil(t, prof)) continue;
    if (bloqueados.has(t.desde) || bloqueados.has(t.hasta)) continue;
    const costo = costoTramo(t, prof);
    ady.get(t.desde).push({ a: t.hasta, tramo: t, costo });
    if (!t.sentido_unico) ady.get(t.hasta).push({ a: t.desde, tramo: t, costo });
  }

  // Dijkstra (grafo pequeño: selección lineal del mínimo).
  const dist = new Map([[desde, 0]]);
  const previo = new Map();
  const pendientes = new Set([desde]);
  const cerrados = new Set();
  while (pendientes.size) {
    let u = null;
    for (const id of pendientes) if (u === null || dist.get(id) < dist.get(u)) u = id;
    pendientes.delete(u);
    if (u === hasta) break;
    cerrados.add(u);
    for (const { a, tramo, costo } of ady.get(u)) {
      if (cerrados.has(a)) continue;
      const nd = dist.get(u) + costo;
      if (!dist.has(a) || nd < dist.get(a)) {
        dist.set(a, nd);
        previo.set(a, { de: u, tramo });
        pendientes.add(a);
      }
    }
  }
  if (!dist.has(hasta)) return { ok: false, motivo: 'sin ruta accesible para este perfil' };

  const nodos = [hasta];
  const tramos = [];
  for (let id = hasta; id !== desde; ) {
    const p = previo.get(id);
    tramos.unshift(p.tramo);
    nodos.unshift(p.de);
    id = p.de;
  }
  return {
    ok: true,
    nodos,
    tramos: tramos.map((t) => t.id),
    metros: tramos.reduce((s, t) => s + t.metros, 0),
    minutos: Math.round(tramos.reduce((s, t) => s + t.minutos_medidos, 0) * 10) / 10,
    escalones: tramos.reduce((s, t) => s + t.escalones, 0),
    advertencias: tramos.flatMap((t, i) => advertenciasDe(t, nodos[i], nodos[i + 1], nombres)),
  };
}

export function compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos = [] }) {
  return Object.fromEntries(
    perfiles.map((p) => [p.id, calcularRuta(grafo, perfiles, { desde, hasta, perfil: p.id, bloqueos })]),
  );
}

// La API y el navegador pueden tener versiones distintas del grafo.
export function rutaCompatible(grafo, ruta, desde, hasta) {
  if (ruta?.ok === false) return true;
  if (ruta?.ok !== true || !Array.isArray(ruta.nodos) || !Array.isArray(ruta.tramos)) return false;
  const { nodos, tramos } = ruta;
  if (nodos.length !== tramos.length + 1 || nodos[0] !== desde || nodos.at(-1) !== hasta) return false;
  const ids = new Set(grafo.nodos.map((n) => n.id));
  const porId = new Map(grafo.tramos.map((t) => [t.id, t]));
  return nodos.every((id) => ids.has(id)) && tramos.every((id, i) => {
    const t = porId.get(id);
    if (!t || (t.ascensor_id && !ids.has(t.ascensor_id))) return false;
    return (t.desde === nodos[i] && t.hasta === nodos[i + 1])
      || (!t.sentido_unico && t.hasta === nodos[i] && t.desde === nodos[i + 1]);
  });
}

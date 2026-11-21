import { useEffect, useMemo, useState } from 'react';
import campusRespaldo from '../../../data/campus.json';

// Grupo de cada tipo de nodo en el buscador. Lo que no está aquí (escaleras, etc.) no se ofrece como destino.
const GRUPO = {
  sala: 'Salas',
  bano: 'Servicios', ascensor: 'Servicios', servicio: 'Servicios',
  edificio: 'Edificios', entrada: 'Edificios', punto: 'Edificios',
};

// Lugares del campus desde GET /api/grafo; si falla, el grafo empaquetado en el build.
export function useLugares() {
  const [grafo, setGrafo] = useState(null);

  useEffect(() => {
    let vivo = true;
    fetch('/api/grafo')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch(() => campusRespaldo)
      .then((g) => { if (vivo) setGrafo(g); });
    return () => { vivo = false; };
  }, []);

  const lugares = useMemo(
    () => (grafo?.nodos ?? []).filter((n) => GRUPO[n.tipo] && !n.oculto).map((n) => ({ ...n, grupo: GRUPO[n.tipo] })),
    [grafo],
  );

  return { lugares, grafo, cargando: grafo === null };
}

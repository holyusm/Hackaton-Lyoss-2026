import { useEffect, useMemo, useState } from 'react';
import campusRespaldo from '../../../data/campus.json';

// Grupo de cada tipo de nodo en el buscador. Lo que no está aquí (escaleras, etc.) no se ofrece como destino.
const GRUPO = {
  sala: 'Salas',
  bano: 'Servicios', ascensor: 'Servicios', servicio: 'Servicios',
  edificio: 'Edificios', entrada: 'Edificios', punto: 'Edificios',
};

// Lugares del campus desde GET /api/grafo; si falla, el grafo empaquetado en el build.
// Lote 7: `origen` dice de dónde vino ('api' | 'paquete'); con 'paquete' las vistas avisan "Sin conexión".
export function useLugares() {
  const [grafo, setGrafo] = useState(null);
  const [origen, setOrigen] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    fetch('/api/grafo')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((g) => ({ g, o: 'api' }), () => ({ g: campusRespaldo, o: 'paquete' }))
      .then(({ g, o }) => { if (vivo) { setGrafo(g); setOrigen(o); } });
    return () => { vivo = false; };
  }, [intento]);

  const lugares = useMemo(
    () => (grafo?.nodos ?? []).filter((n) => GRUPO[n.tipo] && !n.oculto).map((n) => ({ ...n, grupo: GRUPO[n.tipo] })),
    [grafo],
  );

  return { lugares, grafo, cargando: grafo === null, origen, reintentar: () => setIntento((n) => n + 1) };
}

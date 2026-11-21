import { useEffect, useState } from 'react';
import { nivelReporte } from '../../../motor/barreras.js';

// Barreras activas: GET /api/reportes cada `intervalo` ms.
// Si una consulta falla, marca error y conserva el último valor bueno.
export function useBarreras(intervalo = 5000) {
  const [estado, setEstado] = useState({ barreras: [], error: false, actualizado: null });

  useEffect(() => {
    let vivo = true;
    const consultar = async () => {
      try {
        const r = await fetch('/api/reportes');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const lista = await r.json();
        const barreras = lista.map((b) => ({ ...b, nivel: nivelReporte(b) }));
        if (vivo) setEstado({ barreras, error: false, actualizado: new Date() });
      } catch {
        if (vivo) setEstado((e) => ({ ...e, error: true }));
      }
    };
    consultar();
    const id = setInterval(consultar, intervalo);
    return () => { vivo = false; clearInterval(id); };
  }, [intervalo]);

  return estado;
}

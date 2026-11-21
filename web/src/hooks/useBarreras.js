import { useEffect, useState } from 'react';

// Tipos que cortan el paso (Reporte en docs/contratos.md §4); el resto es una alerta.
const BLOQUEAN = new Set(['ascensor_fuera_servicio', 'rampa_bloqueada']);

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
        const barreras = lista.map((b) => ({ ...b, nivel: BLOQUEAN.has(b.tipo) ? 'bloqueo' : 'alerta' }));
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

import { useEffect, useState } from 'react';
import { nivelReporte } from '../../../motor/barreras.js';

// Barreras activas: GET /api/reportes cada `intervalo` ms.
// Si una consulta falla, marca error y conserva el último valor bueno.
export function useBarreras(intervalo = 5000) {
  const [estado, setEstado] = useState({ barreras: [], error: false, actualizado: null });

  useEffect(() => {
    const controlador = new AbortController();
    let iniciadas = 0;
    let ultimaRespuesta = 0;
    const aceptar = (consulta) => {
      if (controlador.signal.aborted || consulta < ultimaRespuesta) return false;
      ultimaRespuesta = consulta;
      return true;
    };
    const consultar = async () => {
      const consulta = ++iniciadas;
      try {
        const r = await fetch('/api/reportes', { signal: controlador.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const lista = await r.json();
        const barreras = lista.map((b) => ({ ...b, nivel: nivelReporte(b) }));
        if (aceptar(consulta)) setEstado({ barreras, error: false, actualizado: new Date() });
      } catch {
        if (aceptar(consulta)) setEstado((e) => ({ ...e, error: true }));
      }
    };
    consultar();
    const id = setInterval(consultar, intervalo);
    return () => { controlador.abort(); clearInterval(id); };
  }, [intervalo]);

  return estado;
}

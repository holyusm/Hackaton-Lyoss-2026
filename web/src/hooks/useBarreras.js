import { useEffect, useState } from 'react';
import { nivelReporte } from '../../../motor/barreras.js';
import { aceptarRespuesta } from '../lib/ordenRespuestas.js';
import { guardarCache, leerCache } from '../lib/cache.js';

// Barreras activas: GET /api/reportes cada `intervalo` ms.
// Si una consulta falla, marca error y conserva el último valor bueno.
// Descarta respuestas fuera de orden y cancela peticiones en curso al desmontar.
// Lote 7: guarda la última lista buena; si la primera consulta falla, muestra esa con su `hora`.
export function useBarreras(intervalo = 5000) {
  const [estado, setEstado] = useState({ barreras: [], error: false, actualizado: null, inicioConsulta: null, hora: null });

  useEffect(() => {
    const controlador = new AbortController();
    let iniciadas = 0;
    let ultimaRespuesta = 0;

    const aceptar = (consulta) => {
      const resultado = aceptarRespuesta(ultimaRespuesta, consulta, controlador.signal.aborted);
      ultimaRespuesta = resultado.ultimaRespuesta;
      return resultado.aceptar;
    };

    const consultar = async () => {
      const consulta = ++iniciadas;
      const inicioConsulta = performance.now();
      try {
        const r = await fetch('/api/reportes', { signal: controlador.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const lista = await r.json();
        const barreras = lista.map((b) => ({ ...b, nivel: nivelReporte(b) }));
        if (aceptar(consulta)) {
          const actualizado = new Date();
          guardarCache('reportes', lista, actualizado.getTime());
          setEstado({ barreras, error: false, actualizado, inicioConsulta, hora: actualizado });
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (!aceptar(consulta)) return;
        setEstado((e) => {
          if (e.actualizado || e.hora) return { ...e, error: true };
          const guardada = leerCache('reportes');
          if (!guardada) return { ...e, error: true };
          const vigentes = guardada.datos.filter((b) => !b.expira || Date.parse(b.expira) > Date.now());
          return { ...e, error: true, hora: guardada.hora, barreras: vigentes.map((b) => ({ ...b, nivel: nivelReporte(b) })) };
        });
      }
    };

    consultar();
    const id = setInterval(consultar, intervalo);
    return () => {
      controlador.abort();
      clearInterval(id);
    };
  }, [intervalo]);

  return estado;
}

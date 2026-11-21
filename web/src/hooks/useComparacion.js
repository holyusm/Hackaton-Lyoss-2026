import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import campus from '../../../data/campus.json';
import perfiles from '../../../data/perfiles.json';
import { compararPerfiles } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import { armarFilas, fraseResumen } from '../lib/comparar.js';
import { useBarreras } from './useBarreras.js';
import { useLugares } from './useLugares.js';

// Mismo trayecto para los 4 perfiles. Trayecto en la URL (?desde&hasta); se recalcula cuando cambian
// las barreras activas (useBarreras ya consulta cada 5 s). Sin servidor, calcula en el navegador.
export function useComparacion() {
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde') || 'entrada-principal';
  const hasta = params.get('hasta') || 'sala-a201';
  const { grafo, lugares } = useLugares();
  const { barreras } = useBarreras();
  const claveBarreras = barreras.map((b) => b.id).join(',');
  const [estado, setEstado] = useState({ estado: 'cargando', resultados: null });

  useEffect(() => {
    let vivo = true;
    fetch(`/api/comparar?${new URLSearchParams({ desde, hasta })}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch(() => compararPerfiles(campus, perfiles, { desde, hasta, bloqueos: bloqueosDe(barreras) }))
      .then((resultados) => { if (vivo) setEstado({ estado: 'ok', resultados }); })
      .catch(() => { if (vivo) setEstado({ estado: 'error', resultados: null }); });
    return () => { vivo = false; };
  }, [desde, hasta, claveBarreras]); // eslint-disable-line react-hooks/exhaustive-deps

  const filas = useMemo(
    () => (grafo && estado.resultados ? armarFilas(grafo, estado.resultados) : []),
    [grafo, estado.resultados],
  );
  const origen = grafo?.nodos.find((n) => n.id === desde);
  const destino = grafo?.nodos.find((n) => n.id === hasta);

  const cambiar = (campo, id) => {
    if (!id) return;
    const q = new URLSearchParams(params);
    q.set(campo, id);
    setParams(q, { replace: true });
  };

  return {
    estado: grafo ? estado.estado : 'cargando',
    filas, frase: fraseResumen(filas, destino), barreras, grafo, lugares,
    desde, hasta, origen, destino, cambiar,
  };
}

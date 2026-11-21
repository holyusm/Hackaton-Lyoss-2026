import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import perfiles from '../../../data/perfiles.json';
import { compararPerfiles } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import { armarFilas, fraseResumen, motivoSinRuta } from '../lib/comparar.js';
import { useBarreras } from './useBarreras.js';
import { useLugares } from './useLugares.js';

// Mismo trayecto para los 4 perfiles. Trayecto en la URL (?desde&hasta); se recalcula cuando cambian
// las barreras activas (useBarreras ya consulta cada 5 s). Sin servidor, calcula en el navegador.
export function useComparacion() {
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde') || 'entrada-principal';
  const hasta = params.get('hasta') || 'sala-a201';
  const { grafo, lugares } = useLugares();
  const { barreras, actualizado, error } = useBarreras();
  const bloqueos = JSON.stringify([...new Set(bloqueosDe(barreras))].sort());
  const verificadas = Boolean(actualizado) && !error;
  const [intento, reintentar] = useState(0);
  const consulta = useMemo(() => ({ desde, hasta, grafo, bloqueos, verificadas, intento }),
    [desde, hasta, grafo, bloqueos, verificadas, intento]);
  const [respuesta, setRespuesta] = useState(null);
  const vigente = respuesta?.consulta === consulta ? respuesta : null;

  useEffect(() => {
    if (!consulta.grafo) return;
    const controlador = new AbortController();
    const { desde, hasta, grafo, bloqueos, verificadas } = consulta;
    const cargar = async () => {
      let resultados;
      let sinVerificar = false;
      try {
        const r = await fetch(`/api/comparar?${new URLSearchParams({ desde, hasta })}`, { signal: controlador.signal });
        if (!r.ok) throw new Error();
        resultados = await r.json();
      } catch (err) {
        if (controlador.signal.aborted) throw err;
        // Sin servidor se calcula igual con el motor local (mismo patrón que /mapa); si las barreras no se verificaron, se avisa.
        sinVerificar = !verificadas;
        resultados = compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos: JSON.parse(bloqueos) });
      }
      if (!controlador.signal.aborted) setRespuesta({ consulta, estado: 'ok', resultados, sinVerificar });
    };
    cargar().catch(() => {
      if (!controlador.signal.aborted) setRespuesta({ consulta, estado: 'error' });
    });
    return () => controlador.abort();
  }, [consulta]);

  const filas = useMemo(() => {
    if (!vigente?.resultados) return [];
    return armarFilas(grafo, vigente.resultados).map((fila) => fila.ok ? fila : {
      ...fila,
      motivo: motivoSinRuta(verificadas ? barreras : [], grafo, fila, { desde, hasta, perfil: fila.id }, perfiles),
    });
  }, [vigente, grafo, verificadas, barreras, desde, hasta]);
  const origen = grafo?.nodos.find((n) => n.id === desde);
  const destino = grafo?.nodos.find((n) => n.id === hasta);

  const cambiar = (campo, id) => {
    if (!id) return;
    const q = new URLSearchParams(params);
    q.set(campo, id);
    setParams(q, { replace: true });
  };

  return {
    estado: vigente?.estado ?? 'cargando', reintentar: () => reintentar((n) => n + 1),
    sinVerificar: Boolean(vigente?.sinVerificar),
    filas, frase: fraseResumen(filas, destino), barreras, grafo, lugares,
    desde, hasta, origen, destino, cambiar,
  };
}

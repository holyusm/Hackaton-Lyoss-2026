import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import perfiles from '../../../data/perfiles.json';
import { compararPerfiles } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import { armarFilas, fraseResumen, motivoSinRuta } from '../lib/comparar.js';
import { useBarreras } from './useBarreras.js';
import { useLugares } from './useLugares.js';
import { useConexion } from './useConexion.js';
import { guardarCache, leerCache } from '../lib/cache.js';
import { estadoForzado } from '../lib/estados.js';

// Mismo trayecto para los 4 perfiles. Trayecto en la URL (?desde&hasta); se recalcula cuando cambian
// las barreras activas (useBarreras ya consulta cada 5 s). Sin servidor, calcula en el navegador.
// Lote 7: guarda la última comparación buena; sin servidor ni barreras verificadas usa esa (o el motor local)
// y marca sinConexion con la hora de los datos. ?estado=carga|error|sinconexion fuerza el estado.
export function useComparacion() {
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde') || 'entrada-principal';
  const hasta = params.get('hasta') || 'sala-a201';
  const { grafo, lugares } = useLugares();
  const { barreras, actualizado, error } = useBarreras();
  const enLinea = useConexion();
  const forzado = estadoForzado();
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
      let hora = null;
      const clave = `comparar:${desde}|${hasta}`;
      try {
        const r = await fetch(`/api/comparar?${new URLSearchParams({ desde, hasta })}`, { signal: controlador.signal });
        if (!r.ok) throw new Error();
        resultados = await r.json();
        guardarCache(clave, resultados);
      } catch (err) {
        if (controlador.signal.aborted) throw err;
        // Sin servidor se calcula igual con el motor local (mismo patrón que /mapa). Si además las barreras no se
        // verificaron, se muestra la última comparación buena guardada y se avisa "Sin conexión" con su hora.
        sinVerificar = !verificadas;
        const guardada = sinVerificar ? leerCache(clave) : null;
        if (guardada) ({ datos: resultados, hora } = guardada);
        else resultados = compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos: JSON.parse(bloqueos) });
      }
      if (!controlador.signal.aborted) setRespuesta({ consulta, estado: 'ok', resultados, sinVerificar, hora });
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

  const sinConexion = forzado === 'sinconexion' || !enLinea || Boolean(vigente?.sinVerificar);
  const estado = forzado === 'carga' ? 'cargando' : forzado === 'error' ? 'error' : (vigente?.estado ?? 'cargando');
  return {
    estado, reintentar: () => reintentar((n) => n + 1),
    sinVerificar: Boolean(vigente?.sinVerificar), sinConexion,
    hora: vigente?.hora ?? leerCache(`comparar:${desde}|${hasta}`)?.hora ?? actualizado ?? null,
    filas, frase: fraseResumen(filas, destino), barreras, grafo, lugares,
    desde, hasta, origen, destino, cambiar,
  };
}

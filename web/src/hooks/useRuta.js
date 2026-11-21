import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { calcularRuta } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import perfilesRespaldo from '../../../data/perfiles.json';
import { armarRuta } from '../lib/pasos.js';
import { crearPosicion } from '../lib/posicion.js';
import { LIMITES } from '../plano/plano.js';
import { useBarreras } from './useBarreras.js';
import { useLugares } from './useLugares.js';

// Ruta de /mapa: lee ?desde&hasta&perfil, la pide a GET /api/ruta y, si la API no responde,
// la calcula aquí con el mismo motor (grafo empaquetado y las barreras que ya conoce useBarreras).
// Sin parámetros válidos vuelve a "/". Devuelve:
//   estado: 'cargando' | 'ok' | 'sinRuta'
//   ruta:   { id, pasos, coordenadas, metros, minutos, escalones, advertencias } cuando estado === 'ok'
export function useRuta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { grafo } = useLugares();
  const { barreras, actualizado, error } = useBarreras();

  const desde = params.get('desde');
  const hasta = params.get('hasta');
  const perfil = params.get('perfil');

  const origen = grafo?.nodos.find((n) => n.id === desde) ?? null;
  const destino = grafo?.nodos.find((n) => n.id === hasta) ?? null;
  const perfilValido = perfilesRespaldo.some((p) => p.id === perfil);
  const valida = Boolean(origen && destino && perfilValido);

  useEffect(() => {
    if (grafo && !valida) navigate('/', { replace: true });
  }, [grafo, valida, navigate]);

  // El texto de los bloqueos cambia solo cuando cambia el conjunto de barreras, no en cada consulta.
  const claveBloqueos = bloqueosDe(barreras).sort().join('|');

  const [resultado, setResultado] = useState(null);
  useEffect(() => {
    if (!valida) return undefined;
    let vivo = true;
    (async () => {
      let r;
      try {
        const resp = await fetch(`/api/ruta?${new URLSearchParams({ desde, hasta, perfil })}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        r = await resp.json();
      } catch {
        r = calcularRuta(grafo, perfilesRespaldo, { desde, hasta, perfil, bloqueos: claveBloqueos ? claveBloqueos.split('|') : [] });
      }
      if (vivo) setResultado(r);
    })();
    return () => { vivo = false; };
  }, [valida, grafo, desde, hasta, perfil, claveBloqueos]);

  const mapa = useMemo(() => (grafo ? crearPosicion(grafo, { limites: LIMITES }) : null), [grafo]);
  const ruta = useMemo(() => {
    if (!grafo || !mapa || !resultado?.ok) return null;
    const { id, pasos, coordenadas } = armarRuta(grafo, resultado, { posicion: mapa.posicion });
    return { id, pasos, coordenadas, nodos: resultado.nodos, tramos: resultado.tramos, metros: resultado.metros, minutos: resultado.minutos, escalones: resultado.escalones, advertencias: resultado.advertencias };
  }, [grafo, mapa, resultado]);

  const estado = !valida || !resultado ? 'cargando' : resultado.ok ? 'ok' : 'sinRuta';
  return { estado, ruta, motivo: resultado?.ok === false ? resultado.motivo : null, consulta: { desde, hasta, perfil }, origen, destino, grafo, mapa, barreras, actualizado, errorBarreras: error };
}

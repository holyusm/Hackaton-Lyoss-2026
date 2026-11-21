import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { calcularRuta } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import perfilesRespaldo from '../../../data/perfiles.json';
import { armarRuta } from '../lib/pasos.js';
import { rutaCompatible } from '../lib/rutaCompatible.js';
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
  const valida = Boolean(origen && destino && desde !== hasta && perfilValido);

  useEffect(() => {
    if (grafo && !valida) navigate('/', { replace: true });
  }, [grafo, valida, navigate]);

  // El texto de los bloqueos cambia solo cuando cambia el conjunto de barreras, no en cada consulta.
  const claveBloqueos = JSON.stringify([...new Set(bloqueosDe(barreras))].sort());
  const verificadas = Boolean(actualizado) && !error;
  const solicitud = useMemo(() => ({ grafo, desde, hasta, perfil, claveBloqueos, verificadas }),
    [grafo, desde, hasta, perfil, claveBloqueos, verificadas]);
  const [respuesta, setRespuesta] = useState(null);
  const vigente = respuesta?.solicitud === solicitud ? respuesta : null;
  const resultado = vigente?.resultado;

  useEffect(() => {
    if (!valida) return;
    const controlador = new AbortController();
    const { grafo, desde, hasta, perfil, claveBloqueos, verificadas } = solicitud;
    const calcular = async () => {
      let resultado;
      let aviso;
      let sinVerificar = false;
      try {
        const resp = await fetch(`/api/ruta?${new URLSearchParams({ desde, hasta, perfil })}`, { signal: controlador.signal });
        if (!resp.ok) throw new Error();
        resultado = await resp.json();
      } catch {
        if (controlador.signal.aborted) return;
        // Sin servidor la ruta se calcula igual con el motor local; si además las barreras no se verificaron, se avisa sobre la ruta.
        resultado = calcularRuta(grafo, perfilesRespaldo, { desde, hasta, perfil, bloqueos: JSON.parse(claveBloqueos) });
        sinVerificar = !verificadas;
      }
      if (!rutaCompatible(grafo, resultado, desde, hasta)) {
        aviso = 'Los datos de la ruta y del mapa no coinciden.';
      }
      if (!controlador.signal.aborted) setRespuesta({ solicitud, resultado: aviso ? null : resultado, aviso, sinVerificar });
    };
    calcular().catch(() => {
      if (!controlador.signal.aborted) setRespuesta({ solicitud, aviso: 'No pudimos verificar esta ruta.' });
    });
    return () => controlador.abort();
  }, [valida, solicitud]);

  const mapa = useMemo(() => (grafo ? crearPosicion(grafo, { limites: LIMITES }) : null), [grafo]);
  const ruta = useMemo(() => {
    if (!grafo || !mapa || !resultado?.ok) return null;
    const { id, pasos, coordenadas } = armarRuta(grafo, resultado, { posicion: mapa.posicion });
    return { id, pasos, coordenadas, nodos: resultado.nodos, tramos: resultado.tramos, metros: resultado.metros, minutos: resultado.minutos, escalones: resultado.escalones, advertencias: resultado.advertencias };
  }, [grafo, mapa, resultado]);

  const estado = vigente?.aviso ? 'sinVerificar' : !valida || !resultado ? 'cargando' : resultado.ok ? 'ok' : 'sinRuta';
  return { estado, ruta, aviso: vigente?.aviso, barrerasSinVerificar: Boolean(vigente?.sinVerificar), motivo: resultado?.ok === false ? resultado.motivo : null, consulta: { desde, hasta, perfil }, origen, destino, grafo, mapa, barreras, actualizado, errorBarreras: error };
}

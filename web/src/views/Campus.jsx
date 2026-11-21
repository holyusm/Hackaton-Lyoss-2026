import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Prohibit, UsersThree } from '@phosphor-icons/react';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { useSimulador } from '../hooks/useSimulador.js';
import {
  anuncioSimulacion, BAJADA_ORDEN, DEFINICION_BARRERA, frasePitch, minutos, NOMBRE_PERFIL, ordenarObras, SUPUESTOS, zonasMejoradas,
} from '../lib/campus.js';
import FilaObra from './campus/FilaObra.jsx';
import FranjaComparativa from './campus/FranjaComparativa.jsx';
import GrupoRadio from './campus/GrupoRadio.jsx';
import PestanasMovil from './campus/PestanasMovil.jsx';
import SeccionZonas from './campus/SeccionZonas.jsx';
import './Campus.css';

// /campus (Lote 8): "¿Qué arreglar primero?" (nav: "Mejorar el campus"). Diseño: docs/diseno/vistas/lote-8-campus/README.md.
// Datos: GET /api/simulador (contrato §7). Palabras: GLOSSARY.md.
const OPCIONES = [...PERFILES.filter((p) => p.id !== 'estandar'), { id: 'todos', nombre: 'Todos los perfiles', Icono: UsersThree }];
const VALIDOS = [...OPCIONES.map((o) => o.id), 'estandar']; // Estándar solo llega por la URL
const ORDENES = [
  { id: 'trayectos', nombre: 'Trayectos sin barrera' },
  { id: 'minutos', nombre: 'Minutos ahorrados' },
  { id: 'costo', nombre: 'Costo' },
];

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const alCambiar = () => setEnLinea(navigator.onLine !== false);
    window.addEventListener('online', alCambiar);
    window.addEventListener('offline', alCambiar);
    return () => { window.removeEventListener('online', alCambiar); window.removeEventListener('offline', alCambiar); };
  }, []);
  return enLinea;
}

// Móvil (< 720 px): pestañas Obras / Mapa, franja compacta fija y plano en modo compacto. En escritorio todo va en una página.
function useMovil() {
  const consulta = '(max-width: 719px)';
  const [movil, setMovil] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(consulta).matches === true);
  useEffect(() => {
    const m = window.matchMedia?.(consulta);
    if (!m) return undefined;
    const alCambiar = () => setMovil(m.matches);
    alCambiar();
    m.addEventListener('change', alCambiar);
    return () => m.removeEventListener('change', alCambiar);
  }, []);
  return movil;
}

// Lugares que mejoraron con las obras simuladas, respecto de la respuesta anterior DEL MISMO perfil. `nuevos` dura hasta el próximo
// cambio (lo usa la tabla, con el texto "(nuevo)"); `recientes` se apaga a los 4 s (píldora y borde del plano).
function useZonasNuevas(datos, estado, perfil) {
  const previo = useRef({ perfil: null, zonas: null });
  const [nuevos, setNuevos] = useState(() => new Set());
  const [recientes, setRecientes] = useState(() => new Set());
  useEffect(() => {
    if (estado !== 'ok' || !datos?.zonas || datos.perfil !== perfil) return undefined;
    const antes = previo.current.perfil === perfil ? previo.current.zonas : null;
    previo.current = { perfil, zonas: datos.zonas };
    const mejoradas = zonasMejoradas(antes, datos.zonas);
    setNuevos(mejoradas);
    setRecientes(mejoradas);
    if (mejoradas.size === 0) return undefined;
    const t = setTimeout(() => setRecientes(new Set()), 4000);
    return () => clearTimeout(t);
  }, [datos, estado, perfil]);
  return { nuevos, recientes };
}

export default function Campus() {
  const [params, setParams] = useSearchParams();
  const perfil = VALIDOS.includes(params.get('perfil')) ? params.get('perfil') : 'silla_ruedas';
  const elegirPerfil = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set('perfil', id); return n; }, { replace: true });

  const [activas, setActivas] = useState([]);
  const [orden, setOrden] = useState('trayectos');
  const [intento, setIntento] = useState(0);
  const [seleccionada, setSeleccionada] = useState(null);
  const [pestana, setPestana] = useState('obras');
  const movil = useMovil();
  const enLinea = useEnLinea();
  const { estado, datos: ultimos } = useSimulador(perfil, activas, intento);
  // Si la consulta nueva falla, no se muestran los datos anteriores como si fueran de esta elección (#137).
  const datos = estado === 'error' ? null : ultimos;
  const ocupada = estado === 'cargando';
  const { nuevos, recientes } = useZonasNuevas(ultimos, estado, perfil);

  const alternar = (id) => setActivas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const hoy = datos?.hoy;
  const con = activas.length > 0 ? datos?.con_obras : null;
  const obras = datos?.obras ?? [];
  const estandar = perfil === 'estandar';
  const { ayudan, noAyudan } = ordenarObras(obras, orden);
  const quedan = Boolean(con) && con.trayectos_con_barrera > 0 && ayudan.every((o) => activas.includes(o.id));
  // El anuncio solo sale con la respuesta ya llegada: durante la carga los datos son los de la elección anterior.
  const anuncio = estado === 'ok' && con ? anuncioSimulacion(obras.filter((o) => activas.includes(o.id)), hoy, con, perfil) : '';
  const motivo = enLinea ? undefined : 'Sin conexión: la simulación necesita al servidor.';
  const fila = (o, posicion) => (
    <FilaObra
      key={o.id} obra={o} posicion={posicion} perfil={perfil} activa={activas.includes(o.id)}
      onAlternar={alternar} motivo={motivo} motivoId="campus-sin-conexion"
      seleccionada={seleccionada === o.id} onElegir={setSeleccionada}
    />
  );

  const franja = hoy && con && !estandar ? (
    <FranjaComparativa
      hoy={hoy} con={con} cantidad={activas.length} quedan={quedan} ocupada={ocupada}
      onQuitar={() => setActivas([])}
    />
  ) : null;
  const zonasSec = hoy && datos.zonas?.length > 0 ? (
    <SeccionZonas
      zonas={datos.zonas} obras={obras} activas={activas} perfil={perfil} nuevos={nuevos} recientes={recientes}
      seleccionada={seleccionada} onElegirObra={setSeleccionada} ocupada={ocupada} compacto={movil}
    />
  ) : null;
  const obrasSec = obras.length > 0 ? (
    <section className="campus__obras-bloque" aria-labelledby="campus-obras" aria-busy={ocupada || undefined}>
      <h2 id="campus-obras">Obras que más ayudan</h2>
      <p className="campus__bajada">{BAJADA_ORDEN[orden]}</p>
      <div className="campus__ordenar">
        <p id="campus-ordenar-por" className="campus__etiqueta campus__etiqueta--chica">Ordenar por</p>
        <GrupoRadio
          opciones={ORDENES} valor={orden} onCambiar={setOrden} etiquetaId="campus-ordenar-por"
          clase="campus__segmentado" claseOpcion="campus__segmento" hijoDe={(o) => o.nombre}
        />
      </div>
      {motivo && <p id="campus-sin-conexion" className="campus__motivo">{motivo}</p>}
      {ayudan.length === 0 && <p id="campus-ninguna" className="campus__aviso">Ninguna de las obras de la lista quita barreras para este perfil.</p>}
      {ayudan.length > 0 && <ol className="campus__obras">{ayudan.map((o, i) => fila(o, i + 1))}</ol>}
      {noAyudan.length > 0 && (
        <>
          {ayudan.length > 0 && <p id="campus-no-ayudan" className="campus__separador">No quitan barreras para {NOMBRE_PERFIL[perfil]}</p>}
          <ol className="campus__obras" start={ayudan.length + 1} aria-labelledby={ayudan.length > 0 ? 'campus-no-ayudan' : 'campus-ninguna'}>
            {noAyudan.map((o, i) => fila(o, ayudan.length + i + 1))}
          </ol>
        </>
      )}
    </section>
  ) : null;


  return (
    <div className="campus">
      <header className="campus__encabezado">
        <div className="campus__titulo">
          <h1>¿Qué arreglar primero?</h1>
          <span className="campus__ejemplo">Datos de ejemplo</span>
        </div>
        <p className="campus__bajada-vista">Simulamos obras sobre el mapa accesible de Casa Central y medimos cuántos trayectos dejan de tener barrera para cada perfil.</p>
        <div className="campus__selector">
          <p id="campus-medir-para" className="campus__etiqueta">Medir para</p>
          <GrupoRadio
            opciones={OPCIONES} valor={perfil} onCambiar={elegirPerfil} etiquetaId="campus-medir-para"
            clase="campus__perfiles" claseOpcion="chip-perfil"
            hijoDe={(o) => <><span className="perfil__icono"><o.Icono weight="bold" aria-hidden="true" /></span>{o.nombre}</>}
          />
        </div>
        {DEFINICION_BARRERA[perfil] && <p className="campus__explica">{DEFINICION_BARRERA[perfil]}</p>}
      </header>

      <p className="sr-only" role="status" aria-live="polite">{anuncio}</p>

      {estado === 'error' && (
        <div className="campus__error" role="alert">
          <div>
            <p className="campus__error-titulo">No pudimos medir el campus.</p>
            <p>El servidor no respondió. El perfil que elegiste se mantiene.</p>
          </div>
          <button type="button" className="boton boton--secundario boton--chico" onClick={() => setIntento((n) => n + 1)}>Reintentar</button>
        </div>
      )}

      {!datos && ocupada && (
        <div className="campus__esqueleto" role="status" aria-busy="true">
          <span className="sr-only">Midiendo los trayectos del campus.</span>
          <span className="campus__bloque-esqueleto campus__bloque-esqueleto--cifras" aria-hidden="true" />
          <span className="campus__bloque-esqueleto campus__bloque-esqueleto--frase" aria-hidden="true" />
          <span className="campus__bloque-esqueleto campus__bloque-esqueleto--lista" aria-hidden="true" />
        </div>
      )}

      {estandar && datos && (
        <p className="campus__aviso campus__aviso--estandar">Para el perfil Estándar ningún trayecto tiene barrera. Elige otro perfil para ver dónde está.</p>
      )}

      {hoy && !estandar && (
        <section className="campus__hoy" aria-labelledby="campus-hoy" aria-busy={ocupada || undefined}>
          <h2 id="campus-hoy" className="sr-only">Hoy</h2>
          <dl className="metricas campus__cifras">
            <div className="metrica campus__cifra--barrera">
              <dt>trayectos con barrera</dt>
              <dd className="cifras">
                <Prohibit weight="bold" aria-hidden="true" />
                {hoy.trayectos_con_barrera}
                <span className="campus__de"> de {hoy.trayectos_evaluados}</span>
              </dd>
            </div>
            {perfil !== 'todos' && (
              <div className="metrica">
                <dt>{hoy.minutos_extra_prom === null ? 'desvío promedio' : 'de desvío promedio en los trayectos con ruta'}</dt>
                {hoy.minutos_extra_prom === null
                  ? <dd className="campus__sin-datos">Sin trayectos comparables</dd>
                  : <dd className="cifras">{minutos(hoy.minutos_extra_prom)} <span className="campus__de">min</span></dd>}
              </div>
            )}
          </dl>
          <p className="campus__frase">{frasePitch(perfil, hoy)}</p>
        </section>
      )}

      {movil && con && hoy && !estandar && (
        <div className="campus__fija">
          <p aria-hidden="true">
            <strong>Con {activas.length === 1 ? '1 obra' : `${activas.length} obras`}: {con.trayectos_con_barrera} con barrera</strong> (hoy {hoy.trayectos_con_barrera})
          </p>
        </div>
      )}
      {!movil && franja}

      {hoy && !estandar && (
        <div className="campus__cuerpo">
          {movil ? (
            <>
              <PestanasMovil valor={pestana} onCambiar={setPestana} />
              {pestana === 'mapa' ? (
                <div role="tabpanel" id="campus-panel-mapa" aria-labelledby="campus-tab-mapa" className="campus__panel">{zonasSec}</div>
              ) : (
                <div role="tabpanel" id="campus-panel-obras" aria-labelledby="campus-tab-obras" className="campus__panel">{franja}{obrasSec}</div>
              )}
            </>
          ) : (
            <>{zonasSec}{obrasSec}</>
          )}

          <section className="campus__supuestos" aria-labelledby="campus-supuestos">
            <h2 id="campus-supuestos">Supuestos</h2>
            <ul>{SUPUESTOS.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, MapPin, QrCode } from '@phosphor-icons/react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, useMap } from 'react-leaflet';
import GrupoPerfiles, { PERFILES } from '../components/GrupoPerfiles.jsx';
import CampoLugar from '../components/CampoLugar.jsx';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import { iconoLugar } from '../components/iconoLugar.js';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES, LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { useBarreras } from '../hooks/useBarreras.js';
import { useLugares } from '../hooks/useLugares.js';
import { useConexion } from '../hooks/useConexion.js';
import { useRetraso } from '../hooks/useRetraso.js';
import BandaEnVivo from '../components/BandaEnVivo.jsx';
import ErrorEnLinea from '../components/ErrorEnLinea.jsx';
import { Bloque, Cargando, TarjetaEsqueleto } from '../components/Esqueleto.jsx';
import { TEXTOS, conHora, estadoForzado } from '../lib/estados.js';
import { ERROR_IGUAL, validarViaje } from '../lib/validarViaje.js';
import 'leaflet/dist/leaflet.css';
import './Inicio.css';

const FRECUENTES = ['sala-a201', 'biblioteca', 'bano-b', 'casino'];

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iconoDestino = (nombre) => L.divIcon({
  className: 'mapa-destino',
  html: `<span class="marcador-destino__etiqueta">${escapar(nombre)}</span>${renderToStaticMarkup(<MapPin weight="fill" aria-hidden="true" />)}`,
  iconSize: [48, 48],
  iconAnchor: [24, 46],
});

function EncuadreInicio({ posicion }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicion) {
      mapa.setView(posicion, 18, { animate: false });
    } else {
      mapa.fitBounds(LIMITES, { animate: false });
    }
  }, [mapa, posicion]);
  return null;
}

export default function Inicio() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { perfil, setPerfil } = usePreferencias();
  const { lugares, grafo, cargando: cargandoLugares, origen, reintentar } = useLugares();
  const { barreras, error: errorBarreras, hora } = useBarreras();
  // Lote 7: ?estado=carga|error|sinconexion fuerza el estado. Sin servidor se usan los lugares del paquete
  // y las últimas barreras conocidas: la banda dice "Sin conexión" y el botón sigue habilitado.
  const forzado = estadoForzado();
  const enLinea = useConexion();
  const cargando = forzado === 'carga' || (cargandoLugares && forzado !== 'error');
  const verEsqueleto = useRetraso(cargando);
  const sinConexion = !cargando && forzado !== 'error' && (forzado === 'sinconexion' || !enLinea || errorBarreras || origen === 'paquete');

  const [desde, setDesde] = useState(() => params.get('desde') || 'entrada-principal');
  // Al volver desde /mapa la URL trae la elección anterior (?desde&hasta&perfil).
  const [hasta, setHasta] = useState(() => params.get('hasta') || null);
  const perfilUrl = params.get('perfil');
  useEffect(() => {
    if (PERFILES.some((p) => p.id === perfilUrl)) setPerfil(perfilUrl);
  }, [perfilUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  // El error de igualdad se muestra bajo el campo recién cuando la persona edita, no al cargar.
  const [tocado, setTocado] = useState(false);
  const cambiarDesde = (id) => { setDesde(id ?? 'entrada-principal'); setTocado(true); };
  const cambiarHasta = (id) => { setHasta(id); setTocado(true); };

  const { errorDesde, errorHasta, igual, motivo } = validarViaje({
    desde,
    hasta,
    cargando,
    ids: grafo?.nodos.map((n) => n.id),
  });
  const errorCampoHasta = errorHasta || (tocado && igual ? ERROR_IGUAL : null);
  const puede = !motivo;
  const textoBoton = PERFILES.find((p) => p.id === perfil)?.textoBoton;
  const verRuta = () => {
    if (!puede) return;
    const q = new URLSearchParams({ desde, hasta, perfil: perfil ?? 'estandar' });
    navigate(`/mapa?${q}`);
  };

  const frecuentes = FRECUENTES.map((id) => lugares.find((l) => l.id === id)).filter(Boolean);
  const n = barreras.length;
  const todasBloquean = barreras.every((b) => b.nivel === 'bloqueo');

  const nodoDestino = useMemo(() => (grafo?.nodos ?? []).find((n) => n.id === hasta), [grafo, hasta]);
  const posDestino = nodoDestino?.lat != null && nodoDestino?.lng != null ? [nodoDestino.lat, nodoDestino.lng] : null;

  return (
    <div className="inicio">
      <div className="inicio__form">
        <div className="inicio__titulo">
          <h1>¿A dónde vas hoy?</h1>
          <p>Te mostramos el camino que sí puedes recorrer en Casa Central.</p>
        </div>

        {sinConexion && <BandaEnVivo sinConexion texto={TEXTOS.bandaSinConexion.inicio} hora={hora} className="inicio__banda" />}

        {cargando ? (
          verEsqueleto && (
            <Cargando anuncio={TEXTOS.carga.inicio} className="inicio__esqueleto">
              <div className="inicio__esqueleto-perfiles">{[0, 1, 2, 3].map((i) => <TarjetaEsqueleto key={i} icono lineas={1} />)}</div>
              {[0, 1].map((i) => (
                <div key={i} className="inicio__esqueleto-campo" aria-hidden="true">
                  <Bloque ancho={70} alto={14} />
                  <Bloque alto={56} className="inicio__esqueleto-input" />
                </div>
              ))}
            </Cargando>
          )
        ) : <>
        <GrupoPerfiles valor={perfil} onCambiar={setPerfil} />

        {forzado === 'error' ? (
          <ErrorEnLinea titulo={TEXTOS.error.inicio.titulo} texto={TEXTOS.error.inicio.texto} onReintentar={reintentar} />
        ) : <>
        <CampoLugar
          className="inicio__desde"
          etiqueta="Desde" Icono={MapPin} lugares={lugares} valor={desde} onCambiar={cambiarDesde} error={errorDesde}
          extra={(
            <Link className="boton boton--enlace inicio__qr" to="/punto/p1">
              <QrCode weight="bold" aria-hidden="true" /> Estoy en un punto QR
            </Link>
          )}
        />

        <div className="inicio__hasta">
          <CampoLugar
            etiqueta="Hasta" Icono={MagnifyingGlass} lugares={lugares} valor={hasta} onCambiar={cambiarHasta}
            onQr={() => navigate('/punto/p1')} error={errorCampoHasta} borrable
            placeholder="Busca una sala, un baño o un edificio"
          />
          {frecuentes.length > 0 && (
            <div className="frecuentes" role="group" aria-label="Lugares frecuentes">
              {frecuentes.map((l) => {
                const Icono = iconoLugar(l);
                return (
                  <button key={l.id} type="button" className="chip-lugar" aria-pressed={hasta === l.id} onClick={() => cambiarHasta(l.id)}>
                    <Icono weight="bold" aria-hidden="true" />{l.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </>}
        </>}

        {/* Siempre montado: así el lector anuncia cuando aparece o cambia el número. */}
        <div role="status" aria-live="polite">
          {n > 0 && (
            <AvisoBarrera
              variante="compacto" role={undefined}
              titulo={n === 1 ? '1 barrera activa en el campus.' : `${n} barreras activas en el campus.`}
              acciones={<Link className="inicio__ver-barreras" to="/reportar#activas">Ver barreras</Link>}
            >
              {todasBloquean && 'Tu ruta ya las evita.'}
            </AvisoBarrera>
          )}
          {sinConexion && <p className="inicio__nota">{conHora(TEXTOS.sinConexion.inicio, hora)}</p>}
        </div>

        <div className="accion-fija inicio__accion">
          <button
            type="button" className="boton boton--primario boton--ancho"
            aria-disabled={!puede} aria-describedby={puede ? undefined : 'motivo-ruta'} onClick={verRuta}
          >
            Ver mi ruta{textoBoton && <span className="inicio__boton-extra">{textoBoton}</span>}
          </button>
          {!puede && <span id="motivo-ruta" className="motivo">{motivo}</span>}
        </div>
      </div>

      <section className="inicio__mapa" aria-label="Mapa del campus Casa Central">
        <MapContainer
          bounds={LIMITES}
          maxBounds={LIMITES_VISTA}
          minZoom={ZOOM.min}
          maxZoom={ZOOM.max + 0.5}
          zoomSnap={0.25}
          zoomDelta={0.5}
          zoomControl={false}
          keyboard
          className="mapa-plano inicio__leaflet"
        >
          <CapaPlano capas={{ senderos: true, escaleras: true, servicios: true, calles: true }} />
          {posDestino && <Marker position={posDestino} icon={iconoDestino(nodoDestino.nombre)} interactive={false} keyboard={false} />}
          <EncuadreInicio posicion={posDestino} />
        </MapContainer>
      </section>
    </div>
  );
}

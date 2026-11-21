import { useLayoutEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Person, WifiSlash } from '@phosphor-icons/react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker } from 'react-leaflet';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import BarraVoz from '../components/BarraVoz.jsx';
import TarjetaDestino from '../components/TarjetaDestino.jsx';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { armarPunto, frasesPunto } from '../lib/punto.js';
import { useBarreras } from '../hooks/useBarreras.js';
import { useLugares } from '../hooks/useLugares.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { usePunto } from '../hooks/usePunto.js';
import { useVoz } from '../hooks/useVoz.js';
import 'leaflet/dist/leaflet.css';
import './Punto.css';

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iconoAqui = L.divIcon({
  className: '',
  html: '<span class="plano-aqui"><span class="plano-aqui__punto"></span><span class="plano-aqui__texto">Estás aquí</span></span>',
  iconSize: [120, 24],
  iconAnchor: [12, 12],
});
const iconoDestinoPunto = (nombre) => L.divIcon({
  className: 'mapa-destino',
  html: `<span class="marcador-destino__etiqueta">${escapar(nombre)}</span>${renderToStaticMarkup(<MapPin weight="fill" aria-hidden="true" />)}`,
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

// /punto/:id (Lote 5): lo que abre el QR. Pensado para baja visión: abre en contraste y A+ si la persona
// nunca eligió otra cosa, y lee en voz alta, bloque por bloque, en el mismo orden en que se ve.
export default function Punto() {
  const { id } = useParams();
  const prefs = usePreferencias();
  const { setEnPunto } = prefs;
  useLayoutEffect(() => {
    setEnPunto(true);
    return () => setEnPunto(false);
  }, [setEnPunto]);

  const { punto, cargando, noEncontrado, sinConexion, reintentar } = usePunto(id);
  const { grafo } = useLugares();
  const { barreras, error, actualizado } = useBarreras();
  const estadoBarreras = error || sinConexion
    ? 'No pudimos verificar las barreras actuales. Las indicaciones pueden estar desactualizadas.'
    : !actualizado ? 'Estamos verificando las barreras actuales.' : null;

  const modelo = useMemo(() => (punto ? armarPunto(punto, grafo, barreras, prefs.perfil) : null), [punto, grafo, barreras, prefs.perfil]);
  const frases = useMemo(() => (modelo ? frasesPunto(modelo, estadoBarreras) : []), [modelo, estadoBarreras]);
  const v = useVoz(id);
  const actual = v.actual?.clave ?? null;
  const resaltar = (clave) => (actual === clave ? 'punto__leyendo' : '');

  const nodoAqui = useMemo(() => (grafo?.nodos ?? []).find((n) => n.id === punto?.nodo_id), [grafo, punto]);
  const posAqui = nodoAqui?.lat != null && nodoAqui?.lng != null ? [nodoAqui.lat, nodoAqui.lng] : null;
  const destinosConPos = useMemo(
    () => (modelo?.destinos ?? []).map((d) => d.nodo).filter((n) => n?.lat != null && n?.lng != null),
    [modelo],
  );

  if (cargando) return <div className="punto"><p>Cargando el punto…</p></div>;
  if (sinConexion && !modelo && !noEncontrado) {
    return (
      <div className="punto">
        <h1>No pudimos cargar este punto QR. Revisa tu conexión.</h1>
        <p><button type="button" className="boton boton--primario" onClick={reintentar}>Reintentar</button></p>
        <p><Link to="/">Ir al inicio</Link></p>
      </div>
    );
  }
  if (noEncontrado || !modelo) {
    return (
      <div className="punto">
        <h1>No encontramos este punto QR.</h1>
        <p><Link to="/">Ir al inicio</Link></p>
      </div>
    );
  }

  return (
    <div className="punto">
      {sinConexion && (
        <p className="banda-vivo banda-vivo--sin-conexion punto__sin-conexion" role="status">
          <WifiSlash weight="bold" aria-hidden="true" /> Sin conexión. Puedes seguir escuchando lo que ya cargó.
        </p>
      )}

      {estadoBarreras && (
        <div className={resaltar('estado-barreras')}>
          <AvisoBarrera titulo={estadoBarreras} />
        </div>
      )}

      {modelo.barrera && (
        <div className={resaltar('aviso')}>
          <AvisoBarrera variante="alerta" role="alert" titulo={modelo.barrera.titulo}>
            El aviso vence a las {modelo.barrera.vence}.
          </AvisoBarrera>
        </div>
      )}

      <div className={`punto__lugar ${resaltar('lugar')}`}>
        <h1>{modelo.titulo}</h1>
        {modelo.descripcion && <p>{modelo.descripcion}</p>}
      </div>

      <BarraVoz v={v} frases={frases} />

      {posAqui && (
        <div className="punto__mapa" aria-hidden="true">
          <MapContainer
            center={posAqui}
            zoom={18}
            minZoom={ZOOM.min}
            maxZoom={ZOOM.max + 0.5}
            zoomControl={false}
            dragging={false}
            touchZoom={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            keyboard={false}
            className="mapa-plano punto__leaflet"
          >
            <CapaPlano capas={{ senderos: true, escaleras: true, servicios: true, calles: true }} />
            <Marker position={posAqui} icon={iconoAqui} interactive={false} keyboard={false} />
            {destinosConPos.map((n) => (
              <Marker key={n.id} position={[n.lat, n.lng]} icon={iconoDestinoPunto(n.nombre)} interactive={false} keyboard={false} />
            ))}
          </MapContainer>
        </div>
      )}

      <section aria-labelledby="punto-destinos" className="punto__destinos">
        <h2 id="punto-destinos">Desde aquí puedes ir a:</h2>
        <ul>
          {modelo.destinos.map((d) => <TarjetaDestino key={d.id} destino={d} resaltado={actual === d.id} />)}
        </ul>
      </section>

      <footer className="punto__pie">
        <p>Este punto QR es parte de un prototipo estudiantil.</p>
        <Link to="/" className="punto__perfil"><Person weight="bold" aria-hidden="true" /> Cambiar perfil</Link>
      </footer>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import { Crosshair, MapPin, Minus, Plus, Prohibit, Warning } from '@phosphor-icons/react';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { paddingAjustado } from '../lib/paddingMapa.js';
import 'leaflet/dist/leaflet.css';
import './MapaRuta.css';

// Mapa de /mapa (Lote 2, A5): Leaflet sin teselas y con el CRS normal, en [lat, lng] reales. El fondo es el plano de
// Casa Central de web/src/plano/ (<CapaPlano/>, de José), que trae su propia atribución OSM.
// Las opciones de las capas (className, weight) van como props directas: react-leaflet aplica pathOptions después de crear
// la capa y Leaflet solo lee className al crearla.
// Los marcadores no son interactivos ni entran al Tab; el contenedor describe la ruta en una frase (role="img").

const svg = (nodo) => renderToStaticMarkup(nodo);
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const iconoPaso = (n) => L.divIcon({ className: 'mapa-paso', html: `<span>${n}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] });
const iconoOrigen = L.divIcon({ className: 'mapa-origen', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
const iconoDestino = (nombre, lado = 'arriba') => L.divIcon({
  className: lado === 'arriba' ? 'mapa-destino' : `mapa-destino mapa-destino--${lado}`,
  html: `<span class="marcador-destino__etiqueta">${escapar(nombre)}</span>${svg(<MapPin weight="fill" aria-hidden="true" />)}`,
  iconSize: [48, 48],
  iconAnchor: [24, 46],
});
const iconoBarrera = (nivel, etiqueta, aria, etiquetaArriba = false) => {
  const bloqueo = nivel === 'bloqueo';
  const Glifo = bloqueo ? Prohibit : Warning;
  const claseEtiqueta = etiquetaArriba ? 'mapa-marcador__etiqueta--arriba' : 'mapa-marcador__etiqueta--bajo';
  return L.divIcon({
    className: 'mapa-marcador',
    html: `<span class="marcador ${bloqueo ? 'marcador--bloqueo' : 'marcador--barrera'}" role="img" aria-label="${escapar(aria)}">${svg(<Glifo weight="bold" aria-hidden="true" />)}</span>`
      + (bloqueo && etiqueta ? `<span class="marcador__etiqueta ${claseEtiqueta}">${escapar(etiqueta)}</span>` : ''),
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Elige el lado de la etiqueta del destino para evitar tapar barreras o marcadores de paso cercanos.
function ladoDestino(pDestino, vecinos) {
  if (!pDestino || !vecinos.length) return 'arriba';
  const cerca = vecinos.filter((p) => Math.abs(p[0] - pDestino[0]) < 0.0005 && Math.abs(p[1] - pDestino[1]) < 0.0005);
  if (!cerca.length || !cerca.some((p) => p[0] > pDestino[0])) return 'arriba';
  if (!cerca.some((p) => p[1] - pDestino[1] > 0.00005)) return 'derecha';
  if (!cerca.some((p) => p[0] < pDestino[0])) return 'abajo';
  return 'izquierda';
}

// Si hay pasos o destino justo al sur de la barrera, su etiqueta sube para no taparlos.
function barreraEtiquetaArriba(punto, puntosRuta) {
  return puntosRuta.some((p) => {
    const dLat = punto[0] - p[0];
    return dLat > 0 && dLat < 0.0005 && Math.abs(p[1] - punto[1]) < 0.0005;
  });
}

// Encaja la ruta (o el plano) dejando libre la hoja de abajo, y ofrece Centrar, Acercar y Alejar.
function Vista({ coordenadas, bounds, alturaHoja, controles }) {
  const mapa = useMap();
  const clave = coordenadas.map((c) => c.join(',')).join(';');

  const centrar = useMemo(() => () => {
    mapa.invalidateSize();
    const { x: ancho, y: alto } = mapa.getSize();
    if (!(ancho > 0 && alto > 0)) return; // contenedor oculto o sin medir: Leaflet daría NaN
    const caja = coordenadas.length ? L.latLngBounds(coordenadas) : L.latLngBounds(bounds);
    const { arriba, abajo, lado } = paddingAjustado(alto, alturaHoja, ancho);
    // Red de seguridad: un fitBounds que lance (p. ej. NaN con un padding imposible) no debe desmontar la app.
    try {
      mapa.fitBounds(caja, { paddingTopLeft: [lado, arriba], paddingBottomRight: [lado, abajo], maxZoom: ZOOM.max, animate: false });
    } catch {
      try { mapa.fitBounds(caja, { maxZoom: ZOOM.max, animate: false }); } catch { /* el mapa queda como estaba */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, clave, bounds, alturaHoja]);

  useEffect(() => { centrar(); }, [centrar]);
  useEffect(() => {
    const observador = new ResizeObserver(() => centrar());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa, centrar]);

  if (!controles) return null;
  const evitar = (el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); } };
  return (
    <div className="mapa-controles" ref={evitar}>
      <button type="button" className="mapa-control" aria-label="Centrar la ruta" onClick={centrar}><Crosshair weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Acercar" onClick={() => mapa.zoomIn()}><Plus weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Alejar" onClick={() => mapa.zoomOut()}><Minus weight="bold" aria-hidden="true" /></button>
    </div>
  );
}

const SIN_RUTA = { pasos: [], coordenadas: [] };

// `ruta` es opcional: sin ella (estado sinRuta de /mapa) se dibujan origen, destino y barreras, sin línea.
export default function MapaRuta({ ruta = SIN_RUTA, grafo, mapa, origen, destino, barreras = [], alturaHoja = 304, controles = true, descripcion }) {
  const { posicion, bounds } = mapa;
  const numeros = useMemo(() => ruta.pasos.slice(0, -1).flatMap((p, i) => (p.punto ? [{ n: i + 1, punto: p.punto, icono: iconoPaso(i + 1) }] : [])), [ruta.pasos]);
  const pOrigen = useMemo(() => posicion(origen), [origen, posicion]);
  const pDestino = useMemo(() => posicion(destino), [destino, posicion]);

  const marcadoresBarrera = useMemo(() => {
    const puntosRuta = [...numeros.map((m) => m.punto), ...(pDestino ? [pDestino] : [])];
    return barreras.flatMap((b) => {
      let punto = null;
      if (b.nodo_id) punto = posicion(grafo.nodos.find((n) => n.id === b.nodo_id) ?? {});
      else if (b.tramo_id) {
        const t = grafo.tramos.find((x) => x.id === b.tramo_id);
        const a = t && posicion(grafo.nodos.find((n) => n.id === t.desde));
        const z = t && posicion(grafo.nodos.find((n) => n.id === t.hasta));
        if (a && z) punto = [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2];
      }
      if (!punto || punto.some((v) => !Number.isFinite(v))) return [];
      const aria = `${b.nivel === 'bloqueo' ? 'Bloqueado' : 'Barrera activa'}: ${b.descripcion}`;
      const arriba = barreraEtiquetaArriba(punto, puntosRuta);
      return [{ id: b.id, punto, icono: iconoBarrera(b.nivel, b.descripcion, aria, arriba) }];
    });
  }, [barreras, grafo, posicion, numeros, pDestino]);

  const lado = useMemo(
    () => ladoDestino(pDestino, [...marcadoresBarrera.map((m) => m.punto), ...numeros.map((m) => m.punto)]),
    [pDestino, marcadoresBarrera, numeros],
  );
  const encuadre = useMemo(
    () => (ruta.coordenadas.length ? ruta.coordenadas : [pOrigen, pDestino].filter(Boolean)),
    [ruta.coordenadas, pOrigen, pDestino],
  );
  const iconDestino = useMemo(() => iconoDestino(destino.nombre, lado), [destino.nombre, lado]);
  const sinInteraccion = { interactive: false, keyboard: false };

  return (
    <div className="mapa-ruta" role="group" aria-label={descripcion}>
      <MapContainer
        center={[(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]}
        className="mapa-plano"
        zoom={ZOOM.inicial}
        minZoom={ZOOM.min}
        maxZoom={ZOOM.max}
        zoomSnap={0.25}
        zoomDelta={0.5}
        maxBounds={LIMITES_VISTA}
        zoomControl={false}
        keyboard={false}
      >
        <CapaPlano />
        {ruta.coordenadas.length > 1 && (
          <>
            <Polyline positions={ruta.coordenadas} className="ruta-borde" weight={12} lineCap="round" lineJoin="round" interactive={false} />
            <Polyline positions={ruta.coordenadas} className="ruta-linea" weight={6} lineCap="round" lineJoin="round" interactive={false} />
          </>
        )}
        {marcadoresBarrera.map((m) => <Marker key={m.id} position={m.punto} icon={m.icono} zIndexOffset={0} {...sinInteraccion} />)}
        {numeros.map((m) => <Marker key={m.n} position={m.punto} icon={m.icono} zIndexOffset={400} {...sinInteraccion} />)}
        {pOrigen && <Marker position={pOrigen} icon={iconoOrigen} zIndexOffset={800} {...sinInteraccion} />}
        {pDestino && <Marker position={pDestino} icon={iconDestino} zIndexOffset={1000} {...sinInteraccion} />}
        <Vista coordenadas={encuadre} bounds={bounds} alturaHoja={alturaHoja} controles={controles} />
      </MapContainer>
    </div>
  );
}

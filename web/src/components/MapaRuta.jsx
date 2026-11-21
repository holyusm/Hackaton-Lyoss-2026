import { useEffect, useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, MapPin, Minus, Plus, Prohibit, Warning } from '@phosphor-icons/react';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { paddingAjustado } from '../lib/paddingMapa.js';
import { elegirLado } from '../lib/ladoRotulo.js';
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
  className: `mapa-destino mapa-destino--${lado}`,
  html: `<span class="marcador-destino__etiqueta">${escapar(nombre)}</span>${svg(<MapPin weight="fill" aria-hidden="true" />)}`,
  iconSize: [48, 48],
  iconAnchor: [24, 46],
});
const iconoBarrera = (nivel, etiqueta, aria) => {
  const bloqueo = nivel === 'bloqueo';
  const Glifo = bloqueo ? Prohibit : Warning;
  return L.divIcon({
    className: 'mapa-marcador',
    html: `<span class="marcador ${bloqueo ? 'marcador--bloqueo' : 'marcador--barrera'}" role="img" aria-label="${escapar(aria)}">${svg(<Glifo weight="bold" aria-hidden="true" />)}</span>`
      + (bloqueo && etiqueta ? `<span class="marcador__etiqueta mapa-marcador__etiqueta--bajo">${escapar(etiqueta)}</span>` : ''),
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

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
    mapa.fitBounds(caja, { paddingTopLeft: [lado, arriba], paddingBottomRight: [lado, abajo], maxZoom: ZOOM.max, animate: false });
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

// Marcador del destino: su rótulo se pone arriba, a la derecha, a la izquierda o abajo según no tape las etiquetas de
// barrera ni los números de los pasos (se recalcula al mover o acercar el mapa).
function MarcadorDestino({ punto, nombre, barreras, pasos }) {
  const mapa = useMap();
  const [lado, setLado] = useState('arriba');
  const calcular = useMemo(() => () => {
    const { x: ancho, y: alto } = mapa.getSize();
    if (!(ancho > 0 && alto > 0)) return;
    const p = mapa.latLngToContainerPoint(punto);
    // Los controles y los botones flotantes también cuentan: el rótulo no debe quedar debajo de ellos.
    const base = mapa.getContainer().getBoundingClientRect();
    const flotantes = [...(mapa.getContainer().closest('.mapa-ruta')?.parentElement?.querySelectorAll('.mapa-controles, .mapa-flotantes') ?? []),
      ...mapa.getContainer().querySelectorAll('.mapa-controles')].map((e) => {
      const r = e.getBoundingClientRect();
      return { x1: r.left - base.left, x2: r.right - base.left, y1: r.top - base.top, y2: r.bottom - base.top };
    });
    const obstaculos = [
      ...flotantes,
      ...pasos.map(({ punto: q }) => { const c = mapa.latLngToContainerPoint(q); return { x1: c.x - 16, x2: c.x + 16, y1: c.y - 16, y2: c.y + 16 }; }),
      ...barreras.flatMap(({ punto: q, etiqueta }) => {
        const c = mapa.latLngToContainerPoint(q);
        const caja = [{ x1: c.x - 22, x2: c.x + 22, y1: c.y - 22, y2: c.y + 22 }];
        if (etiqueta) { const w = Math.min(140, 8 * etiqueta.length + 20); caja.push({ x1: c.x - w / 2, x2: c.x + w / 2, y1: c.y + 28, y2: c.y + 56 }); }
        return caja;
      }),
    ];
    setLado(elegirLado({ x: p.x, y: p.y }, Math.min(260, 8 * nombre.length + 32), obstaculos, { ancho, alto }));
  }, [mapa, punto, nombre, barreras, pasos]);
  useEffect(() => { calcular(); }, [calcular]);
  useMapEvents({ zoomend: calcular, moveend: calcular, resize: calcular });
  const icono = useMemo(() => iconoDestino(nombre, lado), [nombre, lado]);
  return <Marker position={punto} icon={icono} zIndexOffset={1000} interactive={false} keyboard={false} />;
}

export default function MapaRuta({ ruta, grafo, mapa, origen, destino, barreras = [], alturaHoja = 304, controles = true, descripcion }) {
  const { posicion, bounds } = mapa;
  const marcadoresBarrera = useMemo(() => barreras.flatMap((b) => {
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
    return [{ id: b.id, punto, etiqueta: b.nivel === 'bloqueo' ? b.descripcion : '', icono: iconoBarrera(b.nivel, b.descripcion, aria) }];
  }), [barreras, grafo, posicion]);

  const numeros = useMemo(() => ruta.pasos.slice(0, -1).flatMap((p, i) => (p.punto ? [{ n: i + 1, punto: p.punto, icono: iconoPaso(i + 1) }] : [])), [ruta.pasos]);
  const pOrigen = useMemo(() => posicion(origen), [origen, posicion]);
  const pDestino = useMemo(() => posicion(destino), [destino, posicion]);
  const barrerasRotulo = useMemo(() => marcadoresBarrera.map((m) => ({ punto: m.punto, etiqueta: m.etiqueta })), [marcadoresBarrera]);
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
        {pDestino && <MarcadorDestino punto={pDestino} nombre={destino.nombre} barreras={barrerasRotulo} pasos={numeros} />}
        <Vista coordenadas={ruta.coordenadas} bounds={bounds} alturaHoja={alturaHoja} controles={controles} />
      </MapContainer>
    </div>
  );
}

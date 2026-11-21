import { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import { MapPin, Prohibit, Stairs } from '@phosphor-icons/react';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { lineaRuta } from '../lib/lineaRuta.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import 'leaflet/dist/leaflet.css';
import './MapaRuta.css';
import './MapaComparar.css';

// Mapa de /comparar (Lote 3, PR B): las 4 rutas sobre el plano de Casa Central, distintas por trazo y no solo por color.
// Misma base que MapaRuta (CRS normal, sin teselas, <CapaPlano/>). Los colores van por clase CSS porque los
// atributos SVG de Leaflet no resuelven var(); className solo se lee al crear la capa, por eso la key cambia con la selección.

// datos-ejemplo.json, estilosDeRuta: ancho, guiones, punta y borde de cada perfil; se dibuja en este orden.
const ESTILOS = {
  estandar: { weight: 3 },
  baja_vision: { weight: 6, dashArray: '0.1 11' },
  movilidad_reducida: { weight: 5, dashArray: '12 8', lineCap: 'butt', borde: 9 },
  silla_ruedas: { weight: 6, borde: 12 },
};
const ORDEN_DIBUJO = ['estandar', 'baja_vision', 'movilidad_reducida', 'silla_ruedas'];
// Modo presentación (Lote 7): mismo trazo de cada perfil, ×1,6 (ancho, borde y guiones).
const GROSOR_PRESENTACION = 1.6;
const escalarGuiones = (d, k) => d && d.split(' ').map((n) => +(Number(n) * k).toFixed(2)).join(' ');

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (n) => renderToStaticMarkup(n);
const conEtiqueta = (clase, Glifo, etiqueta) => L.divIcon({
  className: 'mapa-comparar__marcador',
  html: `<span class="marcador ${clase}">${svg(<Glifo weight="bold" aria-hidden="true" />)}</span><span class="marcador__etiqueta">${escapar(etiqueta)}</span>`,
  iconSize: [44, 44], iconAnchor: [22, 22],
});
const iconoOrigen = L.divIcon({ className: 'mapa-origen', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
const iconoDestino = (nombre) => L.divIcon({
  className: 'mapa-destino mapa-comparar__destino',
  html: `<span class="marcador-destino__etiqueta">${escapar(nombre)}</span>${svg(<MapPin weight="fill" aria-hidden="true" />)}`,
  iconSize: [48, 48], iconAnchor: [24, 46],
});

function Encuadre({ puntos }) {
  const mapa = useMap();
  const clave = puntos.map((p) => p.join(',')).join(';');
  useEffect(() => {
    if (puntos.length) mapa.fitBounds(L.latLngBounds(puntos), { padding: [36, 36], maxZoom: ZOOM.max, animate: false });
  }, [mapa, clave]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapaComparar({ grafo, filas, seleccion, barreras, origen, destino, descripcion }) {
  const { presentacion } = usePreferencias();
  const k = presentacion ? GROSOR_PRESENTACION : 1;
  const nodos = useMemo(() => new Map(grafo.nodos.map((n) => [n.id, n])), [grafo]);
  const pos = (id) => { const n = nodos.get(id); return n ? [n.lat, n.lng] : null; };

  const rutas = ORDEN_DIBUJO
    .map((id) => filas.find((f) => f.id === id))
    .filter((f) => f?.ok && f.nodos.length > 1)
    .map((f) => ({ ...f, puntos: lineaRuta(grafo, f.tramos, f.nodos[0], (n) => [n.lat, n.lng]) }));
  // La elegida se dibuja al final (encima).
  const ordenadas = seleccion === 'todas' ? rutas : [...rutas.filter((r) => r.id !== seleccion), ...rutas.filter((r) => r.id === seleccion)];
  const estado = (id) => (seleccion === 'todas' ? 'normal' : id === seleccion ? 'elegida' : 'atenuada');

  // Escaleras que sube el Estándar y barreras activas, cada una con su etiqueta.
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  const medio = (t) => { const a = pos(t.desde), z = pos(t.hasta); return a && z ? [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2] : null; };
  const escaleras = (filas.find((f) => f.id === 'estandar')?.tramos ?? [])
    .map((id) => tramos.get(id)).filter((t) => t?.escalones > 0)
    .map((t) => ({ id: t.id, punto: medio(t), icono: conEtiqueta('marcador--escalera', Stairs, `Escalera, ${t.escalones} escalones`) }));
  const bloqueos = barreras.map((b) => ({
    id: b.id,
    punto: b.nodo_id ? pos(b.nodo_id) : tramos.has(b.tramo_id) ? medio(tramos.get(b.tramo_id)) : null,
    icono: conEtiqueta('marcador--bloqueo', Prohibit, b.descripcion),
  }));
  const marcadores = [...escaleras, ...bloqueos].filter((m) => m.punto);
  const sinInteraccion = { interactive: false, keyboard: false };
  const pOrigen = origen && pos(origen.id);
  const pDestino = destino && pos(destino.id);

  return (
    <div className="mapa-comparar" role="img" aria-label={descripcion}>
      <MapContainer
        className="mapa-plano" bounds={LIMITES_VISTA} minZoom={ZOOM.min} maxZoom={ZOOM.max} maxBounds={LIMITES_VISTA}
        zoomSnap={0.25} zoomControl={false} keyboard={false} scrollWheelZoom={false}
      >
        <CapaPlano />
        {ordenadas.map((r) => {
          const e = ESTILOS[r.id];
          const extra = estado(r.id) === 'elegida' ? 2 : 0;
          const clave = `${r.id}-${estado(r.id)}-${k}`;
          const comun = { positions: r.puntos, lineJoin: 'round', lineCap: e.lineCap ?? 'round', interactive: false };
          return [
            e.borde && <Polyline key={`${clave}-b`} {...comun} weight={(e.borde + extra) * k} className={`ruta-comparar-borde ruta-comparar--${estado(r.id)}`} />,
            <Polyline key={clave} {...comun} weight={(e.weight + extra) * k} dashArray={escalarGuiones(e.dashArray, k)} className={`ruta-comparar ruta-comparar--${r.id} ruta-comparar--${estado(r.id)}`} />,
          ];
        })}
        {marcadores.map((m) => <Marker key={m.id} position={m.punto} icon={m.icono} {...sinInteraccion} />)}
        {pOrigen && <Marker position={pOrigen} icon={iconoOrigen} {...sinInteraccion} />}
        {pDestino && <Marker position={pDestino} icon={iconoDestino(destino.nombre)} {...sinInteraccion} />}
        <Encuadre puntos={rutas.flatMap((r) => r.puntos)} />
      </MapContainer>
    </div>
  );
}

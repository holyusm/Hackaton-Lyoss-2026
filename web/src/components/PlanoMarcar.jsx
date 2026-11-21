import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from '@phosphor-icons/react';
import { renderToStaticMarkup } from 'react-dom/server';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES } from '../plano/plano.js';
import { lugarCercano } from '../lib/lugarCercano.js';
import 'leaflet/dist/leaflet.css';

const icono = L.divIcon({
  className: 'plano-marcar__pin',
  html: renderToStaticMarkup(<MapPin weight="fill" aria-hidden="true" />),
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});

function Clics({ lugares, onElegir }) {
  useMapEvents({
    click(e) {
      const l = lugarCercano(lugares, [e.latlng.lat, e.latlng.lng]);
      if (l) onElegir(l.id);
    },
  });
  return null;
}

// Plano chico para marcar el punto (Lote 4, PR C). Es un extra del puntero: todo se puede hacer con el campo de lugar,
// así que el botón no entra al Tab y el plano va oculto al lector de pantalla; el aria-label dice dónde está el punto.
export default function PlanoMarcar({ lugares, valor, onElegir }) {
  const elegido = lugares.find((l) => l.id === valor);
  const punto = elegido && Number.isFinite(elegido.lat) ? [elegido.lat, elegido.lng] : null;
  const opciones = useMemo(() => ({
    bounds: LIMITES, zoomControl: false, attributionControl: true, dragging: false, touchZoom: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false, maxZoom: 18, minZoom: 16,
  }), []);

  return (
    <button
      type="button" tabIndex={-1} className="plano-marcar"
      aria-label={elegido ? `Plano del campus con el punto en ${elegido.nombre}. Con teclado, cambia el lugar en el campo de arriba.` : 'Plano del campus sin punto marcado. Con teclado, elige el lugar en el campo de arriba.'}
    >
      <span className="plano-marcar__mapa" aria-hidden="true">
        <MapContainer {...opciones} className="mapa-plano plano-marcar__leaflet">
          <CapaPlano letras={false} />
          <Clics lugares={lugares} onElegir={onElegir} />
          {punto && <Marker position={punto} icon={icono} interactive={false} keyboard={false} />}
        </MapContainer>
      </span>
      <span className="plano-marcar__pista">Toca para mover el punto</span>
    </button>
  );
}

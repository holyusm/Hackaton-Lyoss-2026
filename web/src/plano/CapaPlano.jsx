// Capa base del mapa: el plano vectorial de Casa Central (OSM), sin teselas.
// Uso dentro de <MapContainer className="mapa-plano" maxBounds={LIMITES_VISTA} minZoom={17} maxZoom={20}>:
//   <CapaPlano />
// Va en paneles propios bajo overlayPane (400), así la ruta y los marcadores quedan encima.
import { useMemo } from 'react';
import { GeoJSON, Marker, Pane } from 'react-leaflet';
import L from 'leaflet';
import { geojson, estilo, LETRAS, ATRIBUCION } from './plano.js';
import 'leaflet/dist/leaflet.css';
import './plano.css';

// Los puntos (servicios) los dibuja MapaRuta con sus propios marcadores.
const sinPuntos = (f) => f.geometry.type !== 'Point';

export default function CapaPlano({ letras = true }) {
  const iconos = useMemo(
    () =>
      LETRAS.map(({ letra, latlng }) => ({
        letra,
        latlng,
        icono: L.divIcon({
          className: '',
          html: `<span class="plano-letra" aria-hidden="true">${letra}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })),
    [],
  );

  return (
    <>
      <Pane name="plano" style={{ zIndex: 250 }}>
        <GeoJSON
          data={geojson}
          style={estilo}
          filter={sinPuntos}
          interactive={false}
          attribution={ATRIBUCION}
        />
      </Pane>
      {letras && (
        <Pane name="plano-letras" style={{ zIndex: 350, pointerEvents: 'none' }}>
          {iconos.map(({ letra, latlng, icono }) => (
            <Marker
              key={letra}
              position={latlng}
              icon={icono}
              interactive={false}
              keyboard={false}
              pane="plano-letras"
            />
          ))}
        </Pane>
      )}
    </>
  );
}

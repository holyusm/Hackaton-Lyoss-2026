// Capa base del mapa: el plano vectorial de Casa Central (OSM), sin teselas.
// Uso dentro de <MapContainer className="mapa-plano" maxBounds={LIMITES_VISTA} minZoom={17} maxZoom={20}>:
//   <CapaPlano />
// Va en paneles propios bajo overlayPane (400), así la ruta y los marcadores quedan encima.
//
// Props opcionales (sin ellos se ve exactamente como siempre; /mapa y /comparar no los pasan). Los usa /plano (Lote 10):
//   seleccion  clave del edificio elegido (ver edificios.js): lo resalta con plano-edificio--elegido.
//   onElegir   (clave) => void: los edificios del campus pasan a ser clicables.
//   capas      { senderos, escaleras, servicios, calles }: cuáles se dibujan. Por defecto como hoy: servicios apagados, el resto prendidos.
//   onElegirSala  (feature) => void: las salas del `interior` pasan a ser clicables (#189).
//   salaSeleccion id osm del polígono de la sala elegida: lleva la clase plano-sala--elegida (borde cobalto de 3 px).
//   interior   lista de features sala y pasillo de un piso: se dibujan encima de los edificios. Si se pasa (aunque sea vacía),
//              la base deja de dibujar las salas y pasillos de todos los pisos mezclados.
import { useMemo } from 'react';
import { GeoJSON, Marker, Pane } from 'react-leaflet';
import L from 'leaflet';
import { geojson, estilo, LETRAS, ATRIBUCION } from './plano.js';
import { EDIFICIOS, perteneceA } from './edificios.js';
import 'leaflet/dist/leaflet.css';
import './plano.css';

const CAPAS_INICIALES = { senderos: true, escaleras: true, servicios: false, calles: true };
const SERVICIOS = { parking: 'P', restaurant: 'C', bicycle_parking: 'B', community_centre: 'S', studio: 'R', atm: '$', research_institute: 'I' };
const TIPO_DE_CAPA = { sendero: 'senderos', escalera: 'escaleras', calle: 'calles' };

const estiloInterior = (f) => {
  const { tipo, servicio } = f.properties;
  return { className: `plano-${tipo}${servicio === 'toilets' ? ' plano-sala--bano' : ''}`, interactive: false };
};
const estiloClic = { fill: true, fillOpacity: 0, stroke: false, className: 'plano-clic' };
const estiloSalaClic = { fill: true, fillOpacity: 0, stroke: false, className: 'plano-clic' };
const estiloSalaElegida = () => ({ className: 'plano-sala plano-sala--elegida', interactive: false });
const estiloElegido = () => ({ className: 'plano-edificio plano-edificio--campus plano-edificio--elegido', interactive: false });

export default function CapaPlano({ letras = true, seleccion = null, onElegir = null, capas, interior, onElegirSala = null, salaSeleccion = null }) {
  const c = { ...CAPAS_INICIALES, ...capas };
  const sinInterior = Array.isArray(interior);

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

  // Los puntos (servicios) solo se dibujan si se pide la capa; MapaRuta pone los suyos.
  const filtro = (f) => {
    const { tipo } = f.properties;
    if (f.geometry.type === 'Point') return false;
    if (sinInterior && (tipo === 'sala' || tipo === 'pasillo')) return false;
    const capa = TIPO_DE_CAPA[tipo];
    return !capa || c[capa];
  };
  // La clave obliga a recrear la capa al cambiar qué se dibuja: Leaflet solo lee className al crearla.
  const claveBase = `${c.senderos}${c.escaleras}${c.calles}${sinInterior}`;

  const servicios = useMemo(() => geojson.features.filter((f) => f.properties.tipo === 'servicio' && f.geometry.type === 'Point'), []);
  const iconosServicio = useMemo(() => servicios.map((f) => ({
    id: f.properties.osm,
    nombre: f.properties.nombre || 'Servicio',
    latlng: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
    icono: L.divIcon({
      className: '',
      html: `<span class="plano-servicio" role="img" aria-label="${(f.properties.nombre || 'Servicio').replace(/"/g, '&quot;')}">${SERVICIOS[f.properties.servicio] ?? '?'}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  })), [servicios]);

  const campus = useMemo(() => (onElegir ? EDIFICIOS.map((e) => e.feature) : []), [onElegir]);
  const elegido = useMemo(() => (seleccion ? geojson.features.filter((f) => perteneceA(f, seleccion)) : []), [seleccion]);
  const clicks = (clave) => (feature, layer) => layer.on('click', () => onElegir(clave(feature)));
  const claveDe = (feature) => EDIFICIOS.find((e) => perteneceA(feature, e.clave))?.clave;

  return (
    <>
      <Pane name="plano" style={{ zIndex: 250 }}>
        <GeoJSON
          key={claveBase}
          data={geojson}
          style={estilo}
          filter={filtro}
          interactive={false}
          attribution={ATRIBUCION}
        />
      </Pane>
      {elegido.length > 0 && (
        <Pane name="plano-elegido" style={{ zIndex: 260 }}>
          <GeoJSON key={seleccion} data={{ type: 'FeatureCollection', features: elegido }} style={estiloElegido} interactive={false} />
        </Pane>
      )}
      {sinInterior && interior.length > 0 && (
        <Pane name="plano-interior" style={{ zIndex: 270 }}>
          <GeoJSON key={interior.map((f) => f.properties.osm).join()} data={{ type: 'FeatureCollection', features: interior }} style={estiloInterior} interactive={false} />
        </Pane>
      )}
      {sinInterior && salaSeleccion && (
        <Pane name="plano-sala-elegida" style={{ zIndex: 280 }}>
          <GeoJSON key={salaSeleccion} data={{ type: 'FeatureCollection', features: interior.filter((f) => f.properties.osm === salaSeleccion) }} style={estiloSalaElegida} interactive={false} />
        </Pane>
      )}
      {sinInterior && onElegirSala && interior.length > 0 && (
        <Pane name="plano-salas-clics" style={{ zIndex: 310 }}>
          <GeoJSON key={interior.map((f) => f.properties.osm).join()} data={{ type: 'FeatureCollection', features: interior.filter((f) => f.geometry.type === 'Polygon') }} style={estiloSalaClic} onEachFeature={(f, layer) => layer.on('click', () => onElegirSala(f))} />
        </Pane>
      )}
      {onElegir && (
        <Pane name="plano-clics" style={{ zIndex: 300 }}>
          <GeoJSON data={{ type: 'FeatureCollection', features: campus }} style={estiloClic} onEachFeature={clicks(claveDe)} />
        </Pane>
      )}
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
      {c.servicios && (
        <Pane name="plano-servicios" style={{ zIndex: 360, pointerEvents: 'none' }}>
          {iconosServicio.map(({ id, latlng, icono }) => (
            <Marker key={id} position={latlng} icon={icono} interactive={false} keyboard={false} pane="plano-servicios" />
          ))}
        </Pane>
      )}
    </>
  );
}

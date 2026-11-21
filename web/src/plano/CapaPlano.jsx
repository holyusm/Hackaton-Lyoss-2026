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
//   variante   'plano' activa el dibujo de /plano v2 (#220 fase 4): todo lleva además la clase plano-v2 y su CSS va
//              bajo .plano-v2 (calles en dos capas, edificios sin nombre suaves, placa del elegido, números de sala,
//              íconos de baño, rótulos "Patio Central" y "Pasillos del piso −1", servicios con <title>).
//              Sin el prop, el dibujo es idéntico al de siempre.
import { useMemo, useState } from 'react';
import { GeoJSON, Marker, Pane, useMap, useMapEvents } from 'react-leaflet';
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

// ---- Variante "plano" (#220 fase 4). Todo lo de aquí abajo solo se usa con variante="plano". ----
const V2 = ' plano-v2';
const conV2 = (fn) => (f) => {
  const e = fn(f);
  return { ...e, className: `${e.className}${V2}` };
};
const TIPO_SERVICIO = {
  parking: 'Estacionamiento', restaurant: 'Comida', bicycle_parking: 'Bicicletas', community_centre: 'Centro de estudiantes',
  studio: 'Estudio', atm: 'Cajero', research_institute: 'Investigación',
};
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const menos = (n) => String(n).replace(/^-/, '−');

// Edificios del campus que no están en la lista (sin letra ni nombre): se dibujan suaves y no se tocan.
const SIN_NOMBRE = new Set(
  geojson.features
    .filter((f) => f.properties.tipo === 'edificio' && f.properties.campus && !EDIFICIOS.some((e) => perteneceA(f, e.clave)))
    .map((f) => f.properties.osm),
);
const estiloV2 = (f) => {
  const e = estilo(f);
  const suave = SIN_NOMBRE.has(f.properties.osm) && e.className.includes('plano-edificio--campus') ? ' plano-edificio--sin-nombre' : '';
  return { ...e, className: `${e.className}${suave}${V2}` };
};
const estiloCalleBorde = () => ({ className: `plano-calle-borde${V2}`, interactive: false });
const estiloPasilloBorde = () => ({ className: `plano-pasillo-borde${V2}`, interactive: false });
const estiloInteriorV2 = conV2(estiloInterior);
const estiloSalaElegidaV2 = conV2(estiloSalaElegida);
const estiloElegidoV2 = conV2(estiloElegido);
const estiloSalaClicV2 = { ...estiloSalaClic, className: `plano-clic${V2}` };

// Caja y centro de cualquier geometría GeoJSON ([lng, lat] → [lat, lng]).
function caja(geometry) {
  let s = 90, o = 180, n = -90, e = -180;
  const recorrer = (c) => {
    if (typeof c[0] === 'number') {
      s = Math.min(s, c[1]); n = Math.max(n, c[1]); o = Math.min(o, c[0]); e = Math.max(e, c[0]);
    } else c.forEach(recorrer);
  };
  recorrer(geometry.coordinates);
  return { sw: [s, o], ne: [n, e], centro: [(s + n) / 2, (o + e) / 2] };
}
const PATIO = geojson.features.find((f) => f.properties.tipo === 'patio' && f.properties.nombre === 'Patio Central' && f.geometry.type === 'Polygon');
const CENTRO_PATIO = PATIO ? caja(PATIO.geometry).centro : null;
const CALLES = { type: 'FeatureCollection', features: geojson.features.filter((f) => f.properties.tipo === 'calle') };
// Ícono Toilet (Phosphor, trazo): currentColor, así toma --plano-sobre-bano (nunca blanco sobre Paso en oscuro).
const ICONO_BANO = '<svg viewBox="0 0 256 256" width="14" height="14" fill="none" stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M64 32h128v80H64ZM40 112h176a88 88 0 0 1-176 0ZM100 192l-12 32h80l-12-32"/></svg>';
const rotulo = (texto, clase, ancho) => L.divIcon({
  className: '',
  html: `<span class="${clase}${V2}" aria-hidden="true">${esc(texto)}</span>`,
  iconSize: [ancho, 20],
  iconAnchor: [ancho / 2, 10],
});

export default function CapaPlano({ letras = true, seleccion = null, onElegir = null, capas, interior, onElegirSala = null, salaSeleccion = null, variante = null }) {
  const c = { ...CAPAS_INICIALES, ...capas };
  const sinInterior = Array.isArray(interior);
  const v2 = variante === 'plano';
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  // Solo la variante "plano" necesita el zoom (números de sala que caben); las demás vistas no se re-renderizan.
  useMapEvents({ zoomend: () => { if (v2) setZoom(map.getZoom()); } });
  const hayInterior = sinInterior && interior.length > 0;
  const edifElegido = seleccion ? EDIFICIOS.find((e) => e.clave === seleccion) : null;
  // Placa Cobalto con la letra del elegido: solo sin interior a la vista (con interior taparía las salas).
  const conPlaca = Boolean(v2 && letras && edifElegido?.letra && edifElegido?.centro && !hayInterior);

  const iconos = useMemo(
    () =>
      LETRAS.map(({ letra, latlng }) => ({
        letra,
        latlng,
        icono: L.divIcon({
          className: '',
          html: `<span class="plano-letra${v2 ? V2 : ''}" aria-hidden="true">${letra}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })),
    [v2],
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
  const claveBase = `${c.senderos}${c.escaleras}${c.calles}${sinInterior}${v2 ? 'v2' : ''}`;

  const servicios = useMemo(() => geojson.features.filter((f) => f.properties.tipo === 'servicio' && f.geometry.type === 'Point'), []);
  const iconosServicio = useMemo(() => servicios.map((f) => {
    const letra = SERVICIOS[f.properties.servicio] ?? '?';
    let html;
    if (v2) {
      const tipo = TIPO_SERVICIO[f.properties.servicio] ?? 'Servicio';
      const t = esc(f.properties.nombre ? `${tipo}: ${f.properties.nombre}` : tipo);
      html = `<svg class="plano-servicio${V2}" viewBox="0 0 28 28" width="28" height="28" role="img" aria-label="${t}"><title>${t}</title><circle cx="14" cy="14" r="13"/><text x="14" y="14" dy="0.35em" text-anchor="middle">${esc(letra)}</text></svg>`;
    } else {
      html = `<span class="plano-servicio" role="img" aria-label="${(f.properties.nombre || 'Servicio').replace(/"/g, '&quot;')}">${letra}</span>`;
    }
    return {
      id: f.properties.osm,
      nombre: f.properties.nombre || 'Servicio',
      latlng: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
      icono: L.divIcon({ className: '', html, iconSize: [28, 28], iconAnchor: [14, 14] }),
    };
  }), [servicios, v2]);

  const campus = useMemo(() => (onElegir ? EDIFICIOS.map((e) => e.feature) : []), [onElegir]);
  const elegido = useMemo(() => (seleccion ? geojson.features.filter((f) => perteneceA(f, seleccion)) : []), [seleccion]);
  const clicks = (clave) => (feature, layer) => layer.on('click', () => onElegir(clave(feature)));
  const claveDe = (feature) => EDIFICIOS.find((e) => perteneceA(feature, e.clave))?.clave;
  // El elegido no lleva hover (taparía su relleno Cobalto tinte y las salas).
  const estiloClicV2 = (f) => ({ ...estiloClic, className: `plano-clic${V2}${seleccion && perteneceA(f, seleccion) ? ' plano-clic--elegido' : ''}` });

  // Variante "plano": números de sala que caben, íconos de baño y rótulo de los pasillos.
  const marcasInterior = useMemo(() => {
    if (!v2 || !hayInterior) return [];
    const marcas = [];
    for (const f of interior) {
      const { tipo, servicio, ref, osm } = f.properties;
      if (tipo !== 'sala' || f.geometry.type !== 'Polygon') continue;
      const b = caja(f.geometry);
      if (servicio === 'toilets') {
        marcas.push({
          id: `b${osm}`,
          latlng: b.centro,
          icono: L.divIcon({
            className: '',
            html: `<span class="plano-bano-icono${V2}" role="img" aria-label="Baño" title="Baño">${ICONO_BANO}</span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        });
        continue;
      }
      if (!ref) continue;
      const a = map.project(b.sw, zoom);
      const z = map.project(b.ne, zoom);
      const texto = String(ref);
      // 11 px en 700: unos 7 px por carácter. Si no cabe en la sala, no se muestra.
      if (Math.abs(z.x - a.x) < texto.length * 7 + 6 || Math.abs(z.y - a.y) < 15) continue;
      marcas.push({ id: `s${osm}`, latlng: b.centro, icono: rotulo(texto, 'plano-sala-num', 60) });
    }
    const pasillos = interior.filter((f) => f.properties.tipo === 'pasillo' && f.geometry.type === 'LineString');
    if (pasillos.length) {
      const largo = pasillos.reduce((m, f) => (f.geometry.coordinates.length > m.geometry.coordinates.length ? f : m));
      const cs = largo.geometry.coordinates;
      const [lng, lat] = cs[Math.floor(cs.length / 2)];
      const nivel = largo.properties.nivel;
      const texto = nivel != null ? `Pasillos del piso ${menos(nivel)}` : 'Pasillos';
      marcas.push({ id: 'pasillos', latlng: [lat, lng], icono: rotulo(texto, 'plano-rotulo', 180) });
    }
    return marcas;
  }, [v2, hayInterior, interior, zoom, map]);

  const iconoPatio = useMemo(() => (v2 && CENTRO_PATIO ? rotulo('Patio Central', 'plano-rotulo', 140) : null), [v2]);
  const iconoPlaca = useMemo(() => (conPlaca ? L.divIcon({
    className: '',
    html: `<span class="plano-placa${V2}" aria-hidden="true">${esc(edifElegido.letra)}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }) : null), [conPlaca, edifElegido]);
  const claveInterior = sinInterior ? interior.map((f) => f.properties.osm).join() : '';

  return (
    <>
      {v2 && c.calles && (
        <Pane name="plano-calles-borde" style={{ zIndex: 249 }}>
          <GeoJSON data={CALLES} style={estiloCalleBorde} interactive={false} />
        </Pane>
      )}
      <Pane name="plano" style={{ zIndex: 250 }}>
        <GeoJSON
          key={claveBase}
          data={geojson}
          style={v2 ? estiloV2 : estilo}
          filter={filtro}
          interactive={false}
          attribution={ATRIBUCION}
        />
      </Pane>
      {elegido.length > 0 && (
        <Pane name="plano-elegido" style={{ zIndex: 260 }}>
          <GeoJSON key={`${seleccion}${v2}`} data={{ type: 'FeatureCollection', features: elegido }} style={v2 ? estiloElegidoV2 : estiloElegido} interactive={false} />
        </Pane>
      )}
      {hayInterior && (
        <Pane name="plano-interior" style={{ zIndex: 270 }}>
          {v2 && (
            <GeoJSON key={`borde${claveInterior}`} data={{ type: 'FeatureCollection', features: interior.filter((f) => f.properties.tipo === 'pasillo') }} style={estiloPasilloBorde} interactive={false} />
          )}
          <GeoJSON key={`${v2}${claveInterior}`} data={{ type: 'FeatureCollection', features: interior }} style={v2 ? estiloInteriorV2 : estiloInterior} interactive={false} />
        </Pane>
      )}
      {sinInterior && salaSeleccion && (
        <Pane name="plano-sala-elegida" style={{ zIndex: 280 }}>
          <GeoJSON key={`${salaSeleccion}${v2}`} data={{ type: 'FeatureCollection', features: interior.filter((f) => f.properties.osm === salaSeleccion) }} style={v2 ? estiloSalaElegidaV2 : estiloSalaElegida} interactive={false} />
        </Pane>
      )}
      {sinInterior && onElegirSala && interior.length > 0 && (
        <Pane name="plano-salas-clics" style={{ zIndex: 310 }}>
          <GeoJSON key={`${v2}${claveInterior}`} data={{ type: 'FeatureCollection', features: interior.filter((f) => f.geometry.type === 'Polygon') }} style={v2 ? estiloSalaClicV2 : estiloSalaClic} onEachFeature={(f, layer) => layer.on('click', () => onElegirSala(f))} />
        </Pane>
      )}
      {onElegir && (
        <Pane name="plano-clics" style={{ zIndex: 300 }}>
          <GeoJSON key={v2 ? `v2${seleccion}` : 'base'} data={{ type: 'FeatureCollection', features: campus }} style={v2 ? estiloClicV2 : estiloClic} onEachFeature={clicks(claveDe)} />
        </Pane>
      )}
      {v2 && (CENTRO_PATIO || marcasInterior.length > 0) && (
        <Pane name="plano-rotulos" style={{ zIndex: 345, pointerEvents: 'none' }}>
          {CENTRO_PATIO && <Marker position={CENTRO_PATIO} icon={iconoPatio} interactive={false} keyboard={false} pane="plano-rotulos" />}
          {marcasInterior.map(({ id, latlng, icono }) => (
            <Marker key={id} position={latlng} icon={icono} interactive={false} keyboard={false} pane="plano-rotulos" />
          ))}
        </Pane>
      )}
      {letras && (
        <Pane name="plano-letras" style={{ zIndex: 350, pointerEvents: 'none' }}>
          {iconos.filter(({ letra }) => !(conPlaca && letra === edifElegido.letra)).map(({ letra, latlng, icono }) => (
            <Marker
              key={`${letra}${v2}`}
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
            <Marker key={`${id}${v2}`} position={latlng} icon={icono} interactive={false} keyboard={false} pane="plano-servicios" />
          ))}
        </Pane>
      )}
      {iconoPlaca && (
        <Pane name="plano-placa" style={{ zIndex: 370, pointerEvents: 'none' }}>
          <Marker key={seleccion} position={edifElegido.centro} icon={iconoPlaca} interactive={false} keyboard={false} pane="plano-placa" />
        </Pane>
      )}
    </>
  );
}

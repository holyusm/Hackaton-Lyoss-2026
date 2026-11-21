import { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, useMap } from 'react-leaflet';
import { Check } from '@phosphor-icons/react';
import CapaPlano from '../../plano/CapaPlano.jsx';
import { LIMITES_VISTA, ZOOM } from '../../plano/plano.js';
import { estadoZona, etiquetaZona, resumenPlano, ubicacionObra } from '../../lib/campus.js';
import FormaZona from './FormaZona.jsx';
import IconoObra, { TIPO_TEXTO } from './IconoObra.jsx';
import 'leaflet/dist/leaflet.css';
import './MapaZonas.css';

// Plano de zonas de /campus (Lote 8). Misma base que /comparar: plano vectorial de Casa Central, sin teselas, <CapaPlano/>.
// Marcadores de lugar y de obra son divIcon (forma en SVG, etiqueta en HTML). El plano es role="img": todo lo que muestra
// está también en la tabla ("Ver como lista") y en la lista de obras, así que los marcadores de lugar no son interactivos.

// Con las coordenadas reales algunos lugares quedan a pocos metros (Biblioteca y Baño B; Edificio A piso 2 y Sala A-201).
// Cada uno puede correrse unos píxeles (dy) y poner su etiqueta a la izquierda; sin entrada va a la derecha, sin desplazar.
const DISPOSICION = {
  'edificio-a-p2': { lado: 'izq', dy: -30 },
  'sala-a201': { lado: 'izq', dy: 28 },
  biblioteca: { lado: 'der', dy: -28 },
  'bano-b': { lado: 'der', dy: 28 },
};

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (n) => renderToStaticMarkup(n);

function iconoZona(z, perfil, nuevo) {
  const estado = z.estado ?? estadoZona(z);
  const { lado = 'der', dy = 0 } = DISPOSICION[z.nodo_id] ?? {};
  const mas = Math.max(1, Math.round(z.minutos_extra ?? 0));
  return L.divIcon({
    className: `zona zona--${lado}${nuevo ? ' zona--nuevo' : ''}`,
    html: `${nuevo ? '<span class="zona__nuevo">Nuevo</span>' : ''}${svg(<FormaZona estado={estado} mas={mas} tamano={44} />)}`
      + `<span class="zona__etiqueta zona__etiqueta--${estado}"><strong>${escapar(z.nombre)}</strong><span>${escapar(etiquetaZona(z, perfil))}</span></span>`,
    iconSize: [44, 44], iconAnchor: [22, 22 - dy],
  });
}

function iconoObra(o, simulada, seleccionada) {
  return L.divIcon({
    className: `obra-marca${seleccionada ? ' obra-marca--seleccionada' : ''}`,
    html: `<span class="obra-marca__cuadro">${svg(<IconoObra tipo={o.tipo} />)}`
      + `${simulada ? `<span class="obra-marca__ok">${svg(<Check weight="bold" aria-hidden="true" />)}</span>` : ''}</span>`
      + `${seleccionada ? `<span class="obra-marca__etiqueta">${escapar(TIPO_TEXTO[o.tipo] ?? o.tipo)}</span>` : ''}`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function Encuadre({ puntos }) {
  const mapa = useMap();
  const clave = puntos.map((p) => p.join(',')).join(';');
  useEffect(() => {
    if (puntos.length) {
      mapa.fitBounds(L.latLngBounds(puntos), { paddingTopLeft: [64, 56], paddingBottomRight: [170, 56], maxZoom: ZOOM.max, animate: false });
    }
  }, [mapa, clave]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapaZonas({ zonas, obras, activas, perfil, recientes, seleccionada, onElegirObra }) {
  const marcasZona = useMemo(
    () => zonas.map((z) => ({ z, icono: iconoZona(z, perfil, recientes?.has(z.nodo_id)) })),
    [zonas, perfil, recientes],
  );
  const marcasObra = useMemo(
    () => obras.map((o) => ({ o, punto: ubicacionObra(o) })).filter((m) => m.punto)
      .map((m) => ({ ...m, icono: iconoObra(m.o, activas.includes(m.o.id), seleccionada === m.o.id) })),
    [obras, activas, seleccionada],
  );
  const puntos = [...zonas.map((z) => [z.lat, z.lng]), ...marcasObra.map((m) => m.punto)];
  const sinInteraccion = { interactive: false, keyboard: false };

  return (
    <div className="campus__mapa" role="img" aria-label={resumenPlano(zonas, perfil)}>
      <MapContainer
        className="mapa-plano" bounds={LIMITES_VISTA} minZoom={ZOOM.min} maxZoom={ZOOM.max} maxBounds={LIMITES_VISTA}
        zoomSnap={0.25} zoomControl={false} keyboard={false} scrollWheelZoom={false} dragging={!L.Browser.mobile}
        attributionControl={false}
      >
        <CapaPlano letras={false} />
        {marcasZona.map(({ z, icono }) => <Marker key={z.nodo_id} position={[z.lat, z.lng]} icon={icono} {...sinInteraccion} />)}
        {marcasObra.map(({ o, punto, icono }) => (
          <Marker
            key={o.id} position={punto} icon={icono} keyboard={false} zIndexOffset={seleccionada === o.id ? 500 : 0}
            eventHandlers={{ click: () => onElegirObra?.(seleccionada === o.id ? null : o.id) }}
          />
        ))}
        <Encuadre puntos={puntos} />
      </MapContainer>
    </div>
  );
}

// Leyenda en franja bajo el plano: las tres formas, el pictograma de obra y la atribución (siempre visible).
export function LeyendaZonas() {
  return (
    <div className="campus__leyenda">
      <ul>
        <li><FormaZona estado="accesible" tamano={24} /> Accesible</li>
        <li><FormaZona estado="desvio" mas="N" tamano={30} /> Con desvío de N min</li>
        <li><FormaZona estado="con_barrera" tamano={24} /> Con barrera</li>
        <li><span className="campus__leyenda-obra"><IconoObra tipo="rampa" /></span> Obra (ubicación aproximada)</li>
      </ul>
      <p>© colaboradores de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></p>
    </div>
  );
}

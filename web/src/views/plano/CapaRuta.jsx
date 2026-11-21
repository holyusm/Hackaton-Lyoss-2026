import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Marker, Pane, Polyline, useMap } from 'react-leaflet';

const iconoDesde = L.divIcon({ className: '', html: '<span class="plano-ruta-desde"></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
const iconoHasta = L.divIcon({ className: '', html: '<span class="plano-ruta-hasta"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
const iconoPiso = (texto) => L.divIcon({ className: '', html: `<span class="plano-ruta-piso">${texto}</span>`, iconSize: [160, 28], iconAnchor: [-6, 14] });

// Ruta dibujada en /plano: la línea (con el borde claro de /mapa), el inicio, la llegada y una marca en cada cambio de piso.
// Los marcadores no son interactivos ni entran al Tab; la vía accesible es la lista de pasos.
export default function CapaRuta({ coordenadas, desde, hasta, marcas }) {
  const mapa = useMap();
  const clave = coordenadas.map((c) => c.join(',')).join(';');
  const iconos = useMemo(() => marcas.map((m) => ({ ...m, icono: iconoPiso(m.texto) })), [marcas]);
  // La ruta entera a la vista cuando aparece o cambia (sin animación si hay prefers-reduced-motion).
  useEffect(() => {
    if (coordenadas.length < 2) return;
    try {
      const caja = L.latLngBounds(coordenadas);
      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducido) mapa.fitBounds(caja, { padding: [40, 40], maxZoom: 19, animate: false });
      else mapa.flyToBounds(caja, { padding: [40, 40], maxZoom: 19 });
    } catch { /* el mapa queda como estaba */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, clave]);
  if (coordenadas.length < 2) {
    return (
      <>
        {desde && <Marker position={desde} icon={iconoDesde} interactive={false} keyboard={false} />}
        {hasta && <Marker position={hasta} icon={iconoHasta} interactive={false} keyboard={false} />}
      </>
    );
  }
  return (
    <Pane name="plano-ruta" style={{ zIndex: 450 }}>
      <Polyline positions={coordenadas} className="ruta-borde" weight={12} lineCap="round" lineJoin="round" interactive={false} pane="plano-ruta" />
      <Polyline positions={coordenadas} className="ruta-linea" weight={6} lineCap="round" lineJoin="round" interactive={false} pane="plano-ruta" />
      {desde && <Marker position={desde} icon={iconoDesde} interactive={false} keyboard={false} pane="plano-ruta" />}
      {hasta && <Marker position={hasta} icon={iconoHasta} interactive={false} keyboard={false} pane="plano-ruta" />}
      {iconos.map((m) => <Marker key={`${m.paso}-${m.texto}`} position={m.punto} icon={m.icono} interactive={false} keyboard={false} pane="plano-ruta" />)}
    </Pane>
  );
}

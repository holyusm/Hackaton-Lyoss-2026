import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, MagnifyingGlass, Minus, NavigationArrow, Plus, Question, Toilet, X } from '@phosphor-icons/react';
import { renderToStaticMarkup } from 'react-dom/server';
import CapaPlano from '../plano/CapaPlano.jsx';
import LimiteError from '../components/LimiteError.jsx';
import RadioGrupo from '../components/RadioGrupo.jsx';
import { paddingAjustado } from '../lib/paddingMapa.js';
import { geojson, LIMITES, LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { EDIFICIOS, centroDe, filtrarEdificios, interior, nodoDestino, pisoInicial, pisosDe } from '../plano/edificios.js';
import campusRespaldo from '../../../data/campus.json';
import { useLugares } from '../hooks/useLugares.js';
import 'leaflet/dist/leaflet.css';
import './Plano.css';

// /plano (Lote 10): explorar el campus. La lista es la vía accesible; el mapa es el apoyo visual.
const AQUI = [-33.033897, -71.59523]; // Acceso Av. España (simulado, declarado en la vista)
const CALLES = ['Av. España', 'San Luis', 'General Bari', 'Valdés', 'Av. Los Placeres', 'Av. Matta'];
const CAPAS = [
  { id: 'senderos', texto: 'Senderos' },
  { id: 'escaleras', texto: 'Escaleras' },
  { id: 'servicios', texto: 'Servicios' },
  { id: 'calles', texto: 'Nombres de calles' },
];

function useEscritorio() {
  const consulta = '(min-width: 900px)';
  const [si, setSi] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const alCambiar = () => setSi(m.matches);
    m.addEventListener('change', alCambiar);
    return () => m.removeEventListener('change', alCambiar);
  }, []);
  return si;
}

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Rótulos de calle: el centro del tramo más largo de cada calle con nombre, girado según su rumbo.
const ROTULOS = (() => {
  const mejor = new Map();
  for (const f of geojson.features) {
    const { tipo, nombre } = f.properties;
    if (tipo !== 'calle' || !CALLES.includes(nombre) || f.geometry.type !== 'LineString') continue;
    const c = f.geometry.coordinates;
    for (let i = 0; i < c.length - 1; i++) {
      const dlat = c[i + 1][1] - c[i][1];
      const dlng = (c[i + 1][0] - c[i][0]) * Math.cos((c[i][1] * Math.PI) / 180);
      const largo = Math.hypot(dlat, dlng);
      if (!mejor.has(nombre) || largo > mejor.get(nombre).largo) {
        let ang = (-Math.atan2(dlat, dlng) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        mejor.set(nombre, { nombre, largo, ang, latlng: [(c[i][1] + c[i + 1][1]) / 2, (c[i][0] + c[i + 1][0]) / 2] });
      }
    }
  }
  return [...mejor.values()];
})();
const iconoCalle = (r) => L.divIcon({ className: '', html: `<span class="plano-calle-nombre" style="transform:rotate(${r.ang.toFixed(1)}deg)">${r.nombre}</span>`, iconSize: [140, 20], iconAnchor: [70, 10] });
const iconoAqui = L.divIcon({ className: '', html: '<span class="plano-aqui"><span class="plano-aqui__punto"></span><span class="plano-aqui__texto">Estás aquí, Acceso</span></span>', iconSize: [150, 24], iconAnchor: [12, 12] });
const iconoBano = L.divIcon({ className: '', html: `<span class="plano-bano" aria-hidden="true">${renderToStaticMarkup(<Toilet weight="bold" />)}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] });
const iconoSala = (ref) => L.divIcon({ className: '', html: `<span class="plano-sala-ref">${ref}</span>`, iconSize: [40, 14], iconAnchor: [20, 7] });

const PADDING_ARRIBA_PLANO = 40;

function encajar(mapa, limites, padAbajo, { animar = false, maxZoom } = {}) {
  mapa.invalidateSize();
  const { x: ancho, y: alto } = mapa.getSize();
  if (!(ancho > 0 && alto > 0)) return;
  const { arriba, abajo, lado } = paddingAjustado(alto, padAbajo, ancho, PADDING_ARRIBA_PLANO);
  const opciones = {
    paddingTopLeft: [lado, arriba],
    paddingBottomRight: [lado, abajo],
    ...(maxZoom != null ? { maxZoom } : {}),
  };
  try {
    if (animar) mapa.flyToBounds(limites, opciones);
    else mapa.fitBounds(limites, { ...opciones, animate: false });
  } catch {
    try { mapa.fitBounds(limites, maxZoom != null ? { maxZoom, animate: false } : { animate: false }); } catch { /* el mapa queda como estaba */ }
  }
}

// Encaja el edificio elegido (o todo el campus) dejando libre lo que tapa la hoja inferior en móvil.
function Encuadre({ edificio, padAbajo }) {
  const mapa = useMap();
  useEffect(() => {
    if (!edificio) { encajar(mapa, LIMITES, padAbajo); return; }
    encajar(mapa, edificio.bounds, padAbajo, { animar: !sinMovimiento(), maxZoom: edificio.letra === 'C' ? 19.5 : 19 });
  }, [mapa, edificio, padAbajo]);
  return null;
}

function Controles({ padAbajo }) {
  const mapa = useMap();
  const evitar = (el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); } };
  return (
    <div className="plano-controles" ref={evitar}>
      <button type="button" className="mapa-control" aria-label="Acercar" onClick={() => mapa.zoomIn()}><Plus weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Alejar" onClick={() => mapa.zoomOut()}><Minus weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Ver todo el campus" onClick={() => encajar(mapa, LIMITES, padAbajo)}><Crosshair weight="bold" aria-hidden="true" /></button>
    </div>
  );
}

function Escala() {
  const mapa = useMap();
  useEffect(() => {
    const control = L.control.scale({ imperial: false, position: 'bottomleft' });
    control.addTo(mapa);
    return () => { control.remove(); };
  }, [mapa]);
  return null;
}

function Etiquetas({ edificio, piso, calles }) {
  const mapa = useMap();
  const [zoom, setZoom] = useState(mapa.getZoom());
  useMapEvents({ zoomend: () => setZoom(mapa.getZoom()) });
  const salas = useMemo(() => {
    if (!edificio) return [];
    return interior(edificio.letra, piso).filter((f) => f.geometry.type === 'Polygon').map((f) => ({
      id: f.properties.osm, bano: f.properties.servicio === 'toilets', ref: f.properties.ref || f.properties.nombre || '', centro: centroDe(f.geometry),
    }));
  }, [edificio, piso]);
  return (
    <>
      {calles && ROTULOS.map((r) => <Marker key={r.nombre} position={r.latlng} icon={iconoCalle(r)} interactive={false} keyboard={false} />)}
      {zoom >= 19 && salas.map((s) => (s.bano
        ? <Marker key={s.id} position={s.centro} icon={iconoBano} interactive={false} keyboard={false} />
        : s.ref && <Marker key={s.id} position={s.centro} icon={iconoSala(s.ref)} interactive={false} keyboard={false} />))}
    </>
  );
}

const notaDe = (e, piso, hayInterior) => {
  if (hayInterior) return `Plano interior del piso ${piso} según OpenStreetMap. Las salas marcadas con el ícono de baño son baños.`;
  if (e.letra === 'C' || e.pisos) return 'Plano interior pendiente: se agrega con el levantamiento en terreno.';
  return 'Número de pisos y plano interior por confirmar en terreno.';
};

function Ficha({ edificio, piso, onPiso, onCerrar, grafo, movil }) {
  const pisos = pisosDe(edificio);
  const hayInterior = interior(edificio.letra, piso).length > 0;
  const destino = nodoDestino(grafo, edificio.letra);
  const aSub = edificio.pisos ? `${edificio.pisos} ${edificio.pisos === 1 ? 'piso' : 'pisos'}` : 'Pisos por confirmar';
  return (
    <section className={`plano-ficha${movil ? ' plano-ficha--movil' : ''}`} aria-labelledby="plano-ficha-titulo">
      <div className="plano-ficha__cabeza">
        <span className="plano-insignia plano-insignia--grande" aria-hidden="true">{edificio.letra ?? edificio.titulo.charAt(0)}</span>
        <div>
          <h2 id="plano-ficha-titulo">{edificio.titulo}</h2>
          <p className="plano-ficha__sub">{[edificio.sub, aSub].filter(Boolean).join('. ')}</p>
        </div>
        <button type="button" className="plano-ficha__cerrar" aria-label="Cerrar ficha" onClick={onCerrar}><X weight="bold" aria-hidden="true" /></button>
      </div>
      <div className="plano-ficha__piso">
        <span id="plano-piso-leyenda" className="plano-ficha__leyenda">Piso</span>
        <RadioGrupo
          clase="plano-pisos" claseOpcion="plano-piso"
          opciones={pisos.map((p) => ({ id: p }))} valor={piso} onCambiar={onPiso}
          etiquetaDe={(o) => `Piso ${o.id < 0 ? `menos ${-o.id}` : o.id}`} hijoDe={(o) => (o.id < 0 ? `−${-o.id}` : o.id)}
          describedBy="plano-piso-leyenda"
        />
      </div>
      <p className="plano-ficha__nota">{notaDe(edificio, piso, hayInterior)}</p>
      <ul className="plano-acceso">
        {['Entrada sin escalones', 'Ascensor', 'Baño accesible'].map((t) => (
          <li key={t}><span>{t}</span><span className="plano-acceso__valor"><Question weight="bold" aria-hidden="true" /> Por levantar</span></li>
        ))}
      </ul>
      <Link className="boton boton--primario boton--ancho" to={destino ? `/?hasta=${destino}` : '/'}>Cómo llegar sin barreras</Link>
    </section>
  );
}

export default function Plano() {
  const escritorio = useEscritorio();
  const { grafo } = useLugares();
  const datos = grafo ?? campusRespaldo;
  const [q, setQ] = useState('');
  const [clave, setClave] = useState(null);
  const [piso, setPiso] = useState(1);
  const [capas, setCapas] = useState({ senderos: true, escaleras: true, servicios: true, calles: true });
  const refs = useRef(new Map());
  const buscador = useRef(null);
  const abrio = useRef(null);

  // En móvil las calles empiezan apagadas.
  useEffect(() => { if (!escritorio) setCapas((c) => ({ ...c, calles: false })); }, [escritorio]);

  const edificio = EDIFICIOS.find((e) => e.clave === clave) ?? null;
  const visibles = useMemo(() => filtrarEdificios(EDIFICIOS, q), [q]);
  const lista = escritorio ? visibles : visibles.slice(0, 6);
  const interiorPiso = useMemo(() => (edificio ? interior(edificio.letra, piso) : []), [edificio, piso]);

  const elegir = (e, desdeLista = false) => {
    abrio.current = desdeLista ? e.clave : null;
    setClave(e.clave);
    setPiso(pisoInicial(e));
  };
  const cerrar = () => {
    const volver = abrio.current && refs.current.get(abrio.current);
    setClave(null);
    queueMicrotask(() => (volver ?? buscador.current)?.focus());
  };
  // Estable: CapaPlano recrea la capa clicable si cambia la función.
  const alElegirEnMapa = useCallback((k) => {
    const e = EDIFICIOS.find((x) => x.clave === k);
    if (!e) return;
    abrio.current = null;
    setClave(e.clave);
    setPiso(pisoInicial(e));
  }, []);
  const alTeclear = (ev) => { if (ev.key === 'Escape' && edificio) { ev.stopPropagation(); cerrar(); } };

  const etiquetaMapa = edificio ? `Plano de Casa Central. ${edificio.titulo} elegido, piso ${piso < 0 ? `menos ${-piso}` : piso}.` : 'Plano de Casa Central.';
  const padAbajo = !escritorio && edificio ? 300 : !escritorio ? 130 : 0;

  const buscar = (
    <div className="plano-buscar">
      <label htmlFor="plano-q" className={escritorio ? 'campo__etiqueta' : 'sr-only'}>Buscar edificio o servicio</label>
      <div className="plano-buscar__campo">
        <MagnifyingGlass weight="bold" aria-hidden="true" />
        <input id="plano-q" ref={buscador} type="search" className="campo__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: Biblioteca, C, Casino" autoComplete="off" />
      </div>
      <p className="plano-buscar__conteo" aria-live="polite">{visibles.length === 0 ? `Sin resultados para «${q}»` : `${visibles.length} ${visibles.length === 1 ? 'edificio' : 'edificios'}`}</p>
    </div>
  );

  const capasUI = (
    <fieldset className="plano-capas">
      <legend>Capas</legend>
      {CAPAS.map((c) => (
        <label key={c.id} className="plano-capa">
          <input type="checkbox" checked={capas[c.id]} onChange={(e) => setCapas({ ...capas, [c.id]: e.target.checked })} /> {c.texto}
        </label>
      ))}
    </fieldset>
  );

  const items = (
    <ul className="plano-lista">
      {lista.map((e) => (
        <li key={e.clave}>
          <button type="button" ref={(el) => { if (el) refs.current.set(e.clave, el); }} className="plano-item" aria-pressed={e.clave === clave} onClick={() => elegir(e, true)}>
            <span className="plano-insignia" aria-hidden="true">{e.letra ?? e.titulo.charAt(0)}</span>
            <span className="plano-item__texto"><strong>{e.titulo}</strong>{e.sub && <span>{e.sub}</span>}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="plano" onKeyDown={alTeclear}>
      {escritorio && (
        <div className="plano__barra">
          <div>
            <h1>Plano de Casa Central</h1>
            <p>Av. España 1680, Valparaíso</p>
          </div>
          <Link className="boton boton--primario" to="/"><NavigationArrow weight="bold" aria-hidden="true" /> Planificar una ruta accesible</Link>
        </div>
      )}
      {!escritorio && <h1 className="sr-only">Plano de Casa Central</h1>}

      <div className="plano__cuerpo">
        {escritorio && <aside className="plano__lista" aria-label="Edificios del campus">{buscar}{items}</aside>}

        <div className="plano__mapa" role="region" aria-label={etiquetaMapa}>
          <LimiteError>
            <MapContainer bounds={LIMITES} maxBounds={LIMITES_VISTA} minZoom={ZOOM.min} maxZoom={ZOOM.max + 0.5} zoomSnap={0.25} zoomDelta={0.5} zoomControl={false} keyboard className="mapa-plano plano__leaflet">
              <CapaPlano seleccion={clave} onElegir={alElegirEnMapa} capas={{ senderos: capas.senderos, escaleras: capas.escaleras, servicios: capas.servicios, calles: true }} interior={interiorPiso} />
              <Etiquetas edificio={edificio} piso={piso} calles={capas.calles} />
              <Marker position={AQUI} icon={iconoAqui} interactive={false} keyboard={false} />
              <Encuadre edificio={edificio} padAbajo={padAbajo} />
              <Controles padAbajo={padAbajo} />
              <Escala />
            </MapContainer>
          </LimiteError>

          {escritorio && capasUI}
          {escritorio && edificio && <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} grafo={datos} />}
          <p className="plano__nota-datos">«Estás aquí» es simulado. Edificios H, O, J, I, N, F2 y P2 no están en OpenStreetMap y no se dibujan.</p>
        </div>

        {!escritorio && (
          <>
            <div className="plano-flotante">{buscar}{q && lista.length > 0 && items}</div>
            <div className="plano-hoja">
              <span className="plano-hoja__asa" aria-hidden="true" />
              {edificio ? (
                <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} grafo={datos} movil />
              ) : (
                <div className="plano-hoja__vacia">
                  <p><strong>Toca un edificio o búscalo</strong></p>
                  <div className="plano-rapidos">
                    {['C', 'A', 'U', 'M'].map((l) => { const e = EDIFICIOS.find((x) => x.clave === l); return e && <button key={l} type="button" className="boton boton--secundario boton--chico" onClick={() => elegir(e, true)}>{e.titulo}</button>; })}
                  </div>
                </div>
              )}
              <details className="plano-capas-movil">
                <summary>Capas del plano</summary>
                {capasUI}
              </details>
            </div>
          </>
        )}
      </div>
      <div className="sr-only" aria-live="polite">{edificio ? `${edificio.titulo} elegido` : ''}</div>
    </div>
  );
}

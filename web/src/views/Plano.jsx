import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Buildings, Check, Crosshair, Info, MagnifyingGlass, Minus, NavigationArrow, Plus, Toilet, X } from '@phosphor-icons/react';
import { renderToStaticMarkup } from 'react-dom/server';
import CapaPlano from '../plano/CapaPlano.jsx';
import LimiteError from '../components/LimiteError.jsx';
import RadioGrupo from '../components/RadioGrupo.jsx';
import { geojson, LIMITES, LIMITES_VISTA, ZOOM } from '../plano/plano.js';
import { EDIFICIOS, FALTAN_EN_OSM, centroDe, filtrarEdificios, interior, nodoDestino, norm, pisoInicial, pisosDe, textoPisos } from '../plano/edificios.js';
import campusRespaldo from '../../../data/campus.json';
import { useLugares } from '../hooks/useLugares.js';
import { useBarreras } from '../hooks/useBarreras.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { calcularRuta } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import perfilesRespaldo from '../../../data/perfiles.json';
import { armarRuta } from '../lib/pasos.js';
import { buscarSalas, marcasPiso, salaDeFeature, salasDe, salasSinPoligono, textoLugar } from '../lib/rutaPlano.js';
import CapaRuta from './plano/CapaRuta.jsx';
import TuRuta from './plano/TuRuta.jsx';
import PanelCapas from './plano/PanelCapas.jsx';
import '../components/MapaRuta.css';
import 'leaflet/dist/leaflet.css';
import './Plano.css';

// /plano (Lote 10 v2): explorar el campus. La lista es la vía accesible; el plano es el apoyo visual.
const AQUI = [-33.033897, -71.59523]; // Acceso Av. España (simulado, declarado en Capas y en Acerca)
const LIMITE_MOVIL = 6;
const CALLES = ['Av. España', 'San Luis', 'General Bari', 'Valdés', 'Av. Los Placeres', 'Av. Matta'];
const RAPIDOS = [
  { clave: 'C', nombre: 'Edificio C' },
  { clave: 'A', nombre: 'Edificio A' },
  { clave: 'U', nombre: 'Edificio U, Biblioteca', extra: 'Biblioteca' },
  { clave: 'M', nombre: 'Edificio M' },
];
const ACCESO = ['Entrada sin escalones', 'Ascensor', 'Baño accesible'];
const ESCALAS = [10, 20, 50, 100, 200];
const ANCHO_CAPAS = 288;
const ANCHO_FICHA = 360;

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

// Tamaño de un elemento medido con ResizeObserver (ancho del plano, alto de la hoja).
function useTamano() {
  const [el, setEl] = useState(null);
  const [tam, setTam] = useState({ ancho: 0, alto: 0 });
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entrada]) => {
      // Caja de borde (con padding): la hoja móvil tiene padding y la píldora va justo encima.
      const caja = entrada.borderBoxSize?.[0];
      const width = caja ? caja.inlineSize : entrada.contentRect.width;
      const height = caja ? caja.blockSize : entrada.contentRect.height;
      setTam((t) => (Math.round(t.ancho) === Math.round(width) && Math.round(t.alto) === Math.round(height) ? t : { ancho: width, alto: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, tam];
}

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const textoPiso = (p) => (p < 0 ? `−${-p}` : String(p));
const habladoPiso = (p) => (p < 0 ? `menos ${-p}` : String(p));
const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
const iconoCalle = (r) => L.divIcon({ className: '', html: `<span class="plano-calle-nombre" style="transform:rotate(${r.ang.toFixed(1)}deg)">${escapar(r.nombre)}</span>`, iconSize: [140, 20], iconAnchor: [70, 10] });
const iconoAqui = L.divIcon({ className: '', html: '<span class="plano-aqui"><span class="plano-aqui__punto"></span><span class="plano-aqui__texto">Estás aquí, Acceso</span></span>', iconSize: [150, 24], iconAnchor: [12, 12] });
const iconoBano = L.divIcon({ className: '', html: `<span class="plano-bano" aria-hidden="true">${renderToStaticMarkup(<Toilet weight="bold" />)}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] });
const iconoMarcador = (nombre) => L.divIcon({ className: '', html: `<span class="plano-sala-marcador">${escapar(nombre)}</span>`, iconSize: [90, 22], iconAnchor: [45, 11] });
const iconoSala = (ref) => L.divIcon({ className: '', html: `<span class="plano-sala-ref">${escapar(ref)}</span>`, iconSize: [40, 14], iconAnchor: [20, 7] });

// Encaja unos límites dejando libre lo que tapan los paneles (padding asimétrico, acotado al tamaño del plano).
function encajar(mapa, limites, pad, { animar = false, maxZoom } = {}) {
  mapa.invalidateSize();
  const { x: ancho, y: alto } = mapa.getSize();
  if (!(ancho > 0 && alto > 0)) return;
  const izq = Math.min(pad.izq ?? 24, ancho * 0.4);
  const der = Math.min(pad.der ?? 24, ancho * 0.45);
  const arriba = Math.min(pad.arriba ?? 40, alto * 0.25);
  const abajo = Math.min(pad.abajo ?? 24, alto * 0.6);
  const opciones = { paddingTopLeft: [izq, arriba], paddingBottomRight: [der, abajo], ...(maxZoom != null ? { maxZoom } : {}) };
  try {
    if (animar) mapa.flyToBounds(limites, opciones);
    else mapa.fitBounds(limites, { ...opciones, animate: false });
  } catch {
    try { mapa.fitBounds(limites, maxZoom != null ? { maxZoom, animate: false } : { animate: false }); } catch { /* el mapa queda como estaba */ }
  }
}

// Cámara del plano: encaja la ruta (con todos sus tramos a la vista) si acaba de aparecer; si no, el edificio elegido
// (con su interior, p. ej. los pasillos del −1 del C) o todo el campus. Si solo cambia el padding (se abre la ficha,
// crece la hoja móvil), vuelve a encajar lo mismo sin animar. Elegir otro edificio sí lleva la cámara a ese edificio.
function Camara({ edificio, interiorPiso, coordenadas, pad }) {
  const mapa = useMap();
  const clavePad = JSON.stringify(pad);
  const claveRuta = coordenadas.length > 1 ? coordenadas.map((c) => c.join(',')).join(';') : '';
  const previo = useRef({ edificio: undefined, interiorPiso: undefined, claveRuta: '' });
  const modo = useRef('edificio');
  useEffect(() => {
    const p = previo.current;
    const cambioRuta = claveRuta !== p.claveRuta;
    const cambioEdificio = edificio !== p.edificio || interiorPiso !== p.interiorPiso;
    previo.current = { edificio, interiorPiso, claveRuta };
    if (cambioRuta && claveRuta) modo.current = 'ruta';
    else if (cambioEdificio || !claveRuta) modo.current = 'edificio';
    const cambio = cambioRuta || cambioEdificio;
    const animar = cambio && !sinMovimiento();
    const q = JSON.parse(clavePad);
    if (modo.current === 'ruta') {
      encajar(mapa, L.latLngBounds(claveRuta.split(';').map((c) => c.split(',').map(Number))), q, { animar, maxZoom: 19.5 });
      return;
    }
    if (!edificio) { encajar(mapa, LIMITES, q); return; }
    let limites = L.latLngBounds(edificio.bounds);
    if (interiorPiso.length) {
      try { limites = limites.extend(L.geoJSON({ type: 'FeatureCollection', features: interiorPiso }).getBounds()); } catch { /* sin interior */ }
    }
    encajar(mapa, limites, q, { animar, maxZoom: edificio.letra === 'C' ? 19.5 : 19 });
  }, [mapa, edificio, interiorPiso, claveRuta, clavePad]);
  return null;
}

// Atributos de la región del plano sobre el contenedor de Leaflet (que ya es enfocable): un solo Tab.
function Region({ etiqueta }) {
  const mapa = useMap();
  useEffect(() => {
    const c = mapa.getContainer();
    c.setAttribute('role', 'region');
    c.setAttribute('aria-roledescription', 'plano');
    c.setAttribute('aria-describedby', 'plano-ayuda-teclado');
    c.setAttribute('tabindex', '0');
  }, [mapa]);
  useEffect(() => { mapa.getContainer().setAttribute('aria-label', etiqueta); }, [mapa, etiqueta]);
  return null;
}

const evitar = (el) => { if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); } };

function Controles({ pad }) {
  const mapa = useMap();
  const anim = () => ({ animate: !sinMovimiento() });
  return (
    <div className="plano-controles" role="group" aria-label="Zoom del plano" ref={evitar}>
      <button type="button" className="mapa-control" aria-label="Acercar" onClick={() => mapa.zoomIn(0.5, anim())}><Plus weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Alejar" onClick={() => mapa.zoomOut(0.5, anim())}><Minus weight="bold" aria-hidden="true" /></button>
      <button type="button" className="mapa-control" aria-label="Ver todo el campus" onClick={() => encajar(mapa, LIMITES, pad)}><Crosshair weight="bold" aria-hidden="true" /></button>
    </div>
  );
}

// Píldora de abajo a la izquierda: la N, la escala (la primera que mida al menos 56 px) y la atribución de OSM.
function Pildora({ escala, clase }) {
  const mapa = useMap();
  const [medida, setMedida] = useState(null);
  const medir = useCallback(() => {
    const { x, y } = mapa.getSize();
    if (!(x > 0 && y > 0)) return;
    const a = mapa.containerPointToLatLng([0, y / 2]);
    const b = mapa.containerPointToLatLng([100, y / 2]);
    const mPorPx = mapa.distance(a, b) / 100;
    if (!(mPorPx > 0)) return;
    const m = ESCALAS.find((v) => v / mPorPx >= 56) ?? ESCALAS[ESCALAS.length - 1];
    setMedida({ m, px: Math.round(m / mPorPx) });
  }, [mapa]);
  useMapEvents({ zoomend: medir, moveend: medir, resize: medir });
  useEffect(() => { medir(); }, [medir]);
  return (
    <div className={`plano-pildora ${clase ?? ''}`} ref={evitar}>
      {escala && (
        <>
          <span className="plano-pildora__norte" aria-hidden="true">N</span>
          {medida && (
            <span className="plano-pildora__escala">
              <span className="plano-pildora__barra" style={{ width: `${medida.px}px` }} aria-hidden="true" />
              <span>{`${medida.m} m`}</span>
              <span className="sr-only">{`Escala: ${medida.m} m`}</span>
            </span>
          )}
        </>
      )}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© colaboradores de OpenStreetMap</a>
    </div>
  );
}

function Etiquetas({ edificio, piso, calles, datos, onSala }) {
  const mapa = useMap();
  const [zoom, setZoom] = useState(mapa.getZoom());
  useMapEvents({ zoomend: () => setZoom(mapa.getZoom()) });
  const salas = useMemo(() => {
    if (!edificio || piso == null) return [];
    return interior(edificio.letra, piso).filter((f) => f.geometry.type === 'Polygon').map((f) => ({
      id: f.properties.osm, bano: f.properties.servicio === 'toilets', ref: f.properties.ref || f.properties.nombre || '', centro: centroDe(f.geometry),
    }));
  }, [edificio, piso]);
  // Salas agregadas a mano sin polígono en el plano: un marcador en su lat/lng, solo en el piso elegido.
  const sinPoligono = useMemo(() => (edificio && piso != null ? salasSinPoligono(datos, edificio.letra, piso, interior(edificio.letra, piso)) : []), [datos, edificio, piso]);
  return (
    <>
      {sinPoligono.map((n) => (
        <Marker key={n.id} position={[n.lat, n.lng]} icon={iconoMarcador(n.nombre)} keyboard={false} eventHandlers={{ click: () => onSala(n.id) }} />
      ))}
      {calles && ROTULOS.map((r) => <Marker key={r.nombre} position={r.latlng} icon={iconoCalle(r)} interactive={false} keyboard={false} />)}
      {zoom >= 19 && salas.map((s) => (s.bano
        ? <Marker key={s.id} position={s.centro} icon={iconoBano} interactive={false} keyboard={false} />
        : s.ref && <Marker key={s.id} position={s.centro} icon={iconoSala(s.ref)} interactive={false} keyboard={false} />))}
    </>
  );
}

const notaDe = (e, piso, hayInterior, hayPisos) => {
  if (!hayPisos) return 'Número de pisos y plano interior por confirmar en terreno.';
  if (hayInterior && e.letra !== 'C') return `Plano interior del piso ${textoPiso(piso)} dibujado por el equipo a partir de un boceto en terreno: la escala es aproximada. Las salas marcadas con el ícono de baño son baños.`;
  if (hayInterior && piso === -1) return 'Plano interior del piso −1 según OpenStreetMap: sus 3 pasillos.';
  if (hayInterior) return `Plano interior del piso ${textoPiso(piso)} según OpenStreetMap. Las salas marcadas con el ícono de baño son baños.`;
  return 'Plano interior pendiente: se agrega con el levantamiento en terreno.';
};

function Insignia({ letra, tam = '' }) {
  const clase = `plano-insignia${tam ? ` plano-insignia--${tam}` : ''}${letra && letra.length > 1 ? ' plano-insignia--doble' : ''}${letra ? '' : ' plano-insignia--sin'}`;
  return <span className={clase} aria-hidden="true">{letra ?? <Buildings weight="bold" />}</span>;
}

function Ficha({ edificio, piso, onPiso, onCerrar, onOtro, grafo, movil, sala, salas, onSala, onDesde, onHasta, tituloRef }) {
  const pisos = pisosDe(edificio);
  const hayPisos = pisos.length > 0;
  const hayInterior = piso != null && interior(edificio.letra, piso).length > 0;
  const destino = nodoDestino(grafo, edificio.letra);
  const enlace = destino ? `/?hasta=${encodeURIComponent(destino)}` : '/';
  const nota = notaDe(edificio, piso, hayInterior, hayPisos);
  return (
    <section className={`plano-ficha${movil ? ' plano-ficha--movil' : ''}`} aria-labelledby="plano-ficha-titulo">
      <div className="plano-ficha__cabeza">
        <Insignia letra={edificio.letra} tam={movil ? 'media' : 'grande'} />
        <div>
          <h2 id="plano-ficha-titulo" ref={tituloRef} tabIndex={-1}>{edificio.titulo}</h2>
          {movil ? (
            <p className="plano-ficha__linea">{[edificio.sub, textoPisos(edificio)].filter(Boolean).join(' · ')}</p>
          ) : (
            <>
              {edificio.sub && <p className="plano-ficha__sub">{edificio.sub}</p>}
              <p className="plano-ficha__pisos">{textoPisos(edificio)}</p>
            </>
          )}
        </div>
        {!movil && <button type="button" className="plano-ficha__cerrar" aria-label="Cerrar ficha" onClick={onCerrar}><X weight="bold" aria-hidden="true" /></button>}
      </div>
      {hayPisos && (
        <div className="plano-ficha__piso">
          <span id="plano-piso-leyenda" className="plano-ficha__leyenda">Piso</span>
          <div role="group" aria-labelledby="plano-piso-leyenda">
            <RadioGrupo
              clase="plano-pisos" claseOpcion="plano-piso"
              opciones={pisos.map((p) => ({ id: p }))} valor={piso} onCambiar={onPiso}
              etiquetaDe={(o) => `Piso ${habladoPiso(o.id)}`}
              hijoDe={(o, sel) => <>{sel && <Check weight="bold" aria-hidden="true" />}{textoPiso(o.id)}</>}
            />
          </div>
        </div>
      )}
      <p className="plano-ficha__nota">
        {hayInterior ? <Check weight="bold" aria-hidden="true" /> : <Info weight="bold" aria-hidden="true" />}
        <span>{nota}</span>
      </p>
      {salas.length > 0 && (
        <div className="plano-salas">
          <h3 id="plano-salas-titulo">Salas de este piso</h3>
          <ul aria-labelledby="plano-salas-titulo">
            {salas.map((n) => (
              <li key={n.id}>
                <button type="button" className="plano-sala-item" aria-pressed={sala?.id === n.id} onClick={() => onSala(n.id)}>
                  {n.nombre}{n.departamento && <span> · {n.departamento}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sala && (
        <div className="plano-sala-ficha" role="group" aria-label={`Sala elegida: ${sala.nombre}`}>
          <p className="plano-sala-ficha__titulo"><strong>{sala.nombre}</strong></p>
          <p className="plano-sala-ficha__meta">{`Edificio ${sala.edificio}, piso ${sala.piso}`}{sala.departamento ? `. ${sala.departamento}` : ''}</p>
          <div className="plano-sala-ficha__acciones">
            <button type="button" className="boton boton--secundario boton--chico" onClick={() => onDesde(sala.id)}>Salir desde aquí</button>
            <button type="button" className="boton boton--primario boton--chico" onClick={() => onHasta(sala.id)}>Ir aquí</button>
          </div>
        </div>
      )}
      {!sala && destino && (
        <div className="plano-sala-ficha__acciones">
          <button type="button" className="boton boton--secundario boton--chico" onClick={() => onDesde(destino)}>Salir desde aquí</button>
          <button type="button" className="boton boton--secundario boton--chico" onClick={() => onHasta(destino)}>Ir aquí</button>
        </div>
      )}
      {movil ? (
        <>
          <p className="plano-ficha__acceso-movil">Accesibilidad: por levantar</p>
          <div className="plano-hoja__botones">
            <button type="button" className="boton boton--secundario" onClick={onOtro}>Otro edificio</button>
            <Link className="boton boton--primario" to={enlace}><NavigationArrow weight="bold" aria-hidden="true" /> Cómo llegar</Link>
          </div>
        </>
      ) : (
        <>
          <div className="plano-acceso">
            <h3 id="plano-acceso-titulo">Accesibilidad</h3>
            <dl aria-labelledby="plano-acceso-titulo">
              {ACCESO.map((t) => (
                <div key={t}><dt>{t}</dt><dd>Por levantar</dd></div>
              ))}
            </dl>
          </div>
          <Link className="boton boton--primario boton--ancho" to={enlace}><NavigationArrow weight="bold" aria-hidden="true" /> Cómo llegar sin barreras</Link>
        </>
      )}
    </section>
  );
}

export default function Plano() {
  const escritorio = useEscritorio();
  const { grafo } = useLugares();
  const datos = grafo ?? campusRespaldo;
  const [q, setQ] = useState('');
  const [clave, setClave] = useState(null);
  const [piso, setPiso] = useState(null);
  const [capas, setCapas] = useState({ senderos: true, escaleras: true, servicios: true, calles: true });
  const [capasAbierto, setCapasAbierto] = useState(true);
  const refs = useRef(new Map());
  const buscador = useRef(null);
  const tituloFicha = useRef(null);
  const enfocarFicha = useRef(false);
  const [refMapa, tamMapa] = useTamano();
  const [refHoja, tamHoja] = useTamano();
  const [refFlotante, tamFlotante] = useTamano();
  const hojaEl = useRef(null);
  const refHojaTotal = useCallback((el) => { hojaEl.current = el; refHoja(el); }, [refHoja]);
  const angosto = escritorio && tamMapa.ancho > 0 && tamMapa.ancho < 760;

  // #189: inicio y llegada (ids de nodo), sala elegida y paso activo de la ruta.
  const { perfil } = usePreferencias();
  const { barreras } = useBarreras();
  const [desdeId, setDesdeId] = useState('entrada-principal');
  const [hastaId, setHastaId] = useState(null);
  const [salaId, setSalaId] = useState(null);
  const [paso, setPaso] = useState(null);
  const [anuncio, setAnuncio] = useState('');
  const nodos = useMemo(() => new Map(datos.nodos.map((n) => [n.id, n])), [datos]);
  const perfilId = perfilesRespaldo.some((p) => p.id === perfil) ? perfil : 'estandar';
  const claveBloqueos = JSON.stringify([...new Set(bloqueosDe(barreras))].sort());
  const resultado = useMemo(
    () => (desdeId && hastaId && desdeId === hastaId ? { ok: false, motivo: 'El inicio y la llegada son el mismo lugar.' } : desdeId && hastaId ? calcularRuta(datos, perfilesRespaldo, { desde: desdeId, hasta: hastaId, perfil: perfilId, bloqueos: JSON.parse(claveBloqueos) }) : null),
    [datos, desdeId, hastaId, perfilId, claveBloqueos],
  );
  const ruta = useMemo(() => (resultado?.ok ? armarRuta(datos, resultado, { posicion: (n) => [n.lat, n.lng] }) : { pasos: [], coordenadas: [] }), [datos, resultado]);
  const marcas = useMemo(() => marcasPiso(datos, resultado), [datos, resultado]);
  useEffect(() => { setPaso(null); }, [resultado]);
  // Al armarse una ruta nueva, la hoja móvil vuelve arriba para que «Tu ruta» quede a la vista.
  useEffect(() => { if (resultado && hojaEl.current) hojaEl.current.scrollTop = 0; }, [resultado]);
  const pasoActivo = paso ?? ruta.pasos.length - 1;

  // En móvil las calles empiezan apagadas y Capas plegado; en un plano angosto, Capas también parte plegado.
  useEffect(() => { if (!escritorio) { setCapas((c) => ({ ...c, calles: false })); setCapasAbierto(false); } }, [escritorio]);
  useEffect(() => { if (angosto) setCapasAbierto(false); }, [angosto]);

  const edificio = EDIFICIOS.find((e) => e.clave === clave) ?? null;
  const visibles = useMemo(() => filtrarEdificios(EDIFICIOS, q), [q]);
  const hayConsulta = q.trim().length > 0;
  const hayMas = !escritorio && hayConsulta && visibles.length > LIMITE_MOVIL;
  const lista = hayMas ? visibles.slice(0, LIMITE_MOVIL) : visibles;
  const codigo = norm(q).match(/^(edificio\s+)?([a-z]\d?)$/);
  const faltaLetra = codigo && FALTAN_EN_OSM.includes(codigo[2].toUpperCase()) ? codigo[2].toUpperCase() : null;
  const interiorPiso = useMemo(() => (edificio && piso != null ? interior(edificio.letra, piso) : []), [edificio, piso]);
  const salasPiso = useMemo(() => (edificio && piso != null ? salasDe(datos, edificio.letra, piso) : []), [datos, edificio, piso]);
  const sala = salaId ? nodos.get(salaId) ?? null : null;
  const salaOsm = useMemo(
    () => (sala && edificio ? interiorPiso.find((f) => salaDeFeature(datos, edificio.letra, piso, f)?.id === sala.id)?.properties.osm ?? null : null),
    [datos, sala, edificio, piso, interiorPiso],
  );

  // Elegir un edificio: pliega Capas en escritorio, deja la fila a la vista; en móvil cierra la búsqueda y lleva el foco a la ficha.
  const abrirEdificio = useCallback((e, { desdeBusqueda = false } = {}) => {
    setClave(e.clave);
    setPiso(pisoInicial(e));
    setSalaId(null);
    if (window.matchMedia('(min-width: 900px)').matches) {
      setCapasAbierto(false);
      queueMicrotask(() => refs.current.get(e.clave)?.scrollIntoView({ block: 'nearest' }));
    } else if (desdeBusqueda) {
      setQ('');
      enfocarFicha.current = true;
    }
  }, []);
  useEffect(() => {
    if (enfocarFicha.current && edificio) { enfocarFicha.current = false; tituloFicha.current?.focus(); }
  }, [edificio]);

  // Elegir una sala (desde la lista, el buscador o el plano): abre su edificio y su piso.
  const elegirSala = useCallback((id) => {
    const n = nodos.get(id);
    if (!n) return;
    const e = EDIFICIOS.find((x) => x.clave === n.edificio);
    if (e) { setClave(e.clave); setPiso(n.piso); }
    setSalaId(id);
  }, [nodos]);
  const fijarDesde = useCallback((id) => { setDesdeId(id); setAnuncio(`Salida fijada: ${textoLugar(nodos.get(id))}`); }, [nodos]);
  const fijarHasta = useCallback((id) => { setHastaId(id); setAnuncio(`Llegada fijada: ${textoLugar(nodos.get(id))}`); }, [nodos]);
  const alElegirSalaMapa = useRef(null);
  alElegirSalaMapa.current = (f) => { const n = edificio && salaDeFeature(datos, edificio.letra, piso, f); if (n) elegirSala(n.id); };
  const alElegirSala = useCallback((f) => alElegirSalaMapa.current(f), []);
  const irAPaso = (i) => {
    setPaso(i);
    const n = nodos.get(resultado.nodos[i + 1]);
    const e = n && EDIFICIOS.find((x) => x.clave === n.edificio);
    if (e) { setClave(e.clave); setPiso(n.piso); }
  };
  const intercambiar = () => { const d = desdeId; setDesdeId(hastaId); setHastaId(d); setAnuncio('Salida y llegada intercambiadas'); };
  const limpiarRuta = () => { setHastaId(null); setAnuncio('Ruta borrada'); };
  const enlaceMapa = `/mapa?${new URLSearchParams({ desde: desdeId ?? '', hasta: hastaId ?? '', perfil: perfilId })}`;
  const hayRuta = Boolean(hastaId || resultado);
  const panelRuta = hayRuta && (
    <TuRuta
      desde={desdeId ? nodos.get(desdeId) : null} hasta={hastaId ? nodos.get(hastaId) : null}
      resultado={resultado} pasos={ruta.pasos} paso={pasoActivo} onPaso={irAPaso}
      onIntercambiar={intercambiar} onLimpiar={limpiarRuta} anuncio={anuncio} enlaceMapa={enlaceMapa}
    />
  );
  const fichaProps = { sala, salas: salasPiso, onSala: elegirSala, onDesde: fijarDesde, onHasta: fijarHasta, tituloRef: tituloFicha };

  // Cerrar la ficha (botón o Escape): el foco vuelve a la fila del edificio, o a la búsqueda si la fila no está.
  const cerrar = () => {
    const volver = clave && refs.current.get(clave);
    setClave(null);
    setSalaId(null);
    queueMicrotask(() => ((volver && volver.isConnected ? volver : null) ?? buscador.current)?.focus());
  };
  const otroEdificio = () => {
    setClave(null);
    setSalaId(null);
    queueMicrotask(() => buscador.current?.focus());
  };
  const borrarBusqueda = () => { setQ(''); buscador.current?.focus(); };
  // Estable: CapaPlano recrea la capa clicable si cambia la función.
  const alElegirEnMapa = useCallback((k) => {
    const e = EDIFICIOS.find((x) => x.clave === k);
    if (e) abrirEdificio(e);
  }, [abrirEdificio]);
  const alTeclear = (ev) => { if (ev.key === 'Escape' && edificio) { ev.stopPropagation(); cerrar(); } };

  const etiquetaMapa = edificio
    ? `Plano de Casa Central. ${edificio.titulo} elegido${piso != null ? `, piso ${habladoPiso(piso)}` : ''}.`
    : 'Plano de Casa Central.';

  // Padding de la cámara: Capas a la izquierda, ficha a la derecha (o abajo si el plano es angosto), hoja abajo en móvil.
  const pad = escritorio
    ? {
      izq: capasAbierto ? ANCHO_CAPAS + 32 : 24,
      der: edificio && !angosto ? ANCHO_FICHA + 32 : 24,
      abajo: edificio && angosto ? tamMapa.alto * 0.5 + 16 : 56,
      arriba: 40,
    }
    : { izq: 28, der: 84, arriba: (tamFlotante.alto || 84) + 24, abajo: (tamHoja.alto || (edificio ? 380 : 150)) + 16 };

  const textoConteo = visibles.length === 0
    ? `Sin resultados para «${q}»`
    : `${visibles.length} ${visibles.length === 1 ? 'edificio' : 'edificios'}`;

  const idCampo = escritorio ? 'plano-lista-q' : 'plano-busqueda';
  const buscar = (
    <div className={`plano-buscar${escritorio ? '' : ' plano-buscar--movil'}`}>
      {escritorio && <label htmlFor={idCampo} className="campo__etiqueta">Buscar edificio o servicio</label>}
      <div className="plano-buscar__campo">
        {!escritorio && <label htmlFor={idCampo} className="plano-buscar__etiqueta-interna">Buscar edificio o servicio</label>}
        <MagnifyingGlass weight="bold" aria-hidden="true" />
        <input id={idCampo} ref={buscador} type="search" className="campo__input" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Ej.: Biblioteca, C, Casino" autoComplete="off" />
        {hayConsulta && (
          <button type="button" className="plano-buscar__borrar" aria-label="Borrar búsqueda" onClick={borrarBusqueda}><X weight="bold" aria-hidden="true" /></button>
        )}
      </div>
      {(escritorio || hayConsulta) && <p className="plano-buscar__conteo" aria-live="polite">{textoConteo}</p>}
    </div>
  );

  const sinResultados = visibles.length === 0 && hayConsulta && (
    <div className="plano-vacio">
      <p>Prueba con la letra del edificio o un servicio, como Casino.</p>
      {faltaLetra && <p>{`El Edificio ${faltaLetra} todavía no está en OpenStreetMap, por eso no aparece en el plano.`}</p>}
      <button type="button" className="boton boton--secundario boton--chico" onClick={borrarBusqueda}>Ver todos los edificios</button>
    </div>
  );

  const salasBuscadas = useMemo(() => buscarSalas(datos, q), [datos, q]);
  const items = (
    <>
      <ul className="plano-lista">
        {lista.map((e) => {
          const elegido = e.clave === clave;
          return (
            <li key={e.clave}>
              <button type="button" ref={(el) => { if (el) refs.current.set(e.clave, el); else refs.current.delete(e.clave); }} className="plano-item" aria-pressed={elegido} onClick={() => abrirEdificio(e, { desdeBusqueda: true })}>
                <Insignia letra={e.letra} />
                <span className="plano-item__texto"><strong>{e.titulo}</strong><span>{e.motivo ?? (e.sub || textoPisos(e))}</span></span>
                {elegido && <Check className="plano-item__check" weight="bold" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {hayMas && <p className="plano-buscar__limite">{`Se ven 6 de ${visibles.length}. Sigue escribiendo para acotar.`}</p>}
      {salasBuscadas.length > 0 && (
        <>
          <h3 className="plano-lista__titulo" id="plano-lista-salas">Salas</h3>
          <ul className="plano-lista" aria-labelledby="plano-lista-salas">
            {salasBuscadas.map((n) => (
              <li key={n.id}>
                <button type="button" className="plano-item" aria-pressed={n.id === salaId} onClick={() => { elegirSala(n.id); if (!escritorio) { setQ(''); enfocarFicha.current = true; } }}>
                  <Insignia letra={n.edificio} />
                  <span className="plano-item__texto"><strong>{n.nombre}</strong><span>{`Edificio ${n.edificio}, piso ${n.piso}`}{n.departamento ? `. ${n.departamento}` : ''}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  const panelCapas = (
    <PanelCapas abierto={capasAbierto} onAlternar={() => setCapasAbierto((a) => !a)} capas={capas} onCambiar={setCapas} movil={!escritorio} />
  );

  return (
    <div className="plano" onKeyDown={alTeclear} style={escritorio ? undefined : { '--alto-hoja': `${Math.round(tamHoja.alto || 160)}px` }}>
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
      <p id="plano-ayuda-teclado" className="sr-only">Las flechas mueven el plano y las teclas más y menos lo acercan y alejan. Todos los edificios también están en la lista.</p>

      <div className="plano__cuerpo">
        {escritorio && (
          <aside id="plano-lista" tabIndex={-1} className="plano__lista" aria-label="Edificios del campus">
            {buscar}
            {panelRuta}
            {sinResultados}
            {items}
          </aside>
        )}

        <div ref={refMapa} className={`plano__mapa plano-v2${angosto ? ' plano__mapa--angosto' : ''}`}>
          <LimiteError>
            <MapContainer bounds={LIMITES} maxBounds={LIMITES_VISTA} minZoom={ZOOM.min} maxZoom={ZOOM.max + 0.5} zoomSnap={0.25} zoomDelta={0.5} zoomControl={false} attributionControl={false} keyboard keyboardPanDelta={60} className="mapa-plano plano__leaflet">
              <Region etiqueta={etiquetaMapa} />
              <CapaPlano variante="plano" seleccion={clave} onElegir={alElegirEnMapa} capas={{ senderos: capas.senderos, escaleras: capas.escaleras, servicios: capas.servicios, calles: true }} interior={interiorPiso} onElegirSala={alElegirSala} salaSeleccion={salaOsm} />
              <Etiquetas edificio={edificio} piso={piso} calles={capas.calles} datos={datos} onSala={elegirSala} />
              <CapaRuta coordenadas={ruta.coordenadas} desde={desdeId && nodos.get(desdeId) ? [nodos.get(desdeId).lat, nodos.get(desdeId).lng] : null} hasta={hastaId && nodos.get(hastaId) ? [nodos.get(hastaId).lat, nodos.get(hastaId).lng] : null} marcas={marcas} />
              <Marker position={AQUI} icon={iconoAqui} interactive={false} keyboard={false} />
              <Camara edificio={edificio} interiorPiso={interiorPiso} coordenadas={ruta.coordenadas} pad={pad} />
              <Controles pad={pad} />
              <Pildora escala={escritorio} clase={escritorio ? (angosto && edificio ? 'plano-pildora--sobre-ficha' : '') : 'plano-pildora--movil'} />
            </MapContainer>
          </LimiteError>

          {escritorio && panelCapas}
          {escritorio && edificio && <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} grafo={datos} {...fichaProps} />}
        </div>

        {!escritorio && (
          <>
            <div ref={refFlotante} className="plano-flotante">
              {buscar}
              {hayConsulta && (sinResultados || items)}
              {!hayConsulta && panelCapas}
            </div>
            <div ref={refHojaTotal} className="plano-hoja">
              <span className="plano-hoja__asa" aria-hidden="true" />
              {panelRuta}
              {edificio ? (
                <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} onOtro={otroEdificio} grafo={datos} movil {...fichaProps} />
              ) : (
                <div className="plano-hoja__vacia">
                  <p><strong>Toca un edificio o búscalo</strong></p>
                  <div className="plano-rapidos">
                    {RAPIDOS.map((r) => {
                      const e = EDIFICIOS.find((x) => x.clave === r.clave);
                      return e && (
                        <button key={r.clave} type="button" ref={(el) => { if (el) refs.current.set(e.clave, el); }} className="plano-rapido" aria-label={r.nombre} onClick={() => abrirEdificio(e, { desdeBusqueda: true })}>
                          <Insignia letra={e.letra} />
                          {r.extra && <span aria-hidden="true">{r.extra}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="sr-only" aria-live="polite">{edificio ? edificio.titulo : ''}</div>
    </div>
  );
}

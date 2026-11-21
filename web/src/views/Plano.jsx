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
import { useBarreras } from '../hooks/useBarreras.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { calcularRuta } from '../../../motor/ruta.js';
import { bloqueosDe } from '../../../motor/barreras.js';
import perfilesRespaldo from '../../../data/perfiles.json';
import { armarRuta } from '../lib/pasos.js';
import { buscarSalas, marcasPiso, salaDeFeature, salasDe, salasSinPoligono, textoLugar } from '../lib/rutaPlano.js';
import CapaRuta from './plano/CapaRuta.jsx';
import TuRuta from './plano/TuRuta.jsx';
import '../components/MapaRuta.css';
import 'leaflet/dist/leaflet.css';
import './Plano.css';

// /plano (Lote 10): explorar el campus. La lista es la vía accesible; el mapa es el apoyo visual.
const NOTA_DATOS = '«Estás aquí» es simulado. Edificios H, O, J, I, N, F2 y P2 no están en OpenStreetMap y no se dibujan.';
const AQUI = [-33.033897, -71.59523]; // Acceso Av. España (simulado, declarado en la vista)
const LIMITE_MOVIL = 6;
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
const iconoMarcador = (nombre) => L.divIcon({ className: '', html: `<span class="plano-sala-marcador">${String(nombre).replace(/[&<>"]/g, '')}</span>`, iconSize: [90, 22], iconAnchor: [45, 11] });
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

function Etiquetas({ edificio, piso, calles, datos, onSala }) {
  const mapa = useMap();
  const [zoom, setZoom] = useState(mapa.getZoom());
  useMapEvents({ zoomend: () => setZoom(mapa.getZoom()) });
  const salas = useMemo(() => {
    if (!edificio) return [];
    return interior(edificio.letra, piso).filter((f) => f.geometry.type === 'Polygon').map((f) => ({
      id: f.properties.osm, bano: f.properties.servicio === 'toilets', ref: f.properties.ref || f.properties.nombre || '', centro: centroDe(f.geometry),
    }));
  }, [edificio, piso]);
  // Salas agregadas a mano sin polígono en el plano: un marcador en su lat/lng, solo en el piso elegido.
  const sinPoligono = useMemo(() => (edificio ? salasSinPoligono(datos, edificio.letra, piso, interior(edificio.letra, piso)) : []), [datos, edificio, piso]);
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

const notaDe = (e, piso, hayInterior) => {
  if (hayInterior && e.letra !== 'C') return `Plano interior del piso ${piso} dibujado por el equipo a partir de un boceto en terreno: la escala es aproximada. Las salas marcadas con el ícono de baño son baños.`;
  if (hayInterior) return `Plano interior del piso ${piso} según OpenStreetMap. Las salas marcadas con el ícono de baño son baños.`;
  if (e.letra === 'C' || e.pisos) return 'Plano interior pendiente: se agrega con el levantamiento en terreno.';
  return 'Número de pisos y plano interior por confirmar en terreno.';
};

function Ficha({ edificio, piso, onPiso, onCerrar, grafo, movil, sala, salas, onSala, onDesde, onHasta }) {
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
        <div role="group" aria-labelledby="plano-piso-leyenda">
        <RadioGrupo
          clase="plano-pisos" claseOpcion="plano-piso"
          opciones={pisos.map((p) => ({ id: p }))} valor={piso} onCambiar={onPiso}
          etiquetaDe={(o) => `Piso ${o.id < 0 ? `menos ${-o.id}` : o.id}`} hijoDe={(o) => (o.id < 0 ? `−${-o.id}` : o.id)}
          describedBy="plano-piso-leyenda"
        />
        </div>
      </div>
      <p className="plano-ficha__nota">{notaDe(edificio, piso, hayInterior)}</p>
      {salas.length > 0 && (
        <div className="plano-salas">
          <h3 id="plano-salas-titulo">Salas del piso {piso < 0 ? `−${-piso}` : piso}</h3>
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
          <button type="button" className="boton boton--primario boton--chico" onClick={() => onHasta(destino)}>Ir aquí</button>
        </div>
      )}
      <ul className="plano-acceso">
        {['Entrada sin escalones', 'Ascensor', 'Baño accesible'].map((t) => (
          <li key={t}><span>{t}</span><span className="plano-acceso__valor"><Question weight="bold" aria-hidden="true" /> Por levantar</span></li>
        ))}
      </ul>
      <Link className="boton boton--secundario boton--ancho" to={destino ? `/?hasta=${destino}` : '/'}>Cómo llegar sin barreras</Link>
    </section>
  );
}

export default function Plano() {
  const escritorio = useEscritorio();
  const { grafo } = useLugares();
  const datos = grafo ?? campusRespaldo;
  const [q, setQ] = useState('');
  const [verTodos, setVerTodos] = useState(false);
  const [clave, setClave] = useState(null);
  const [piso, setPiso] = useState(1);
  const [capas, setCapas] = useState({ senderos: true, escaleras: true, servicios: true, calles: true });
  const refs = useRef(new Map());
  const buscador = useRef(null);
  const abrio = useRef(null);
  const enfocarTrasExpandir = useRef(null);

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
  const pasoActivo = paso ?? ruta.pasos.length - 1;

  // En móvil las calles empiezan apagadas.
  useEffect(() => { if (!escritorio) setCapas((c) => ({ ...c, calles: false })); }, [escritorio]);

  const edificio = EDIFICIOS.find((e) => e.clave === clave) ?? null;
  const visibles = useMemo(() => filtrarEdificios(EDIFICIOS, q), [q]);
  const hayConsulta = q.trim().length > 0;
  const hayMas = !escritorio && hayConsulta && !verTodos && visibles.length > LIMITE_MOVIL;
  const lista = hayMas ? visibles.slice(0, LIMITE_MOVIL) : visibles;
  const interiorPiso = useMemo(() => (edificio ? interior(edificio.letra, piso) : []), [edificio, piso]);
  const salasPiso = useMemo(() => (edificio ? salasDe(datos, edificio.letra, piso) : []), [datos, edificio, piso]);
  const sala = salaId ? nodos.get(salaId) ?? null : null;
  const salaOsm = useMemo(
    () => (sala && edificio ? interiorPiso.find((f) => salaDeFeature(datos, edificio.letra, piso, f)?.id === sala.id)?.properties.osm ?? null : null),
    [datos, sala, edificio, piso, interiorPiso],
  );

  // Elegir una sala (desde la lista, el buscador o el plano): abre su edificio y su piso.
  const elegirSala = useCallback((id) => {
    const n = nodos.get(id);
    if (!n) return;
    const e = EDIFICIOS.find((x) => x.clave === n.edificio);
    if (e) { abrio.current = null; setClave(e.clave); setPiso(n.piso); }
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
  const limpiar = () => { setHastaId(null); setAnuncio('Ruta borrada'); };
  const enlaceMapa = `/mapa?${new URLSearchParams({ desde: desdeId ?? '', hasta: hastaId ?? '', perfil: perfilId })}`;
  const panelRuta = (
    <TuRuta
      desde={desdeId ? nodos.get(desdeId) : null} hasta={hastaId ? nodos.get(hastaId) : null}
      resultado={resultado} pasos={ruta.pasos} paso={pasoActivo} onPaso={irAPaso}
      onIntercambiar={intercambiar} onLimpiar={limpiar} anuncio={anuncio} enlaceMapa={enlaceMapa}
    />
  );
  const fichaProps = { sala, salas: salasPiso, onSala: elegirSala, onDesde: fijarDesde, onHasta: fijarHasta };

  const alBuscar = (ev) => {
    setQ(ev.target.value);
    setVerTodos(false);
  };
  const alVerTodos = () => {
    enfocarTrasExpandir.current = visibles[LIMITE_MOVIL]?.clave ?? null;
    setVerTodos(true);
  };
  useEffect(() => {
    if (!verTodos || !enfocarTrasExpandir.current) return;
    const siguiente = enfocarTrasExpandir.current;
    enfocarTrasExpandir.current = null;
    refs.current.get(siguiente)?.focus();
  }, [verTodos, lista]);

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

  const textoConteo = visibles.length === 0
    ? `Sin resultados para «${q}»`
    : hayMas
      ? `${lista.length} de ${visibles.length} edificios`
      : `${visibles.length} ${visibles.length === 1 ? 'edificio' : 'edificios'}`;

  const buscar = (
    <div className="plano-buscar">
      <label htmlFor="plano-q" className={escritorio ? 'campo__etiqueta' : 'sr-only'}>Buscar edificio o servicio</label>
      <div className="plano-buscar__campo">
        <MagnifyingGlass weight="bold" aria-hidden="true" />
        <input id="plano-q" ref={buscador} type="search" className="campo__input" value={q} onChange={alBuscar} placeholder="Ej.: Biblioteca, C, Casino" autoComplete="off" />
      </div>
      <p className="plano-buscar__conteo" aria-live="polite">{textoConteo}</p>
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

  const salasBuscadas = useMemo(() => buscarSalas(datos, q), [datos, q]);
  const items = (
    <>
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
    {salasBuscadas.length > 0 && (
      <>
        <h3 className="plano-lista__titulo" id="plano-lista-salas">Salas</h3>
        <ul className="plano-lista" aria-labelledby="plano-lista-salas">
          {salasBuscadas.map((n) => (
            <li key={n.id}>
              <button type="button" className="plano-item" aria-pressed={n.id === salaId} onClick={() => elegirSala(n.id)}>
                <span className="plano-insignia" aria-hidden="true">{n.edificio}</span>
                <span className="plano-item__texto"><strong>{n.nombre}</strong><span>{`Edificio ${n.edificio}, piso ${n.piso}`}{n.departamento ? `. ${n.departamento}` : ''}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </>
    )}
    </>
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
        {escritorio && <aside className="plano__lista" aria-label="Edificios del campus">{panelRuta}{buscar}{items}</aside>}

        <div className="plano__mapa" role="region" aria-label={etiquetaMapa}>
          <LimiteError>
            <MapContainer bounds={LIMITES} maxBounds={LIMITES_VISTA} minZoom={ZOOM.min} maxZoom={ZOOM.max + 0.5} zoomSnap={0.25} zoomDelta={0.5} zoomControl={false} keyboard className="mapa-plano plano__leaflet">
              <CapaPlano seleccion={clave} onElegir={alElegirEnMapa} capas={{ senderos: capas.senderos, escaleras: capas.escaleras, servicios: capas.servicios, calles: true }} interior={interiorPiso} onElegirSala={alElegirSala} salaSeleccion={salaOsm} />
              <Etiquetas edificio={edificio} piso={piso} calles={capas.calles} datos={datos} onSala={elegirSala} />
              <CapaRuta coordenadas={ruta.coordenadas} desde={desdeId && nodos.get(desdeId) ? [nodos.get(desdeId).lat, nodos.get(desdeId).lng] : null} hasta={hastaId && nodos.get(hastaId) ? [nodos.get(hastaId).lat, nodos.get(hastaId).lng] : null} marcas={marcas} />
              <Marker position={AQUI} icon={iconoAqui} interactive={false} keyboard={false} />
              <Encuadre edificio={edificio} padAbajo={padAbajo} />
              <Controles padAbajo={padAbajo} />
              <Escala />
            </MapContainer>
          </LimiteError>

          {escritorio && capasUI}
          {escritorio && edificio && <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} grafo={datos} {...fichaProps} />}
          {escritorio && <p className="plano__nota-datos">{NOTA_DATOS}</p>}
        </div>

        {!escritorio && (
          <>
            <div className="plano-flotante">
              {buscar}
              {hayConsulta && lista.length > 0 && (
                <>
                  {items}
                  {hayMas && (
                    <button type="button" className="boton boton--secundario boton--chico boton--ancho plano-flotante__mas" onClick={alVerTodos}>
                      Ver todos
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="plano-hoja">
              <span className="plano-hoja__asa" aria-hidden="true" />
              {(hastaId || resultado) && panelRuta}
              {edificio ? (
                <Ficha edificio={edificio} piso={piso} onPiso={setPiso} onCerrar={cerrar} grafo={datos} movil {...fichaProps} />
              ) : (
                <div className="plano-hoja__vacia">
                  <p><strong>Toca un edificio o búscalo</strong></p>
                  <div className="plano-rapidos">
                    {['C', 'A', 'U', 'M'].map((l) => { const e = EDIFICIOS.find((x) => x.clave === l); return e && <button key={l} type="button" className="boton boton--secundario boton--chico" onClick={() => elegir(e, true)}>{e.titulo}</button>; })}
                  </div>
                </div>
              )}
              <p className="plano-hoja__nota-datos">{NOTA_DATOS}</p>
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

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Drop, Elevator, Stairs } from '@phosphor-icons/react';
import perfiles from '../../../data/perfiles.json';
import { compararPerfiles } from '../../../motor/ruta.js';
import { armarFilas, fraseResumen } from '../lib/comparar.js';
import { lineaRuta } from '../lib/lineaRuta.js';
import { geojson } from '../plano/plano.js';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import Simbolo from '../components/Simbolo.jsx';
import { useLugares } from '../hooks/useLugares.js';
import textos from './acerca.json';
import './Acerca.css';

// /acerca (Lote 6): qué resuelve Parejo, para quién y con qué supuestos. Spec: docs/diseno/vistas/lote-6-acerca/.
// Las 4 tarjetas de perfil se calculan con el motor (mismo trayecto y mismas funciones que /comparar, sin barreras),
// así que sus números coinciden con el Lote 3 y no hay cifras inventadas.

const ICONOS_CAMBIA = [Elevator, Drop, Stairs];
const PERFIL = Object.fromEntries(PERFILES.map((p) => [p.id, p]));
// Trazo de cada perfil: el mismo de MapaComparar.jsx (estilosDeRuta del Lote 3).
const TRAZO = {
  estandar: { ancho: 4 },
  silla_ruedas: { ancho: 7, borde: 13 },
  movilidad_reducida: { ancho: 6, guiones: '14 9', punta: 'butt', borde: 11 },
  baja_vision: { ancho: 7, guiones: '0.1 13' },
};
const W = 300;
const H = 176;
const MARGEN = 28;

const metros = (n) => Math.round(n).toLocaleString('es-CL');
const minutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Proyección equirectangular de [lat, lng] a un lienzo W×H común a las 4 tarjetas (mismo encuadre para comparar).
function crearProyeccion(puntos) {
  const lats = puntos.map((p) => p[0]);
  const lngs = puntos.map((p) => p[1]);
  const [s, n, o, e] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const k = Math.cos(((s + n) / 2) * Math.PI / 180);
  const ancho = Math.max((e - o) * k, 1e-6);
  const alto = Math.max(n - s, 1e-6);
  // Se reservan franjas para el ícono (izquierda) y el chip (arriba), que van encima del mapa.
  const IZQ = 64;
  const ARRIBA = 26;
  const escala = Math.min((W - IZQ - 2 * MARGEN) / ancho, (H - ARRIBA - 2 * MARGEN) / alto);
  const dx = IZQ + (W - IZQ - ancho * escala) / 2;
  const dy = ARRIBA + (H - ARRIBA - alto * escala) / 2;
  return ([lat, lng]) => [dx + (lng - o) * k * escala, dy + (n - lat) * escala];
}

// Edificios del campus como trazos SVG (el svg recorta lo que cae fuera del lienzo).
function edificiosSvg(proyectar) {
  return geojson.features
    .filter((f) => f.properties.tipo === 'edificio' && f.properties.campus)
    .flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates))
    .map((poli) => poli.map((anillo) => `M${anillo.map(([lng, lat]) => proyectar([lat, lng]).map((v) => v.toFixed(1)).join(' ')).join('L')}Z`).join(''));
}

function useRutasReferencia() {
  const { grafo } = useLugares();
  return useMemo(() => {
    if (!grafo) return null;
    const { desde, hasta } = textos.perfiles;
    const filas = armarFilas(grafo, compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos: [] }));
    const destino = grafo.nodos.find((n) => n.id === hasta);
    const origen = grafo.nodos.find((n) => n.id === desde);
    const lineas = Object.fromEntries(filas.filter((f) => f.ok && f.nodos.length > 1)
      .map((f) => [f.id, lineaRuta(grafo, f.tramos, f.nodos[0], (n) => [n.lat, n.lng])]));
    const todos = Object.values(lineas).flat();
    const proyectar = todos.length ? crearProyeccion(todos) : null;
    return {
      filas, origen, destino, lineas, proyectar,
      edificios: proyectar ? edificiosSvg(proyectar) : [],
      resumen: fraseResumen(filas, destino?.nombre),
    };
  }, [grafo]);
}

function MiniRuta({ fila, nombre, datos }) {
  const puntos = datos.lineas[fila.id];
  if (!puntos?.length || !datos.proyectar) return null;
  const xy = puntos.map(datos.proyectar);
  const linea = xy.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const [ox, oy] = xy[0];
  const [fx, fy] = xy.at(-1);
  const t = TRAZO[fila.id];
  const etiqueta = `Ruta ${nombre.toLowerCase()}: ${fila.pasaPor ? `pasa por ${fila.pasaPor}` : 'va directo'}`;
  return (
    <svg className="mini-ruta" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={etiqueta}>
      {datos.edificios.map((d, i) => <path key={i} d={d} className="mini-ruta__edificio" />)}
      {t.borde && <polyline points={linea} className="mini-ruta__borde" strokeWidth={t.borde} />}
      <polyline points={linea} className={`mini-ruta__linea mini-ruta__linea--${fila.id}`}
        strokeWidth={t.ancho} strokeDasharray={t.guiones} strokeLinecap={t.punta ?? 'round'} />
      <circle cx={ox} cy={oy} r="7" className="mini-ruta__origen" />
      <circle cx={fx} cy={fy} r="9" className="mini-ruta__destino" />
      <circle cx={fx} cy={fy} r="3.5" className="mini-ruta__destino-punto" />
    </svg>
  );
}

function TarjetaPerfil({ fila, datos }) {
  const { nombre, Icono } = PERFIL[fila.id];
  return (
    <li className={`acerca-perfil acerca-perfil--${fila.id}`}>
      <div className="acerca-perfil__mapa">
        {fila.ok ? <MiniRuta fila={fila} nombre={nombre} datos={datos} /> : <p className="acerca-perfil__sin-ruta">Sin ruta hoy</p>}
        <span className="acerca-perfil__icono" aria-hidden="true"><Icono weight="bold" /></span>
        {fila.ok && fila.difMetros && <span className="acerca-perfil__chip">{fila.difMetros}</span>}
      </div>
      <div className="acerca-perfil__cuerpo">
        <h3>{nombre}</h3>
        {fila.ok && <p className="acerca-perfil__pasa">{fila.pasaPor ? `Pasa por ${fila.pasaPor}.` : 'Va directo.'}</p>}
        {fila.ok && (
          <dl className="acerca-perfil__cifras">
            <div><dt>metros</dt><dd>{metros(fila.metros)}</dd></div>
            <div><dt>minutos</dt><dd>{minutos(fila.minutos)}</dd></div>
            <div>
              <dt>escalones</dt>
              <dd className={fila.escalones > 0 ? 'acerca-perfil__escalones--con' : 'acerca-perfil__escalones--sin'}>{fila.escalones}</dd>
            </div>
          </dl>
        )}
      </div>
    </li>
  );
}

function Ilustracion({ etiqueta }) {
  return (
    <svg className="acerca-portada__ilustracion" viewBox="0 0 460 300" role="img"
      aria-label="La cabina de un ascensor de cerro sube por su riel sobre una escalera; adentro, el piso queda parejo">
      <g className="ilus__escalera">
        <rect x="90" y="214" width="320" height="56" />
        <rect x="170" y="158" width="240" height="56" />
        <rect x="250" y="102" width="160" height="56" />
        <rect x="330" y="46" width="80" height="56" />
      </g>
      <path className="ilus__contorno" d="M20 214H90V158H170V102H250V46H330" />
      <path className="ilus__riel" d="M30 290L430 40" />
      <path className="ilus__cabina" d="M240 30H330V102L240 159Z" />
      <rect className="ilus__ventana" x="254" y="44" width="28" height="28" rx="5" />
      <rect className="ilus__ventana" x="290" y="44" width="28" height="28" rx="5" />
      <path className="ilus__piso" d="M240 92H330" />
      <path className="ilus__guia" d="M330 92L356 116" />
      <rect className="ilus__etiqueta" x="340" y="104" width="112" height="38" rx="19" />
      <text className="ilus__texto" x="396" y="129" textAnchor="middle">{etiqueta}</text>
    </svg>
  );
}

export default function Acerca() {
  const { hero, loQueCambia, perfiles: tp, comoFunciona, letraChica, ods, pie } = textos;
  const datos = useRutasReferencia();

  return (
    <div className="acerca">
      <section className="acerca-portada" aria-labelledby="acerca-titulo">
        <div className="acerca-ancho acerca-portada__interior">
          <div className="acerca-portada__texto">
            <h1 id="acerca-titulo">{hero.titulo}</h1>
            <p className="acerca-portada__bajada">{hero.bajada}</p>
            <div className="acerca-portada__botones">
              {hero.botones.map((b) => (
                <Link key={b.destino} to={b.destino} className={`acerca-boton acerca-boton--${b.tipo}`}>{b.texto}</Link>
              ))}
            </div>
          </div>
          <Ilustracion etiqueta={hero.etiquetaIlustracion} />
        </div>
      </section>

      <section className="acerca-ancho acerca-seccion" aria-labelledby="acerca-cambia">
        <h2 id="acerca-cambia">{loQueCambia.titulo}</h2>
        <ul className="acerca-cambia">
          {loQueCambia.tarjetas.map((nombre, i) => {
            const Icono = ICONOS_CAMBIA[i];
            return (
              <li key={nombre} className={`acerca-cambia__tarjeta acerca-cambia__tarjeta--${i + 1}`}>
                <span className="acerca-cambia__circulo" aria-hidden="true"><Icono weight="bold" /></span>
                <span>{nombre}</span>
              </li>
            );
          })}
        </ul>
        <div className="acerca-foto-nota">
          <div className="acerca-foto" role="img" aria-label="Espacio para una foto propia del levantamiento, pendiente">
            <Camera weight="bold" aria-hidden="true" />
            <span>{loQueCambia.foto}</span>
          </div>
          <div className="acerca-nota">
            <p>
              {loQueCambia.nota} {loQueCambia.cifra} <span className="acerca-pendiente">cifra con fuente pendiente</span>.
            </p>
            <p className="acerca-nota__fuente">Fuente: {loQueCambia.fuente}.</p>
          </div>
        </div>
      </section>

      <section className="acerca-banda acerca-banda--perfiles" aria-labelledby="acerca-perfiles">
        <div className="acerca-ancho acerca-seccion">
          <div className="acerca-perfiles__cabeza">
            <div className="acerca-perfiles__titulo">
              <h2 id="acerca-perfiles">{tp.titulo}</h2>
              <p className="acerca-trayecto">
                <span className="acerca-trayecto__desde"><span aria-hidden="true" />{datos?.origen?.nombre ?? 'Entrada principal'}</span>
                <span className="sr-only">hasta</span>
                <svg viewBox="0 0 32 12" width="32" height="12" aria-hidden="true"><path d="M2 6H28M22 1l6 5-6 5" /></svg>
                <span className="acerca-trayecto__hasta"><span aria-hidden="true" />{datos?.destino?.nombre ?? 'Sala A-201'}</span>
              </p>
            </div>
            {datos?.resumen && <p className="acerca-perfiles__resumen">{datos.resumen}</p>}
          </div>
          {datos
            ? <ul className="acerca-perfiles">{datos.filas.map((f) => <TarjetaPerfil key={f.id} fila={f} datos={datos} />)}</ul>
            : <p role="status">Calculando las rutas…</p>}
        </div>
      </section>

      <section className="acerca-ancho acerca-seccion" aria-labelledby="acerca-como">
        <h2 id="acerca-como">{comoFunciona.titulo}</h2>
        <ol className="acerca-pasos">
          {comoFunciona.pasos.map((p, i) => (
            <li key={p.titulo} className={`acerca-paso acerca-paso--${i + 1}`}>
              <span className="acerca-paso__cabeza">
                <span className="acerca-paso__num" aria-hidden="true">{i + 1}</span>
                <span className="acerca-paso__titulo">{p.titulo}</span>
              </span>
              <span>{p.texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="acerca-banda acerca-banda--letra" aria-labelledby="acerca-letra">
        <div className="acerca-ancho acerca-seccion acerca-letra">
          <h2 id="acerca-letra">{letraChica.titulo}</h2>
          <ul>
            {letraChica.lista.map((l) => <li key={l.tema}><strong>{l.tema}</strong> <span>{l.texto}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="acerca-ancho acerca-ods" aria-labelledby="acerca-ods">
        <h2 id="acerca-ods">{ods.titulo}</h2>
        <ul>
          {ods.lista.map((o) => (
            <li key={o.num}>
              <span className={`acerca-ods__cuadro acerca-ods__cuadro--${o.num}`} aria-hidden="true">{o.num}</span>
              <span className="acerca-ods__texto">
                <strong><span className="sr-only">ODS {o.num}: </span>{o.nombre}</strong>
                <span>{o.frase}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="acerca-pie">
        <div className="acerca-ancho acerca-pie__interior">
          <div className="acerca-pie__marca">
            <span className="acerca-pie__lockup">
              <Simbolo size={36} aria-hidden="true" />
              <span translate="no">parejo</span>
            </span>
            <p>{pie.texto}</p>
          </div>
          <div className="acerca-pie__usm">
            <div className="acerca-pie__logo" role="img" aria-label="Espacio reservado para el logotipo oficial de la USM, pendiente">
              Logotipo USM
            </div>
            <p>{pie.firmaUSM}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

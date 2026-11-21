import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowsLeftRight, Buildings, CaretLeft, CircleHalf, DotsThreeOutline, Flag, Info, MapPin, MapTrifold, PersonArmsSpread, SpeakerHigh, X } from '@phosphor-icons/react';
import Simbolo from './Simbolo.jsx';
import PanelAccesibilidad, { TAMANOS } from './PanelAccesibilidad.jsx';
import { usePreferencias } from '../hooks/usePreferencias.js';
import './Shell.css';

const NAV = [
  { a: '/', texto: 'Ruta', Icono: MapTrifold },
  { a: '/plano', texto: 'Plano', Icono: MapPin },
  { a: '/comparar', texto: 'Comparar', Icono: ArrowsLeftRight },
  { a: '/reportar', texto: 'Reportar', Icono: Flag },
  { a: '/campus', texto: 'Mejorar el campus', Icono: Buildings },
  { a: '/acerca', texto: 'Acerca', Icono: Info },
];
// En móvil caben 4: los dos últimos van dentro de "Más".
const EN_MAS = ['/plano', '/campus', '/acerca'];

// "Ruta" cubre el flujo completo: elegir destino (/) y verlo en el mapa (/mapa).
const esActual = (a, ruta) => (a === '/' ? ruta === '/' || ruta.startsWith('/mapa') : ruta.startsWith(a));

export default function Shell() {
  const { pathname, search } = useLocation();
  // /mapa (Lote 2): el mapa va de la cabecera a la nav, el salto lleva a los pasos y el pie legal va en la hoja.
  const enMapa = pathname.startsWith('/mapa');
  // /punto/:id (Lote 5): se abre desde un QR; sin navegación ni pie, solo cabecera, Accesibilidad y el salto.
  const enPunto = pathname.startsWith('/punto/');
  const p = usePreferencias();
  const [panel, setPanel] = useState(false);
  const [mas, setMas] = useState(false);
  useEffect(() => { setMas(false); }, [pathname]);

  const enlace = ({ a, texto, Icono }) => (
    <Link key={a} to={a} aria-current={esActual(a, pathname) ? 'page' : undefined}>
      <Icono weight="bold" aria-hidden="true" />
      <span>{texto}</span>
    </Link>
  );
  const enMas = EN_MAS.some((a) => esActual(a, pathname));

  return (
    <div className={enMapa ? 'app app--mapa' : 'app'}>
      {enMapa
        ? <a className="saltar" href="#ruta">Saltar a la ruta</a>
        : <a className="saltar" href="#contenido">Saltar al contenido</a>}

      <header className="cabecera">
        {enMapa && (
          <Link to={`/${search}`} className="cabecera__volver" aria-label="Volver a elegir destino">
            <CaretLeft weight="bold" aria-hidden="true" />
          </Link>
        )}
        <Link to="/" className="wordmark" aria-label="Parejo, inicio">
          <Simbolo size={32} className="wordmark__movil" aria-hidden="true" />
          <Simbolo size={40} className="wordmark__escritorio" aria-hidden="true" />
          <span aria-hidden="true" translate="no">parejo</span>
        </Link>

        {!enPunto && <nav className="nav-escritorio" aria-label="Principal">{NAV.map(enlace)}</nav>}

        <div className="barra-accesibilidad" role="group" aria-label="Accesibilidad">
          <div className="segmentado" role="group" aria-label="Tamaño del texto">
            {TAMANOS.map((t) => (
              <button key={t.id} type="button" aria-pressed={p.texto === t.id} aria-label={t.nombre} onClick={() => p.setTexto(t.id)}>
                {t.texto}
              </button>
            ))}
          </div>
          <button type="button" className="boton-pastilla" aria-pressed={p.altoContraste} onClick={() => p.setAltoContraste(!p.altoContraste)}>
            <CircleHalf weight="bold" aria-hidden="true" /> Alto contraste
          </button>
          <button type="button" className="boton-pastilla" aria-pressed={p.voz} onClick={() => p.setVoz(!p.voz)}>
            <SpeakerHigh weight="bold" aria-hidden="true" /> Voz
          </button>
        </div>

        <button type="button" className="boton-accesibilidad" aria-label="Accesibilidad" aria-haspopup="dialog" aria-expanded={panel} onClick={() => setPanel(true)}>
          <PersonArmsSpread weight="bold" aria-hidden="true" />
          <span className="boton-accesibilidad__texto" aria-hidden="true">Accesibilidad</span>
        </button>
      </header>

      <main id="contenido" tabIndex={-1}>
        <Outlet />
        {!enMapa && !enPunto && <p className="pie-legal">Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo.</p>}
      </main>

      {!enPunto && (
        <nav className="nav-movil" aria-label="Principal">
          {NAV.filter((n) => !EN_MAS.includes(n.a)).map(enlace)}
          <button type="button" className="nav-movil__mas" aria-haspopup="dialog" aria-expanded={mas}
            aria-current={enMas ? 'page' : undefined} onClick={() => setMas(true)}>
            <DotsThreeOutline weight="bold" aria-hidden="true" />
            <span>Más</span>
          </button>
        </nav>
      )}
      <PanelMas abierto={mas} onCerrar={() => setMas(false)} enlaces={NAV.filter((n) => EN_MAS.includes(n.a)).map(enlace)} />

      <PanelAccesibilidad abierto={panel} onCerrar={() => setPanel(false)} />
    </div>
  );
}

// Hoja móvil con los ítems que no caben en la barra. <dialog> nativo, igual que PanelAccesibilidad.
function PanelMas({ abierto, onCerrar, enlaces }) {
  const d = useRef(null);
  useEffect(() => {
    if (abierto && !d.current.open) d.current.showModal();
    if (!abierto && d.current.open) d.current.close();
  }, [abierto]);
  return (
    <dialog ref={d} className="hoja panel-mas" aria-labelledby="titulo-mas" onClose={onCerrar}>
      <div className="panel-accesibilidad__cabeza">
        <h2 id="titulo-mas">Más</h2>
        <button type="button" className="panel-accesibilidad__cerrar" aria-label="Cerrar" onClick={onCerrar}>
          <X weight="bold" aria-hidden="true" />
        </button>
      </div>
      <nav className="panel-mas__enlaces" aria-label="Más secciones">{enlaces}</nav>
    </dialog>
  );
}

import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowsLeftRight, CircleHalf, Flag, Info, MapTrifold, PersonArmsSpread, SpeakerHigh } from '@phosphor-icons/react';
import Simbolo from './Simbolo.jsx';
import PanelAccesibilidad, { TAMANOS } from './PanelAccesibilidad.jsx';
import { usePreferencias } from '../hooks/usePreferencias.js';
import './Shell.css';

const NAV = [
  { a: '/', texto: 'Ruta', Icono: MapTrifold },
  { a: '/comparar', texto: 'Comparar', Icono: ArrowsLeftRight },
  { a: '/reportar', texto: 'Reportar', Icono: Flag },
  { a: '/acerca', texto: 'Acerca', Icono: Info },
];

// "Ruta" cubre el flujo completo: elegir destino (/) y verlo en el mapa (/mapa).
const esActual = (a, ruta) => (a === '/' ? ruta === '/' || ruta.startsWith('/mapa') : ruta.startsWith(a));

export default function Shell() {
  const { pathname } = useLocation();
  const p = usePreferencias();
  const [panel, setPanel] = useState(false);

  const enlaces = NAV.map(({ a, texto, Icono }) => (
    <Link key={a} to={a} aria-current={esActual(a, pathname) ? 'page' : undefined}>
      <Icono weight="bold" aria-hidden="true" />
      <span>{texto}</span>
    </Link>
  ));

  return (
    <div className="app">
      <a className="saltar" href="#contenido">Saltar al contenido</a>

      <header className="cabecera">
        <Link to="/" className="wordmark" aria-label="Parejo, inicio">
          <Simbolo size={32} className="wordmark__movil" aria-hidden="true" />
          <Simbolo size={40} className="wordmark__escritorio" aria-hidden="true" />
          <span aria-hidden="true" translate="no">parejo</span>
        </Link>

        <nav className="nav-escritorio" aria-label="Principal">{enlaces}</nav>

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

        <button type="button" className="boton-accesibilidad" aria-haspopup="dialog" aria-expanded={panel} onClick={() => setPanel(true)}>
          <PersonArmsSpread weight="bold" aria-hidden="true" /> Accesibilidad
        </button>
      </header>

      <main id="contenido" tabIndex={-1}>
        <Outlet />
        <p className="pie-legal">Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo.</p>
      </main>

      <nav className="nav-movil" aria-label="Principal">{enlaces}</nav>

      <PanelAccesibilidad abierto={panel} onCerrar={() => setPanel(false)} />
    </div>
  );
}

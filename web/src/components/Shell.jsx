import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowsLeftRight, Buildings, CaretLeft, CircleHalf, DotsThreeOutline, Flag, Hammer, Info, MapPin, MapTrifold, Monitor, PersonArmsSpread, SpeakerHigh, SquaresFour, X } from '@phosphor-icons/react';
import Simbolo from './Simbolo.jsx';
import PanelAccesibilidad, { TAMANOS } from './PanelAccesibilidad.jsx';
import { usePreferencias } from '../hooks/usePreferencias.js';
import './Shell.css';

const NAV = [
  { a: '/', texto: 'Ruta', Icono: MapTrifold },
  { a: '/plano', texto: 'Plano', Icono: MapPin, IconoMas: SquaresFour },
  { a: '/comparar', texto: 'Comparar', Icono: ArrowsLeftRight },
  { a: '/reportar', texto: 'Reportar', Icono: Flag },
  { a: '/campus', texto: 'Mejorar el campus', Icono: Buildings, IconoMas: Hammer },
  { a: '/acerca', texto: 'Acerca', Icono: Info },
];
// En móvil caben 4: Plano, Mejorar el campus y Acerca van dentro de "Más" (íconos del Lote 8 en la hoja).
const EN_MAS = ['/plano', '/campus', '/acerca'];

// "Ruta" cubre el flujo completo: elegir destino (/) y verlo en el mapa (/mapa).
const esActual = (a, ruta) => (a === '/' ? ruta === '/' || ruta.startsWith('/mapa') : ruta.startsWith(a));

// Título de la pestaña por ruta (WCAG 2.4.2). Lo que no está aquí es la 404.
const TITULOS = { '/': 'Elige tu ruta', '/mapa': 'Tu ruta', '/plano': 'Plano', '/comparar': 'Comparar perfiles', '/reportar': 'Reportar una barrera', '/campus': 'Mejorar el campus', '/acerca': 'Acerca', '/punto': 'Punto QR' };
const tituloDe = (ruta) => TITULOS[ruta] ?? TITULOS[`/${ruta.split('/')[1]}`] ?? 'Página no encontrada';

export default function Shell() {
  const { pathname, search } = useLocation();
  // /mapa (Lote 2): el mapa va de la cabecera a la nav, el salto lleva a los pasos y el pie legal va en la hoja.
  const enMapa = pathname.startsWith('/mapa');
  // /punto/:id (Lote 5): se abre desde un QR; sin navegación ni pie, solo cabecera, Accesibilidad y el salto.
  const enPunto = pathname.startsWith('/punto/');
  // /plano (Lote 10): saltos propios (lista en escritorio, búsqueda en móvil) y sin pie legal que agregue scroll.
  const enPlano = pathname.startsWith('/plano');
  const p = usePreferencias();
  const navigate = useNavigate();
  // Salir del modo presentación: se apaga y se quita ?presentacion=1 para que no vuelva al recargar.
  const salirPresentacion = () => {
    p.setPresentacion(false);
    const q = new URLSearchParams(search);
    if (q.has('presentacion')) {
      q.delete('presentacion');
      const resto = q.toString();
      navigate({ pathname, search: resto ? `?${resto}` : '' }, { replace: true });
    }
  };
  const [panel, setPanel] = useState(false);
  const [mas, setMas] = useState(false);
  useEffect(() => { setMas(false); }, [pathname]);
  useEffect(() => { document.title = `${tituloDe(pathname)} | parejo`; }, [pathname]);

  const enlace = ({ a, texto, Icono }) => (
    <Link key={a} to={a} aria-current={esActual(a, pathname) ? 'page' : undefined}>
      <Icono weight="bold" aria-hidden="true" />
      <span>{texto}</span>
    </Link>
  );
  const actualEnMas = NAV.find((n) => EN_MAS.includes(n.a) && esActual(n.a, pathname));
  const enMas = Boolean(actualEnMas);
  const botonMas = useRef(null);

  return (
    <div className={enMapa ? 'app app--mapa' : 'app'}>
      {enPlano && (
        <>
          <a className="saltar saltar--escritorio" href="#plano-lista">Saltar a la lista de edificios</a>
          <a className="saltar saltar--movil" href="#plano-busqueda">Saltar a la búsqueda de edificios</a>
        </>
      )}
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

        {p.presentacion ? (
          <div className="presentacion">
            <span className="presentacion__etiqueta">
              <Monitor weight="bold" aria-hidden="true" /> Modo presentación
            </span>
            <button type="button" className="presentacion__salir" onClick={salirPresentacion}>Salir</button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </header>

      <main id="contenido" tabIndex={-1}>
        <Outlet />
        {!enMapa && !enPunto && !enPlano && <p className="pie-legal">Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo.</p>}
      </main>

      {!enPunto && (
        <nav className="nav-movil" aria-label="Principal">
          {NAV.filter((n) => !EN_MAS.includes(n.a)).map(enlace)}
          <button ref={botonMas} type="button" className="nav-movil__mas" aria-haspopup="dialog" aria-expanded={mas}
            aria-current={enMas ? 'page' : undefined} aria-label={enMas ? `Más, estás en ${actualEnMas.texto}` : undefined}
            onClick={() => setMas(true)}>
            <DotsThreeOutline weight="bold" aria-hidden="true" />
            <span>Más</span>
          </button>
        </nav>
      )}
      <PanelMas abierto={mas} onCerrar={() => setMas(false)} botonMas={botonMas}
        destinos={NAV.filter((n) => EN_MAS.includes(n.a))} esActual={(a) => esActual(a, pathname)} />

      <PanelAccesibilidad abierto={panel} onCerrar={() => setPanel(false)} />
    </div>
  );
}

// Hoja móvil con los ítems que no caben en la barra. <dialog> nativo con showModal(), igual que PanelAccesibilidad:
// el navegador atrapa el foco y Escape la cierra. Al cerrarla con Escape o Cerrar el foco vuelve al botón Más;
// al elegir un destino no, para que el foco quede en la vista nueva.
function PanelMas({ abierto, onCerrar, botonMas, destinos, esActual }) {
  const d = useRef(null);
  const navegando = useRef(false);
  useEffect(() => {
    if (abierto && !d.current.open) { navegando.current = false; d.current.showModal(); }
    if (!abierto && d.current.open) d.current.close();
  }, [abierto]);
  const alCerrar = () => {
    onCerrar();
    if (!navegando.current) botonMas.current?.focus();
  };
  return (
    <dialog ref={d} className="hoja panel-mas" aria-labelledby="titulo-mas" onClose={alCerrar}>
      <div className="panel-accesibilidad__cabeza">
        <h2 id="titulo-mas">Más</h2>
        <button type="button" className="panel-accesibilidad__cerrar" aria-label="Cerrar" onClick={() => d.current.close()}>
          <X weight="bold" aria-hidden="true" />
        </button>
      </div>
      <nav className="panel-mas__enlaces" aria-label="Más secciones">
        {destinos.map(({ a, texto, Icono, IconoMas }) => {
          const Ic = IconoMas ?? Icono;
          const aqui = esActual(a);
          return (
            <Link key={a} to={a} aria-current={aqui ? 'page' : undefined} onClick={() => { if (aqui) d.current.close(); else navegando.current = true; }}>
              <Ic weight="bold" aria-hidden="true" />
              <span>{texto}</span>
              {aqui && <span className="panel-mas__aqui">Estás aquí</span>}
            </Link>
          );
        })}
      </nav>
    </dialog>
  );
}

import { Flag } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Advertencias, ListaPasos } from './PasosRuta.jsx';
import ResumenRuta from './ResumenRuta.jsx';
import './HojaRuta.css';

// Hoja inferior de /mapa (Lote 2, A6). En móvil tiene tres alturas (resumen, media, completa); en escritorio es el panel
// lateral y muestra todo. El contenido está siempre en el DOM y el CSS oculta lo que sobra en cada altura, así que
// lo oculto tampoco recibe foco ni se lee.
export const ALTURAS = ['resumen', 'media', 'completa'];
export const PIE = 'Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo.';

export default function HojaRuta({ ruta, origen, destino, perfil, altura, onAltura }) {
  const siguiente = ALTURAS[(ALTURAS.indexOf(altura) + 1) % ALTURAS.length];
  return (
    <section id="ruta" className={`hoja-ruta hoja-ruta--${altura}`} aria-labelledby="ruta-titulo" tabIndex={-1}>
      <button type="button" className="hoja-ruta__barra" aria-label={`Hoja en vista ${altura}. Cambiar a ${siguiente}`} onClick={() => onAltura(siguiente)}>
        <span aria-hidden="true" />
      </button>
      <div className="hoja-ruta__cuerpo">
        <ResumenRuta ruta={ruta} origen={origen} destino={destino} perfil={perfil} />
        <button type="button" className="boton boton--secundario hoja-ruta__ver-pasos" onClick={() => onAltura('completa')}>Ver pasos</button>
        <div className="hoja-ruta__pasos">
          <ListaPasos pasos={ruta.pasos} />
        </div>
        <button type="button" className="boton boton--enlace hoja-ruta__mas" onClick={() => onAltura('completa')}>
          Ver los {ruta.pasos.length} pasos y advertencias
        </button>
        <div className="hoja-ruta__extra">
          <Advertencias advertencias={ruta.advertencias} />
          <Link className="boton boton--enlace" to={`/reportar?${new URLSearchParams({ ruta: ruta.id, desde: origen.id, hasta: destino.id })}`}>
            <Flag weight="bold" aria-hidden="true" /> Reportar un problema en esta ruta
          </Link>
          <p className="pie-legal">{PIE}</p>
        </div>
      </div>
    </section>
  );
}

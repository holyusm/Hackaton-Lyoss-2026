import { Flag, MapTrifold } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Advertencias, ListaPasos } from './PasosRuta.jsx';
import { PIE } from './HojaRuta.jsx';
import ResumenRuta from './ResumenRuta.jsx';
import './HojaRuta.css';

// "Ver como lista" (Lote 2, A7): la ruta entera en texto, sin mapa, con la misma información que la hoja.
export default function VistaLista({ ruta, origen, destino, perfil, onVerMapa }) {
  return (
    <section id="ruta" className="mapa-lista" aria-labelledby="ruta-titulo" tabIndex={-1}>
      <div className="mapa-lista__acciones">
        <button type="button" className="boton-pastilla" aria-pressed="true" onClick={onVerMapa}>
          <MapTrifold weight="bold" aria-hidden="true" /> Ver mapa
        </button>
      </div>
      <ResumenRuta ruta={ruta} origen={origen} destino={destino} perfil={perfil} nivel="h1" compactas={false} />
      <ListaPasos pasos={ruta.pasos} />
      <Advertencias advertencias={ruta.advertencias} />
      <Link className="boton boton--enlace" to={`/reportar?ruta=${encodeURIComponent(ruta.id)}`}>
        <Flag weight="bold" aria-hidden="true" /> Reportar un problema en esta ruta
      </Link>
      <p className="pie-legal">{PIE}</p>
    </section>
  );
}

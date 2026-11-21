import { Link } from 'react-router-dom';
import { NavigationArrow } from '@phosphor-icons/react';
import { iconoLugar } from './iconoLugar.js';

// Tarjeta de un destino del punto QR (Lote 5, A5). Sin nodo en el grafo no hay "Llévame".
export default function TarjetaDestino({ destino: d, resaltado }) {
  const Icono = iconoLugar(d.nodo ?? { tipo: 'punto' });
  return (
    <li className={resaltado ? 'tarjeta-destino punto__leyendo' : 'tarjeta-destino'}>
      <span className="tarjeta-destino__icono" aria-hidden="true"><Icono weight="bold" /></span>
      <div className="tarjeta-destino__texto">
        <h3>{d.nombre}</h3>
        <p>{d.indicacion}</p>
        {d.enlace && (
          <Link to={d.enlace} className="boton boton--secundario boton--ancho tarjeta-destino__ir" aria-label={`Llévame a ${d.nombre}`}>
            <NavigationArrow weight="bold" aria-hidden="true" /> Llévame
          </Link>
        )}
      </div>
    </li>
  );
}

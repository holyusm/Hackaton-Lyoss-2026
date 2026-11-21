import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import './Estados.css';

// Error del servidor en la misma vista (Lote 7): nunca modal ni toast, nunca un código.
// primario: Reintentar es el botón principal (Ruta, Punto) o secundario dentro de la tarjeta (Inicio, Comparar).
// grande: sin tarjeta, título h1 y botones a lo ancho (Punto QR).
// enfocar: mueve el foco al mensaje (solo Reportar).
export default function ErrorEnLinea({
  titulo, texto, onReintentar, textoReintentar = 'Reintentar', primario = false,
  accionSecundaria, enfocar = false, grande = false, className = '',
}) {
  const ref = useRef(null);
  useEffect(() => { if (enfocar) ref.current?.focus(); }, [enfocar]);
  const Titulo = grande ? 'h1' : 'p';
  return (
    <div ref={ref} className={`error-linea ${grande ? 'error-linea--grande' : ''} ${className}`} role="alert" tabIndex={enfocar ? -1 : undefined}>
      <span className="error-linea__icono"><Warning weight="bold" aria-hidden="true" /></span>
      <div className="error-linea__cuerpo">
        <Titulo className="error-linea__titulo">{titulo}</Titulo>
        {texto && <p className="error-linea__texto">{texto}</p>}
        {(onReintentar || accionSecundaria) && (
          <div className="error-linea__acciones">
            {onReintentar && (
              <button type="button" onClick={onReintentar}
                className={`boton ${primario ? 'boton--primario' : 'boton--secundario boton--chico'} ${grande ? 'boton--ancho' : ''}`}>
                <ArrowClockwise weight="bold" aria-hidden="true" /> {textoReintentar}
              </button>
            )}
            {accionSecundaria && (
              <Link to={accionSecundaria.to} className={grande ? 'boton boton--secundario boton--ancho' : 'boton--enlace'}>
                {accionSecundaria.texto}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

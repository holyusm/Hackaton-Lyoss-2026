import { Link } from 'react-router-dom';
import { ArrowsDownUp, NavigationArrow, Warning, X } from '@phosphor-icons/react';
import { textoLugar } from '../../lib/rutaPlano.js';

// Barra "Tu ruta" de /plano: Desde y Hasta, intercambiar y limpiar, el resultado y la lista de pasos (la vía accesible).
export default function TuRuta({ desde, hasta, resultado, pasos, paso, onPaso, onIntercambiar, onLimpiar, anuncio, enlaceMapa }) {
  return (
    <section className="plano-turuta" aria-labelledby="plano-turuta-titulo">
      <div className="plano-turuta__cabeza">
        <h2 id="plano-turuta-titulo">Tu ruta</h2>
        <button type="button" className="plano-turuta__boton" aria-label="Intercambiar desde y hasta" onClick={onIntercambiar} disabled={!desde || !hasta}>
          <ArrowsDownUp weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="plano-turuta__boton" aria-label="Limpiar la ruta" onClick={onLimpiar} disabled={!hasta}>
          <X weight="bold" aria-hidden="true" />
        </button>
      </div>
      <dl className="plano-turuta__puntos">
        <div><dt>Desde</dt><dd>{desde ? textoLugar(desde) : 'Elige un punto de partida'}</dd></div>
        <div><dt>Hasta</dt><dd>{hasta ? textoLugar(hasta) : 'Elige una sala o un edificio y toca «Ir aquí»'}</dd></div>
      </dl>
      <p className="sr-only" aria-live="polite">{anuncio}</p>

      {resultado && !resultado.ok && (
        <p className="plano-turuta__sinruta" role="alert">
          <Warning weight="bold" aria-hidden="true" />
          <span><strong>No hay una ruta accesible para este perfil.</strong> {resultado.motivo}</span>
        </p>
      )}
      {resultado?.ok && (
        <>
          <p className="plano-turuta__resumen">
            <strong>{Math.round(resultado.metros)} m</strong>, {String(resultado.minutos).replace('.', ',')} min,{' '}
            {resultado.escalones === 0 ? 'sin escalones' : `${resultado.escalones} ${resultado.escalones === 1 ? 'escalón' : 'escalones'}`}
          </p>
          <ol className="plano-turuta__pasos">
            {pasos.map((p, i) => (
              <li key={`${i}-${p.nodo}`}>
                <button type="button" className="plano-turuta__paso" aria-current={i === paso ? 'step' : undefined} onClick={() => onPaso(i)}>
                  <span className="plano-turuta__num" aria-hidden="true">{i + 1}</span>
                  <span>{p.instruccion}</span>
                </button>
              </li>
            ))}
          </ol>
          <Link className="boton boton--secundario boton--chico plano-turuta__enlace" to={enlaceMapa}>
            <NavigationArrow weight="bold" aria-hidden="true" /> Abrir paso a paso
          </Link>
        </>
      )}
    </section>
  );
}

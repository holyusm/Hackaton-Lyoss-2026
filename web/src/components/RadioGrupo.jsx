import { useRef } from 'react';

// Radiogroup con roving tabindex (APG): solo la opción elegida (o la primera) entra al Tab;
// las flechas mueven foco y selección, Espacio elige. Lo usan OpcionesTipo y SegmentadoDuracion.
export default function RadioGrupo({ opciones, valor, onCambiar, etiquetaDe, clase, claseOpcion, hijoDe, invalido, describedBy, idPrimera }) {
  const refs = useRef([]);
  const idx = Math.max(0, opciones.findIndex((o) => o.id === valor));

  const mover = (e, i) => {
    const n = opciones.length;
    let sig = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') sig = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') sig = (i - 1 + n) % n;
    else if (e.key === 'Home') sig = 0;
    else if (e.key === 'End') sig = n - 1;
    if (sig === null) return;
    e.preventDefault();
    onCambiar(opciones[sig].id);
    refs.current[sig]?.focus();
  };

  return (
    <div className={clase} role="radiogroup" aria-invalid={invalido || undefined} aria-describedby={describedBy}>
      {opciones.map((o, i) => (
        <button
          key={o.id}
          ref={(el) => { refs.current[i] = el; }}
          id={i === 0 ? idPrimera : undefined}
          type="button" role="radio"
          aria-checked={o.id === valor}
          aria-label={etiquetaDe?.(o)}
          tabIndex={i === idx ? 0 : -1}
          className={[claseOpcion, o.clase].filter(Boolean).join(' ')}
          onClick={() => onCambiar(o.id)}
          onKeyDown={(e) => mover(e, i)}
        >
          {hijoDe(o, o.id === valor)}
        </button>
      ))}
    </div>
  );
}

import { useRef } from 'react';

// Radiogroup con roving tabindex (APG), igual que components/RadioGrupo.jsx pero con nombre por aria-labelledby
// (la etiqueta "Medir para" / "Ordenar por" es visible). Ninguna opción elegida (perfil Estándar): entra la primera al Tab.
export default function GrupoRadio({ opciones, valor, onCambiar, etiquetaId, clase, claseOpcion, hijoDe }) {
  const refs = useRef([]);
  const idx = Math.max(0, opciones.findIndex((o) => o.id === valor));

  const mover = (e, i) => {
    const n = opciones.length;
    const sig = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (sig === undefined) return;
    e.preventDefault();
    const j = ((sig % n) + n) % n;
    onCambiar(opciones[j].id);
    refs.current[j]?.focus();
  };

  return (
    <div className={clase} role="radiogroup" aria-labelledby={etiquetaId}>
      {opciones.map((o, i) => (
        <button
          key={o.id} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
          aria-checked={o.id === valor} tabIndex={i === idx ? 0 : -1} className={claseOpcion}
          onClick={() => onCambiar(o.id)} onKeyDown={(e) => mover(e, i)}
        >
          {hijoDe(o, o.id === valor)}
        </button>
      ))}
    </div>
  );
}

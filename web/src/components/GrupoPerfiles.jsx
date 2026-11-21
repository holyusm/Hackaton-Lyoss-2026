import { useRef } from 'react';
import { Check, Eye, Person, PersonSimpleWalk, Wheelchair } from '@phosphor-icons/react';
import './GrupoPerfiles.css';

// Perfiles del contrato (data/perfiles.json) con los textos del diseño (lote-1-inicio/PLAN.md, B1).
export const PERFILES = [
  { id: 'estandar', nombre: 'Estándar', corta: 'El camino más corto', Icono: Person, textoBoton: '' },
  { id: 'silla_ruedas', nombre: 'Silla de ruedas', corta: 'Sin escalones, evita adoquín', Icono: Wheelchair, textoBoton: 'en silla de ruedas' },
  { id: 'movilidad_reducida', nombre: 'Movilidad reducida', corta: 'Lesión o bastón: pocos escalones', Icono: PersonSimpleWalk, textoBoton: 'con pocos escalones' },
  { id: 'baja_vision', nombre: 'Baja visión', corta: 'Guía podotáctil y piso liso', Icono: Eye, textoBoton: 'para baja visión' },
];

// Grupo de radio con roving tabindex: solo la tarjeta elegida (o la primera) entra en el orden de Tab;
// flechas, Inicio y Fin mueven el foco y eligen.
export default function GrupoPerfiles({ valor, onCambiar }) {
  const perfiles = PERFILES;
  const botones = useRef([]);
  const indiceFoco = Math.max(0, perfiles.findIndex((p) => p.id === valor));

  const elegir = (i) => {
    const n = perfiles.length;
    const destino = ((i % n) + n) % n;
    onCambiar(perfiles[destino].id);
    botones.current[destino]?.focus();
  };

  const alTeclear = (e, i) => {
    const mover = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: perfiles.length - 1 }[e.key];
    if (mover === undefined) return;
    e.preventDefault();
    elegir(mover);
  };

  return (
    <fieldset className="inicio__perfiles">
      <legend id="leyenda-perfil" className="inicio__leyenda">¿Cómo te mueves?</legend>
      <div className="rejilla-perfiles" role="radiogroup" aria-labelledby="leyenda-perfil">
        {perfiles.map((p, i) => {
          const elegido = p.id === valor;
          const sugerido = !valor && p.id === 'estandar';
          return (
            <button
              key={p.id}
              ref={(el) => { botones.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={elegido}
              tabIndex={i === indiceFoco ? 0 : -1}
              className="tarjeta-perfil"
              onClick={() => onCambiar(p.id)}
              onKeyDown={(e) => alTeclear(e, i)}
            >
              <span className="perfil__icono"><p.Icono weight="bold" aria-hidden="true" /></span>
              <span className="perfil__texto">
                <span className="perfil__nombre">{p.nombre}</span>
                <span className="perfil__desc">{p.corta}</span>
              </span>
              <span className="perfil__marca">
                <Check weight="bold" className="perfil__check" aria-hidden="true" />
                {sugerido && <span className="perfil__sugerido">Sugerido</span>}
              </span>
            </button>
          );
        })}
      </div>
      {!valor && (
        <p className="campo__ayuda">Si no eliges, te mostramos la ruta Estándar. Puedes cambiarlo después.</p>
      )}
    </fieldset>
  );
}

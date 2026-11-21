import { useId, useRef } from 'react';
import { ArrowCounterClockwise, Pause, Play, SpeakerHigh } from '@phosphor-icons/react';
import { VELOCIDADES } from '../hooks/useVoz.js';
import './BarraVoz.css';

// Controles de voz del punto QR (Lote 5, A4). v: lo que devuelve useVoz(); frases: frasesPunto().
export default function BarraVoz({ v, frases }) {
  const motivo = useId();
  const segmentos = useRef([]);
  const leyendo = v.estado !== 'reposo';
  const indice = VELOCIDADES.findIndex((x) => x.id === v.velocidad);

  const alTeclear = (e, i) => {
    const n = VELOCIDADES.length;
    const a = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (a === undefined) return;
    e.preventDefault();
    const j = Math.min(n - 1, Math.max(0, a));
    v.setVelocidad(VELOCIDADES[j].id);
    segmentos.current[j]?.focus();
  };

  return (
    <div className="barra-voz">
      {/* Siempre en el DOM, aunque esté vacío: así el lector anuncia cuando empieza a leer. */}
      <p className={leyendo ? 'barra-voz__estado' : 'barra-voz__estado barra-voz__estado--vacio'} role="status" aria-live="polite">
        {leyendo && <><SpeakerHigh weight="bold" aria-hidden="true" />{v.estado === 'pausa' ? 'En pausa' : `Leyendo ${frases[v.indice]?.nombre ?? ''}`}</>}
      </p>

      {!leyendo ? (
        <>
          <button type="button" className="boton boton--primario boton--ancho barra-voz__escuchar"
            disabled={!v.disponible} aria-describedby={v.disponible ? undefined : motivo} onClick={() => v.leer(frases, 0)}>
            <SpeakerHigh weight="bold" aria-hidden="true" /> Escuchar indicaciones
          </button>
          {!v.disponible && <p id={motivo} className="motivo">Tu navegador no tiene voz en español. Puedes leer las indicaciones aquí abajo.</p>}
        </>
      ) : (
        <div className="barra-voz__acciones">
          <button type="button" className="boton boton--secundario" aria-pressed={v.estado === 'pausa'}
            onClick={v.estado === 'pausa' ? v.seguir : v.pausar}>
            {v.estado === 'pausa'
              ? <><Play weight="bold" aria-hidden="true" /> Seguir</>
              : <><Pause weight="bold" aria-hidden="true" /> Pausar</>}
          </button>
          <button type="button" className="boton boton--secundario" onClick={v.repetir}>
            <ArrowCounterClockwise weight="bold" aria-hidden="true" /> Repetir
          </button>
        </div>
      )}

      <fieldset className="barra-voz__velocidad">
        <legend id={`${motivo}-vel`}>Velocidad de la voz</legend>
        <div className="barra-voz__segmentos" role="radiogroup" aria-labelledby={`${motivo}-vel`}>
          {VELOCIDADES.map((x, i) => (
            <button key={x.id} ref={(el) => { segmentos.current[i] = el; }} type="button" role="radio"
              aria-checked={v.velocidad === x.id} tabIndex={i === indice ? 0 : -1}
              onClick={() => v.setVelocidad(x.id)} onKeyDown={(e) => alTeclear(e, i)}>
              {x.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

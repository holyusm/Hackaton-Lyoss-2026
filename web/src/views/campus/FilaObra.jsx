import { CurrencyCircleDollar } from '@phosphor-icons/react';
import { PERFILES } from '../../components/GrupoPerfiles.jsx';
import { minutos, NOMBRE_PERFIL, TEXTO_COSTO, trayectos } from '../../lib/campus.js';
import IconoObra, { TIPO_TEXTO } from './IconoObra.jsx';
import InterruptorSimular from './InterruptorSimular.jsx';

// Fila de obra: posición | contenido | interruptor. Sin tarjeta, separada por una línea fina.
// El impacto va en texto (nunca barras). Simulada: fondo Cobalto tinte, interruptor invertido.
export default function FilaObra({ obra, posicion, perfil, activa, onAlternar, seleccionada, onElegir, motivo, motivoId }) {
  const ayuda = obra.trayectos_sin_barrera > 0;
  const beneficiados = (obra.perfiles_beneficiados ?? []).map((id) => PERFILES.find((p) => p.id === id)).filter(Boolean);
  const ahorro = obra.minutos_ahorrados_prom;
  return (
    <li
      className={['campus__obra', activa && 'campus__obra--simulada', seleccionada && 'campus__obra--seleccionada', !ayuda && 'campus__obra--sin-efecto'].filter(Boolean).join(' ')}
      onMouseEnter={onElegir ? () => onElegir(obra.id) : undefined}
      onFocus={onElegir ? () => onElegir(obra.id) : undefined}
    >
      <span className="campus__posicion cifras" aria-hidden="true">{posicion}</span>
      <div className="campus__obra-texto">
        <h3>{obra.titulo}</h3>
        <p className="campus__obra-tipo">
          <span className="campus__pictograma"><IconoObra tipo={obra.tipo} /></span>
          {TIPO_TEXTO[obra.tipo] ?? obra.tipo}, {obra.lugar}
        </p>
        {ayuda ? (
          <p className="campus__impacto">
            <strong>{trayectos(obra.trayectos_sin_barrera)} sin barrera</strong>
            {ahorro === 0 && ', sin cambio en minutos'}
            {ahorro > 0 && `, ${minutos(ahorro)} min menos en promedio`}
          </p>
        ) : (
          <p className="campus__obra-meta">No quita barreras para {NOMBRE_PERFIL[perfil] ?? perfil}.</p>
        )}
        {beneficiados.length > 0 && (
          <ul className="campus__beneficiados" aria-label="Perfiles beneficiados">
            {beneficiados.map((p) => <li key={p.id}><p.Icono weight="bold" aria-hidden="true" /> {p.nombre}</li>)}
          </ul>
        )}
        <p className="campus__costo"><CurrencyCircleDollar weight="bold" aria-hidden="true" /> {TEXTO_COSTO[obra.costo_relativo] ?? obra.costo_relativo}</p>
      </div>
      <InterruptorSimular titulo={obra.titulo} activa={activa} onAlternar={() => onAlternar(obra.id)} motivo={motivo} motivoId={motivoId} />
    </li>
  );
}

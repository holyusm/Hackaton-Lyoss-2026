import { useId } from 'react';
import { Check, DotsThree, Drop, Elevator, Prohibit, TrafficCone, Warning } from '@phosphor-icons/react';
import { TIPOS_REPORTE } from '../lib/reportes.js';
import RadioGrupo from './RadioGrupo.jsx';

export const ICONOS_REPORTE = { Elevator, TrafficCone, Prohibit, Drop, DotsThree };

// "¿Qué pasa?": 5 tarjetas de 92 px. `error` es el texto del error (o null).
export default function OpcionesTipo({ valor, onCambiar, error }) {
  const id = useId();
  return (
    <fieldset className="campo reporte-tipo">
      <legend className="campo__etiqueta" id={`${id}-leyenda`}>¿Qué pasa?</legend>
      <RadioGrupo
        clase="reporte-tipo__rejilla"
        claseOpcion="reporte-tipo__opcion"
        opciones={TIPOS_REPORTE}
        valor={valor}
        onCambiar={onCambiar}
        invalido={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
        idPrimera="campo-tipo"
        hijoDe={(t, activa) => {
          const Icono = ICONOS_REPORTE[t.icono];
          return (
            <>
              <span className="reporte-tipo__icono"><Icono weight="bold" aria-hidden="true" /></span>
              <span className="reporte-tipo__nombre">{t.nombre}</span>
              {activa && <Check weight="bold" className="reporte-tipo__check" aria-hidden="true" />}
            </>
          );
        }}
      />
      {error && <p className="campo__error" id={`${id}-error`}><Warning weight="bold" aria-hidden="true" />{error}</p>}
    </fieldset>
  );
}

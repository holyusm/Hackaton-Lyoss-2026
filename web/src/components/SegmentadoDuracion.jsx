import { useId } from 'react';
import { DURACIONES } from '../lib/reportes.js';
import RadioGrupo from './RadioGrupo.jsx';

// "¿Cuánto crees que dura?": 4 segmentos de 56 px en una píldora.
export default function SegmentadoDuracion({ valor, onCambiar }) {
  const id = useId();
  return (
    <fieldset className="campo reporte-duracion">
      <legend className="campo__etiqueta">¿Cuánto crees que dura?</legend>
      <RadioGrupo
        clase="reporte-duracion__grupo"
        claseOpcion="reporte-duracion__opcion"
        opciones={DURACIONES}
        valor={valor}
        onCambiar={onCambiar}
        describedBy={`${id}-ayuda`}
        hijoDe={(d) => d.etiqueta}
      />
      <p className="campo__ayuda" id={`${id}-ayuda`}>Después de ese tiempo el aviso se borra solo. Máximo 4 horas.</p>
    </fieldset>
  );
}

import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { usePreferencias } from '../hooks/usePreferencias.js';

export const TAMANOS = [
  { id: 'normal', texto: 'A', nombre: 'Texto normal' },
  { id: 'grande', texto: 'A+', nombre: 'Texto grande' },
  { id: 'muy-grande', texto: 'A++', nombre: 'Texto muy grande' },
];

// Hoja inferior móvil. <dialog> con showModal() ya atrapa el foco, deja el resto inerte,
// se cierra con Escape y devuelve el foco al botón que lo abrió.
export default function PanelAccesibilidad({ abierto, onCerrar }) {
  const dialogo = useRef(null);
  const p = usePreferencias();

  useEffect(() => {
    const d = dialogo.current;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className="hoja panel-accesibilidad"
      aria-labelledby="titulo-a11y"
      onClose={onCerrar}
      onClick={(e) => {
        const d = dialogo.current;
        // Solo clics de puntero sobre el fondo: el padding de .hoja también tiene como destino el <dialog>,
        // y Enter/Espacio llegan como click con detail 0.
        if (e.target !== d || e.detail === 0) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onCerrar();
      }}
    >
      <div className="panel-accesibilidad__cabeza">
        <h2 id="titulo-a11y">Accesibilidad</h2>
        <button type="button" className="panel-accesibilidad__cerrar" aria-label="Cerrar panel de accesibilidad" onClick={onCerrar}>
          <X weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div role="group" aria-labelledby="lbl-tamano" className="panel-accesibilidad__grupo">
        <span id="lbl-tamano" className="campo__etiqueta">Tamaño del texto</span>
        <div className="panel-accesibilidad__tamanos">
          {TAMANOS.map((t) => (
            <button
              key={t.id} type="button" className="boton-pastilla panel-accesibilidad__tamano"
              aria-pressed={p.texto === t.id} aria-label={t.nombre} onClick={() => p.setTexto(t.id)}
            >
              {t.texto}
            </button>
          ))}
        </div>
      </div>

      <Interruptor
        nombre="Alto contraste" activo={p.altoContraste} onCambiar={p.setAltoContraste}
        estado={p.altoContraste ? 'Activado' : 'Desactivado'}
      />
      <Interruptor
        nombre="Leer en voz alta" activo={p.voz} onCambiar={p.setVoz}
        estado={p.voz ? 'Activado: leemos cada paso al tocarlo' : 'Desactivado'}
      />

      <p className="panel-accesibilidad__nota">Recordamos tu preferencia en este dispositivo.</p>
      <button type="button" className="boton boton--primario boton--ancho" onClick={onCerrar}>Listo</button>
    </dialog>
  );
}

function Interruptor({ nombre, estado, activo, onCambiar }) {
  return (
    <button type="button" role="switch" aria-checked={activo} className="interruptor" onClick={() => onCambiar(!activo)}>
      <span className="interruptor__texto">
        <strong>{nombre}</strong>
        <span className="interruptor__estado">{estado}</span>
      </span>
      <span className="interruptor__riel" aria-hidden="true"><span className="interruptor__perilla" /></span>
    </button>
  );
}

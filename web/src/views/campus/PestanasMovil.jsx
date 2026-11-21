import { useRef } from 'react';
import { Hammer, MapTrifold } from '@phosphor-icons/react';

// Pestañas del móvil (Lote 8): "Obras" y "Mapa". Patrón de pestañas WAI-ARIA con activación automática: flechas izquierda/derecha,
// Inicio y Fin cambian de pestaña y mueven el foco. Solo el panel activo está montado (el plano de Leaflet necesita estar visible).
export const PESTANAS = [
  { id: 'obras', nombre: 'Obras', Icono: Hammer },
  { id: 'mapa', nombre: 'Mapa', Icono: MapTrifold },
];

export default function PestanasMovil({ valor, onCambiar }) {
  const botones = useRef([]);
  const alTeclear = (e, i) => {
    const n = PESTANAS.length;
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const j = ((destino % n) + n) % n;
    onCambiar(PESTANAS[j].id);
    botones.current[j]?.focus();
  };
  return (
    <div className="campus__pestanas" role="tablist" aria-label="Secciones de Mejorar el campus">
      {PESTANAS.map((p, i) => {
        const activa = valor === p.id;
        return (
          <button
            key={p.id} ref={(el) => { botones.current[i] = el; }} type="button" role="tab" id={`campus-tab-${p.id}`}
            className="campus__pestana" aria-selected={activa} aria-controls={activa ? `campus-panel-${p.id}` : undefined}
            tabIndex={activa ? 0 : -1} onClick={() => onCambiar(p.id)} onKeyDown={(e) => alTeclear(e, i)}
          >
            <p.Icono weight="bold" aria-hidden="true" /> {p.nombre}
          </button>
        );
      })}
    </div>
  );
}

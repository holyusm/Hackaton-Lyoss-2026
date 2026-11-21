import { Check } from '@phosphor-icons/react';

// Interruptor "Simular" de cada obra (README del Lote 8). Texto visible corto, nombre accesible completo.
// Deshabilitado: aria-disabled (sigue en el orden de Tab) y el motivo enlazado con aria-describedby.
export default function InterruptorSimular({ titulo, activa, onAlternar, motivo, motivoId }) {
  const deshabilitado = Boolean(motivo);
  return (
    <button
      type="button" role="switch" aria-checked={activa}
      aria-label={`Simular ${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`}
      aria-disabled={deshabilitado || undefined} aria-describedby={deshabilitado ? motivoId : undefined}
      className="interruptor campus__simular"
      onClick={() => { if (!deshabilitado) onAlternar(); }}
    >
      <span className="interruptor__riel" aria-hidden="true">
        <span className="interruptor__perilla">{activa && <Check weight="bold" />}</span>
      </span>
      <span className="campus__simular-texto" aria-hidden="true">{activa ? 'Simulada' : 'Simular'}</span>
    </button>
  );
}

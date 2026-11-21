import { useEffect, useId, useRef } from 'react';

// Confirmación de "Ya está resuelto". <dialog> nativo con showModal(): atrapa el foco y Escape lo cierra.
// Al cerrar, el foco vuelve a `devolverFoco` (el botón de la fila) o, si la fila ya no existe, a `respaldoFoco`.
export default function DialogoResolver({ barrera, titulo, lugar, enviando, error, onConfirmar, onCerrar, devolverFoco, respaldoFoco }) {
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => { if (d?.open) d.close(); };
  }, []);

  const cerrar = () => {
    onCerrar();
    queueMicrotask(() => {
      const destino = devolverFoco?.isConnected ? devolverFoco : respaldoFoco?.();
      destino?.focus();
    });
  };

  return (
    <dialog
      ref={ref} className="dialogo-resolver" aria-labelledby={`${id}-titulo`} aria-describedby={`${id}-texto`}
      onCancel={(e) => { e.preventDefault(); cerrar(); }}
      onClose={() => {}}
    >
      <h2 id={`${id}-titulo`}>¿Ya se resolvió esta barrera?</h2>
      <p className="dialogo-resolver__nombre"><strong>{titulo}, {lugar.charAt(0).toLowerCase()}{lugar.slice(1)}</strong></p>
      <p id={`${id}-texto`}>Si la marcas como resuelta, el aviso deja de aparecer y las rutas vuelven a pasar por ahí.</p>
      {error && <p className="campo__error" role="alert">{error}</p>}
      <div className="dialogo-resolver__acciones">
        <button
          type="button" className="boton boton--peligro" aria-disabled={enviando}
          onClick={async () => { if (enviando) return; const ok = await onConfirmar(barrera); if (ok) { onCerrar(); queueMicrotask(() => (devolverFoco?.isConnected ? devolverFoco : respaldoFoco?.())?.focus()); } }}
        >
          Marcar como resuelto
        </button>
        <button type="button" className="boton boton--secundario" onClick={cerrar}>Cancelar</button>
      </div>
    </dialog>
  );
}

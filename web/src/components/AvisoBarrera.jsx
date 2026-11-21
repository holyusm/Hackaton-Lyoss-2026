import { Prohibit, Warning } from '@phosphor-icons/react';

// Aviso de barrera (componentes.md, AvisoBarrera).
// variante: 'compacto' (resumen del inicio) | 'alerta' | 'bloqueo'.
// role: 'status' si aparece por un cambio en vivo, 'alert' si bloquea la tarea.
export default function AvisoBarrera({ variante = 'alerta', titulo, children, acciones, role = 'status', className = '' }) {
  const bloqueo = variante === 'bloqueo';
  const Glifo = bloqueo ? Prohibit : Warning;
  const clase = ['aviso', variante !== 'alerta' && `aviso--${variante}`, className].filter(Boolean).join(' ');

  if (variante === 'compacto') {
    return (
      <div className={clase} role={role}>
        <Glifo weight="bold" className="aviso__glifo" aria-hidden="true" />
        <div className="aviso__cuerpo">
          <span>{titulo && <strong>{titulo}</strong>} {children}</span>
          {acciones}
        </div>
      </div>
    );
  }

  return (
    <div className={clase} role={role}>
      <span className="aviso__icono"><Glifo weight="bold" aria-hidden="true" /></span>
      <div className="aviso__cuerpo">
        {titulo && <p className="aviso__titulo">{titulo}</p>}
        {children && <p>{children}</p>}
        {acciones && <div className="aviso__acciones">{acciones}</div>}
      </div>
    </div>
  );
}

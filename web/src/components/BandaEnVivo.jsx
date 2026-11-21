import { useEffect, useState } from 'react';
import { Broadcast, WifiSlash } from '@phosphor-icons/react';
import { conHora, horaCorta as hora } from '../lib/estados.js';

// Banda "En vivo" del mapa (Lote 2, B6): se actualiza cada segundo desde `actualizado` (la última consulta buena de barreras).
// Si la consulta falla, pasa a "Sin conexión" con la hora de la última ruta conocida. Solo ese estado es role="status":
// el contador cambia cada segundo y un lector de pantalla lo anunciaría sin parar.
// Lote 7: `sinConexion` también la pasa a "Sin conexión"; `texto` es el de cada vista ("Ruta de las {hora}.")
// y `hora` la de los datos que se muestran (por defecto, `actualizado`).
export default function BandaEnVivo({ actualizado, error, sinConexion = false, texto, hora: horaDatos, className = '' }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const offline = error || sinConexion;
  if (!actualizado && !offline) return null;

  if (offline) {
    const cuando = horaDatos ?? actualizado;
    const detalle = texto
      ? conHora(texto, cuando)
      : cuando ? `Mostrando las barreras conocidas a las ${hora(cuando)}.` : 'No pudimos verificar las barreras.';
    return (
      <div className={`banda-vivo banda-vivo--sin-conexion ${className}`} role="status" aria-live="polite">
        <WifiSlash weight="bold" aria-hidden="true" />
        <span><strong>Sin conexión.</strong> {detalle}</span>
      </div>
    );
  }
  const s = Math.max(0, Math.round((ahora - actualizado.getTime()) / 1000));
  return (
    <div className={`banda-vivo ${className}`}>
      <Broadcast weight="bold" aria-hidden="true" />
      <span><strong>En vivo.</strong> Hace {s} s</span>
    </div>
  );
}

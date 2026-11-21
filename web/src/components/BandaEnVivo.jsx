import { useEffect, useState } from 'react';
import { Broadcast, WifiSlash } from '@phosphor-icons/react';

const hora = (d) => d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

// Banda "En vivo" del mapa (Lote 2, B6): se actualiza cada segundo desde `actualizado` (la última consulta buena de barreras).
// Si la consulta falla, pasa a "Sin conexión" con la hora de la última ruta conocida. Solo ese estado es role="status":
// el contador cambia cada segundo y un lector de pantalla lo anunciaría sin parar.
export default function BandaEnVivo({ actualizado, error }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!actualizado && !error) return null;

  if (error) {
    return (
      <div className="banda-vivo banda-vivo--sin-conexion" role="status">
        <WifiSlash weight="bold" aria-hidden="true" />
        <span><strong>Sin conexión.</strong> {actualizado ? `Mostrando la última ruta conocida, de las ${hora(actualizado)}.` : 'No pudimos verificar las barreras.'}</span>
      </div>
    );
  }
  const s = Math.max(0, Math.round((ahora - actualizado.getTime()) / 1000));
  return (
    <div className="banda-vivo">
      <Broadcast weight="bold" aria-hidden="true" />
      <span><strong>En vivo.</strong> Hace {s} s</span>
    </div>
  );
}

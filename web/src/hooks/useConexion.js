import { useEffect, useState } from 'react';
import { estadoForzado } from '../lib/estados.js';

// ¿Hay red? navigator.onLine más los eventos online/offline (Lote 7). El otro aviso de "sin conexión"
// es el polling de barreras que falla (useBarreras().error); las vistas combinan los dos.
// ?estado=sinconexion lo fuerza para la demo.
export function useConexion() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const si = () => setEnLinea(true);
    const no = () => setEnLinea(false);
    window.addEventListener('online', si);
    window.addEventListener('offline', no);
    return () => { window.removeEventListener('online', si); window.removeEventListener('offline', no); };
  }, []);
  return estadoForzado() === 'sinconexion' ? false : enLinea;
}

import { useEffect, useState } from 'react';

// true solo si `activo` sigue true después de `ms` (Lote 7: el esqueleto aparece pasados 300 ms, para no parpadear).
export function useRetraso(activo, ms = 300) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!activo) { setListo(false); return undefined; }
    const id = setTimeout(() => setListo(true), ms);
    return () => clearTimeout(id);
  }, [activo, ms]);
  return activo && listo;
}

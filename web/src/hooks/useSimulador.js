import { useEffect, useState } from 'react';

// GET /api/simulador (contrato §7) cada vez que cambian el perfil o las obras activas.
// Sin sondeo: el campus construido no cambia en ejecución. Descarta respuestas de una consulta anterior.
export function useSimulador(perfil, ids, intento = 0) {
  const clave = `${perfil}|${[...ids].sort().join(',')}|${intento}`;
  const [r, setR] = useState({ clave: null, estado: 'cargando', datos: null });

  useEffect(() => {
    const controlador = new AbortController();
    const q = new URLSearchParams({ perfil });
    if (ids.length) q.set('obras', ids.join(','));
    fetch(`/api/simulador?${q}`, { signal: controlador.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((datos) => { if (!controlador.signal.aborted) setR({ clave, estado: 'ok', datos }); })
      .catch((e) => { if (!controlador.signal.aborted) setR({ clave, estado: 'error', datos: null }); });
    return () => controlador.abort();
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  return r.clave === clave ? r : { estado: 'cargando', datos: null };
}

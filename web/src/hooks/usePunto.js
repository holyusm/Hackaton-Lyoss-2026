import { useEffect, useState } from 'react';

// GET /api/puntos/:id con copia local: si se corta la red (un QR en un pasillo sin señal),
// el punto se sigue viendo y escuchando con lo último que cargó.
export function usePunto(id) {
  const clave = `parejo:punto:${id}`;
  const [r, setR] = useState({ punto: null, cargando: true, noEncontrado: false, sinConexion: false });

  useEffect(() => {
    const controlador = new AbortController();
    const guardado = () => { try { return JSON.parse(localStorage.getItem(clave)); } catch { return null; } };
    fetch(`/api/puntos/${encodeURIComponent(id)}`, { signal: controlador.signal })
      .then(async (res) => {
        if (res.status === 404) return setR({ punto: null, cargando: false, noEncontrado: true, sinConexion: false });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const punto = await res.json();
        try { localStorage.setItem(clave, JSON.stringify(punto)); } catch { /* sin almacenamiento */ }
        setR({ punto, cargando: false, noEncontrado: false, sinConexion: !navigator.onLine });
      })
      .catch(() => {
        if (controlador.signal.aborted) return;
        const punto = guardado();
        // Sin red y sin copia no es "no existe": la vista lo dice distinto.
        setR({ punto, cargando: false, noEncontrado: false, sinConexion: true });
      });
    const online = () => setR((e) => ({ ...e, sinConexion: false }));
    const offline = () => setR((e) => ({ ...e, sinConexion: true }));
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { controlador.abort(); window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [id, clave]);

  return r;
}

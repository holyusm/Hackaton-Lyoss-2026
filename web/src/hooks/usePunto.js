import { useEffect, useState } from 'react';

const cargando = { punto: null, cargando: true, noEncontrado: false, sinConexion: false };

export function usePunto(id) {
  const [respuesta, setRespuesta] = useState(null);
  const [intento, setIntento] = useState(0);
  const reintentar = () => setIntento((n) => n + 1);

  useEffect(() => {
    const clave = `parejo:punto:${id}`;
    const controlador = new AbortController();
    const cargar = async () => {
      try {
        const res = await fetch(`/api/puntos/${encodeURIComponent(id)}`, { signal: controlador.signal });
        if (controlador.signal.aborted) return;
        if (res.status === 404) {
          try { localStorage.removeItem(clave); } catch { /* almacenamiento opcional */ }
          setRespuesta({ id, punto: null, noEncontrado: true });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const punto = await res.json();
        if (controlador.signal.aborted) return;
        try { localStorage.setItem(clave, JSON.stringify(punto)); } catch { /* almacenamiento opcional */ }
        setRespuesta({ id, punto, sinConexion: !navigator.onLine });
      } catch {
        if (controlador.signal.aborted) return;
        let punto = null;
        try { punto = JSON.parse(localStorage.getItem(clave)); } catch { /* copia no disponible */ }
        setRespuesta({ id, punto, sinConexion: true });
      }
    };
    cargar();
    const offline = () => setRespuesta((r) => r?.id === id ? { ...r, sinConexion: true } : r);
    window.addEventListener('online', reintentar);
    window.addEventListener('offline', offline);
    return () => {
      controlador.abort();
      window.removeEventListener('online', reintentar);
      window.removeEventListener('offline', offline);
    };
  }, [id, intento]);

  return { ...(respuesta?.id === id ? respuesta : cargando), reintentar };
}

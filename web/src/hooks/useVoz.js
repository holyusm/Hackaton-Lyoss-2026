import { useCallback, useEffect, useRef, useState } from 'react';

export const VELOCIDADES = [
  { id: 'lenta', etiqueta: 'Lenta', rate: 0.8 },
  { id: 'normal', etiqueta: 'Normal', rate: 1 },
  { id: 'rapida', etiqueta: 'Rápida', rate: 1.25 },
];
const CLAVE = 'parejo:velocidad-voz';
const leer = () => { try { return localStorage.getItem(CLAVE) ?? 'normal'; } catch { return 'normal'; } };
const sintesis = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

// Lectura en voz alta por bloques (Lote 5). Una utterance por frase: así se sabe qué bloque se está leyendo.
// Nunca arranca sola: solo con leer(). Cada corrida lleva un token, porque cancel() dispara el onend de la
// frase en curso y, sin token, ese onend lanzaría la siguiente y se saltaría un bloque.
export function useVoz() {
  const [voz, setVoz] = useState(null);
  const [estado, setEstado] = useState('reposo'); // reposo | leyendo | pausa
  const [indice, setIndice] = useState(-1);
  const [velocidad, setVelocidadId] = useState(leer);
  const token = useRef(0);
  const frasesRef = useRef([]);
  const indiceRef = useRef(-1);

  // Chrome entrega las voces tarde: getVoices() más el evento voiceschanged.
  useEffect(() => {
    const s = sintesis();
    if (!s) return;
    const elegir = () => {
      const voces = s.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('es'));
      setVoz(voces.find((v) => v.lang.toLowerCase() === 'es-cl') ?? voces[0] ?? null);
    };
    elegir();
    s.addEventListener?.('voiceschanged', elegir);
    return () => s.removeEventListener?.('voiceschanged', elegir);
  }, []);

  const detener = useCallback(() => { token.current += 1; sintesis()?.cancel(); }, []);

  const leerDesde = useCallback((frases, desde = 0, rate) => {
    const s = sintesis();
    if (!s) return;
    detener();
    const mio = token.current;
    frasesRef.current = frases;
    const r = rate ?? VELOCIDADES.find((v) => v.id === velocidad)?.rate ?? 1;
    const decir = (i) => {
      if (mio !== token.current) return;
      if (i >= frases.length) { setEstado('reposo'); setIndice(-1); indiceRef.current = -1; return; }
      const u = new SpeechSynthesisUtterance(frases[i].texto);
      u.lang = 'es-CL';
      if (voz) u.voice = voz;
      u.rate = r;
      u.onstart = () => { if (mio === token.current) { setIndice(i); indiceRef.current = i; } };
      u.onend = () => decir(i + 1);
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') decir(i + 1); };
      s.speak(u);
    };
    setEstado('leyendo');
    setIndice(desde); indiceRef.current = desde;
    decir(desde);
  }, [detener, velocidad, voz]);

  const pausar = useCallback(() => { sintesis()?.pause(); setEstado('pausa'); }, []);
  const seguir = useCallback(() => { sintesis()?.resume(); setEstado('leyendo'); }, []);
  const repetir = useCallback(() => leerDesde(frasesRef.current, 0), [leerDesde]);

  const setVelocidad = useCallback((id) => {
    setVelocidadId(id);
    try { localStorage.setItem(CLAVE, id); } catch { /* sin almacenamiento: dura esta visita */ }
    // Si está leyendo, retoma desde el mismo bloque con la nueva velocidad.
    if (estado !== 'reposo') leerDesde(frasesRef.current, Math.max(0, indiceRef.current), VELOCIDADES.find((v) => v.id === id)?.rate);
  }, [estado, leerDesde]);

  // Al salir de la vista o de la página, se calla.
  useEffect(() => {
    const salir = () => detener();
    window.addEventListener('pagehide', salir);
    return () => { window.removeEventListener('pagehide', salir); salir(); };
  }, [detener]);

  return { disponible: Boolean(sintesis() && voz), estado, indice, velocidad, leer: leerDesde, pausar, seguir, repetir, setVelocidad };
}

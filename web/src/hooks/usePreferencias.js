import { createContext, createElement, useContext, useLayoutEffect, useState } from 'react';

// Preferencias del usuario guardadas en este dispositivo (parejo:*).
// localStorage puede fallar (modo privado, almacenamiento bloqueado): la app sigue sin recordar.
const leer = (clave, porDefecto) => {
  try { return localStorage.getItem(clave) ?? porDefecto; } catch { return porDefecto; }
};
const guardar = (clave, valor) => {
  try {
    if (valor == null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch { /* sin almacenamiento: solo dura esta visita */ }
};

const Preferencias = createContext(null);

export function PreferenciasProvider({ children }) {
  // tema null = seguir prefers-color-scheme (tokens.css lo resuelve sin data-tema).
  const [tema, setTema] = useState(() => leer('parejo:tema', null));
  const [texto, setTexto] = useState(() => leer('parejo:texto', 'normal'));
  const [voz, setVoz] = useState(() => leer('parejo:voz', 'no') === 'si');
  const [perfil, setPerfil] = useState(() => leer('parejo:perfil', null));

  // useLayoutEffect: se aplica antes de pintar, sin parpadeo de tema.
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (tema) html.setAttribute('data-tema', tema);
    else html.removeAttribute('data-tema');
    html.setAttribute('data-texto', texto);
  }, [tema, texto]);

  const valor = {
    tema, texto, voz, perfil,
    altoContraste: tema === 'contraste',
    setAltoContraste: (si) => { const t = si ? 'contraste' : null; setTema(t); guardar('parejo:tema', t); },
    setTexto: (t) => { setTexto(t); guardar('parejo:texto', t); },
    setVoz: (si) => { setVoz(si); guardar('parejo:voz', si ? 'si' : 'no'); },
    setPerfil: (id) => { setPerfil(id); guardar('parejo:perfil', id); },
  };
  return createElement(Preferencias.Provider, { value: valor }, children);
}

export const usePreferencias = () => useContext(Preferencias);

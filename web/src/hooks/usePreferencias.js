import { createContext, createElement, useContext, useEffect, useLayoutEffect, useState } from 'react';

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

// Modo presentación (Lote 7): ?presentacion=1 o tecla P. Dura la pestaña (sessionStorage),
// así sobrevive a la navegación con <Link>, que no arrastra el parámetro.
const presentacionInicial = () => {
  try {
    if (new URLSearchParams(window.location.search).get('presentacion') === '1') return true;
    return sessionStorage.getItem('parejo:presentacion') === 'si';
  } catch { return false; }
};
const enCampoDeTexto = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function PreferenciasProvider({ children }) {
  // tema null = seguir prefers-color-scheme (tokens.css lo resuelve sin data-tema).
  const [temaElegido, setTema] = useState(() => leer('parejo:tema', null));
  const [textoElegido, setTexto] = useState(() => leer('parejo:texto', null));
  const [enPunto, setEnPunto] = useState(false);
  const temaBase = temaElegido ?? (enPunto ? 'contraste' : null);
  const tema = temaBase === 'auto' ? null : temaBase;
  const texto = textoElegido ?? (enPunto ? 'grande' : 'normal');
  const [voz, setVoz] = useState(() => leer('parejo:voz', 'no') === 'si');
  const [perfil, setPerfil] = useState(() => leer('parejo:perfil', null));
  const [presentacion, setPresentacionEstado] = useState(presentacionInicial);
  const setPresentacion = (si) => {
    setPresentacionEstado(si);
    try { sessionStorage.setItem('parejo:presentacion', si ? 'si' : 'no'); } catch { /* solo esta vista */ }
  };

  // useLayoutEffect: se aplica antes de pintar, sin parpadeo de tema.
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (tema) html.setAttribute('data-tema', tema);
    else html.removeAttribute('data-tema');
    html.setAttribute('data-texto', texto);
  }, [tema, texto]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (presentacion) html.setAttribute('data-presentacion', '');
    else html.removeAttribute('data-presentacion');
  }, [presentacion]);

  // Tecla P en escritorio, fuera de campos de texto y sin modificadores.
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key !== 'p' && e.key !== 'P') return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || enCampoDeTexto(e.target)) return;
      setPresentacionEstado((antes) => {
        try { sessionStorage.setItem('parejo:presentacion', antes ? 'no' : 'si'); } catch { /* */ }
        return !antes;
      });
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, []);

  const valor = {
    tema, texto, voz, perfil, presentacion, setPresentacion,
    altoContraste: tema === 'contraste',
    setAltoContraste: (si) => { const t = si ? 'contraste' : 'auto'; setTema(t); guardar('parejo:tema', t); },
    setTexto: (t) => { setTexto(t); guardar('parejo:texto', t); },
    setVoz: (si) => { setVoz(si); guardar('parejo:voz', si ? 'si' : 'no'); },
    setPerfil: (id) => { setPerfil(id); guardar('parejo:perfil', id); },
    setEnPunto,
  };
  return createElement(Preferencias.Provider, { value: valor }, children);
}

export const usePreferencias = () => useContext(Preferencias);

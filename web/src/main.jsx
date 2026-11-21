import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/componentes.css';

// Esqueleto: el shell y las vistas los implementa quien tenga asignado cada lote
// (docs/diseno/vistas/README.md).
createRoot(document.getElementById('root')).render(
  <main id="contenido">
    <h1>parejo</h1>
    <p>Campus sin barreras en Casa Central, USM.</p>
  </main>
);

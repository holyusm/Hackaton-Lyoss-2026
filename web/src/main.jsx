import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/componentes.css';
import { PreferenciasProvider } from './hooks/usePreferencias.js';
import Shell from './components/Shell.jsx';
import Inicio from './views/Inicio.jsx';
import Mapa from './views/Mapa.jsx';
import Comparar from './views/Comparar.jsx';

// Vistas sin implementar todavía: cada una se reemplaza por su archivo en web/src/views/.
const Pendiente = ({ titulo }) => (
  <section className="vista-pendiente">
    <h1>{titulo}</h1>
    <p>Vista en construcción.</p>
  </section>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreferenciasProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/comparar" element={<Comparar />} />
            <Route path="/reportar" element={<Pendiente titulo="Reportar una barrera" />} />
            <Route path="/punto/:id" element={<Pendiente titulo="Punto QR" />} />
            <Route path="/acerca" element={<Pendiente titulo="Acerca de Parejo" />} />
            <Route path="*" element={<Pendiente titulo="Página no encontrada" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreferenciasProvider>
  </React.StrictMode>
);

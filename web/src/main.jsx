import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/componentes.css';
import { PreferenciasProvider } from './hooks/usePreferencias.js';
import Shell from './components/Shell.jsx';
import Inicio from './views/Inicio.jsx';
import Mapa from './views/Mapa.jsx';
import Reportar from './views/Reportar.jsx';
import Comparar from './views/Comparar.jsx';
import Campus from './views/Campus.jsx';
import CampusInforme from './views/CampusInforme.jsx';
import Plano from './views/Plano.jsx';
import Punto from './views/Punto.jsx';
import Acerca from './views/Acerca.jsx';

const NoEncontrada = () => (
  <section className="vista-pendiente" aria-labelledby="titulo-404">
    <h1 id="titulo-404">Página no encontrada</h1>
    <p>La dirección que buscas no existe o cambió de lugar.</p>
    <p>
      <Link to="/" className="boton boton--primario">Ir al inicio</Link>
    </p>
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
            <Route path="/plano" element={<Plano />} />
            <Route path="/comparar" element={<Comparar />} />
            <Route path="/reportar" element={<Reportar />} />
            <Route path="/punto/:id" element={<Punto />} />
            <Route path="/campus" element={<Campus />} />
            <Route path="/acerca" element={<Acerca />} />
            <Route path="*" element={<NoEncontrada />} />
          </Route>
          {/* Informe A4 de /campus: fuera del Shell, sin cabecera ni navegación (Lote 8, ref. 16). */}
          <Route path="/campus/informe" element={<CampusInforme />} />
        </Routes>
      </BrowserRouter>
    </PreferenciasProvider>
  </React.StrictMode>
);

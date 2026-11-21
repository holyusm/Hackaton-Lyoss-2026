import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListBullets } from '@phosphor-icons/react';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import BandaEnVivo from '../components/BandaEnVivo.jsx';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import HojaRuta from '../components/HojaRuta.jsx';
import LimiteError from '../components/LimiteError.jsx';
import MapaRuta from '../components/MapaRuta.jsx';
import VistaLista from '../components/VistaLista.jsx';
import { useRuta } from '../hooks/useRuta.js';
import { useRetraso } from '../hooks/useRetraso.js';
import ErrorEnLinea from '../components/ErrorEnLinea.jsx';
import { Bloque, Cargando, PlanoEsqueleto } from '../components/Esqueleto.jsx';
import { TEXTOS, conHora } from '../lib/estados.js';
import './Mapa.css';

// Alto de la hoja en móvil, para que el mapa deje libre esa franja al encajar la ruta.
const ALTO_HOJA = { resumen: 304, media: 496, completa: 696 };

const leerVista = () => { try { return localStorage.getItem('parejo:vista') === 'lista'; } catch { return false; } };
const guardarVista = (lista) => { try { localStorage.setItem('parejo:vista', lista ? 'lista' : 'mapa'); } catch { /* sin almacenamiento */ } };

function useEscritorio() {
  const consulta = '(min-width: 900px)';
  const [si, setSi] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const alCambiar = () => setSi(m.matches);
    m.addEventListener('change', alCambiar);
    return () => m.removeEventListener('change', alCambiar);
  }, []);
  return si;
}

const describir = (ruta) => `Plano de Casa Central con tu ruta: ${ruta.pasos.map((p) => p.instruccion.replace(/\.$/, '')).join(', ')}.`;

export default function Mapa() {
  const r = useRuta();
  const escritorio = useEscritorio();
  const [altura, setAltura] = useState('resumen');
  const [lista, setLista] = useState(leerVista);
  const cambiarLista = (si) => { setLista(si); guardarVista(si); };

  const verEsqueleto = useRetraso(r.estado === 'cargando');
  if (r.estado === 'cargando') {
    // Lote 7: contorno punteado de los edificios y una hoja con título, 3 cifras y 3 pasos (pasados 300 ms).
    if (!verEsqueleto) return <div className="mapa-vista" />;
    return (
      <div className="mapa-vista">
        <div className="mapa-lienzo"><PlanoEsqueleto className="mapa-esqueleto__plano" /></div>
        <Cargando as="section" id="ruta" tabIndex={-1} anuncio={TEXTOS.carga.ruta} className="hoja-ruta hoja-ruta--estado">
          <span className="hoja-ruta__barra" aria-hidden="true"><span /></span>
          <div className="mapa-esqueleto__hoja" aria-hidden="true">
            <Bloque ancho="60%" alto={24} />
            <Bloque ancho="40%" alto={14} suave />
            <div className="mapa-esqueleto__cifras">{[0, 1, 2].map((i) => <span key={i}><Bloque ancho="45%" alto={10} /><Bloque ancho="65%" alto={18} /></span>)}</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mapa-esqueleto__paso">
                <span className="mapa-esqueleto__punto" />
                <span className="mapa-esqueleto__textos"><Bloque ancho={i === 1 ? '62%' : '70%'} alto={14} /><Bloque ancho="45%" alto={10} suave /></span>
              </div>
            ))}
          </div>
        </Cargando>
      </div>
    );
  }
  if (r.estado === 'error') {
    const cambiar = `/?${new URLSearchParams({ desde: r.consulta.desde ?? '', hasta: r.consulta.hasta ?? '' })}`;
    return (
      <div className="mapa-vista">
        <div className="mapa-lienzo">
          {r.grafo && r.mapa && r.origen && r.destino ? (
            <LimiteError>
              <MapaRuta grafo={r.grafo} mapa={r.mapa} origen={r.origen} destino={r.destino} barreras={r.barreras}
                alturaHoja={escritorio ? 0 : 200} controles={false} descripcion={`Plano de Casa Central con el origen y ${r.destino.nombre}. Sin ruta calculada.`} />
            </LimiteError>
          ) : <PlanoEsqueleto className="mapa-esqueleto__plano" />}
        </div>
        <section id="ruta" tabIndex={-1} className="hoja-ruta hoja-ruta--estado" aria-labelledby="ruta-titulo">
          <h1 id="ruta-titulo" className="sr-only">Tu ruta</h1>
          <span className="hoja-ruta__barra" aria-hidden="true"><span /></span>
          <ErrorEnLinea className="mapa-error" primario titulo={TEXTOS.error.ruta.titulo} texto={TEXTOS.error.ruta.texto}
            onReintentar={r.reintentar} accionSecundaria={{ texto: TEXTOS.error.ruta.secundaria, to: cambiar }} />
        </section>
      </div>
    );
  }
  if (r.estado === 'sinRuta') {
    return (
      <section id="ruta" tabIndex={-1} className="mapa-estado">
        <h1>No encontramos una ruta hacia {r.destino.nombre}</h1>
        <div className="mapa-sinruta__mapa">
          <LimiteError>
            <MapaRuta
              grafo={r.grafo} mapa={r.mapa} origen={r.origen} destino={r.destino} barreras={r.barreras}
              alturaHoja={0} controles={false}
              descripcion={`Plano de Casa Central con el origen y ${r.destino.nombre}${r.barreras.length ? ' y las barreras que cortan el paso' : ''}. No hay ruta accesible.`}
            />
          </LimiteError>
        </div>
        <AvisoBarrera variante="bloqueo" role="alert" titulo="No hay una ruta accesible en este momento">{r.motivo}</AvisoBarrera>
        <Link to="/" className="boton boton--primario">Probar con otro destino</Link>
      </section>
    );
  }

  const perfil = PERFILES.find((p) => p.id === r.consulta.perfil);
  // Lote 7: sin conexión, la última ruta conocida con un aviso amarillo y su hora.
  const sinVerificar = r.sinConexion && (
    <AvisoBarrera variante="compacto" role="status" className="mapa-aviso mapa-aviso--amarillo">{conHora(TEXTOS.sinConexion.ruta, r.hora)}</AvisoBarrera>
  );
  if (lista) {
    return <>{sinVerificar}<VistaLista ruta={r.ruta} origen={r.origen} destino={r.destino} perfil={perfil} onVerMapa={() => cambiarLista(false)} /></>;
  }
  return (
    <div className="mapa-vista">
      <div className="mapa-lienzo">
        <LimiteError onVerLista={() => cambiarLista(true)}>
          <MapaRuta
            ruta={r.ruta} grafo={r.grafo} mapa={r.mapa} origen={r.origen} destino={r.destino}
            barreras={r.barreras} alturaHoja={escritorio ? 0 : ALTO_HOJA[altura]} controles={escritorio || altura === 'resumen'}
            descripcion={describir(r.ruta)}
          />
        </LimiteError>
        <div className="mapa-flotantes">
          <button type="button" className="boton-pastilla" aria-pressed="false" onClick={() => cambiarLista(true)}>
            <ListBullets weight="bold" aria-hidden="true" /> Ver como lista
          </button>
          <BandaEnVivo actualizado={r.actualizado} error={r.errorBarreras} sinConexion={r.sinConexion} texto={TEXTOS.bandaSinConexion.ruta} hora={r.hora} />
          {sinVerificar}
        </div>
      </div>
      <HojaRuta ruta={r.ruta} origen={r.origen} destino={r.destino} perfil={perfil} altura={altura} onAltura={setAltura} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListBullets } from '@phosphor-icons/react';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import HojaRuta from '../components/HojaRuta.jsx';
import MapaRuta from '../components/MapaRuta.jsx';
import VistaLista from '../components/VistaLista.jsx';
import { useRuta } from '../hooks/useRuta.js';
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

  if (r.estado === 'cargando') {
    return <section className="mapa-estado" role="status"><p>Calculando tu ruta</p></section>;
  }
  if (r.estado === 'sinVerificar') {
    return (
      <section className="mapa-estado">
        <h1>Ruta pendiente de verificar</h1>
        <p role="status">{r.aviso}</p>
        <button type="button" className="boton boton--primario" onClick={() => window.location.reload()}>Reintentar</button>
      </section>
    );
  }
  if (r.estado === 'sinRuta') {
    return (
      <section className="mapa-estado">
        <h1>No encontramos una ruta hacia {r.destino.nombre}</h1>
        <AvisoBarrera variante="bloqueo" role="alert" titulo="No hay una ruta accesible en este momento">{r.motivo}</AvisoBarrera>
        <Link to="/" className="boton boton--primario">Probar con otro destino</Link>
      </section>
    );
  }

  const perfil = PERFILES.find((p) => p.id === r.consulta.perfil);
  const sinVerificar = r.barrerasSinVerificar && (
    <AvisoBarrera variante="compacto" role="status" className="mapa-aviso">No pudimos verificar las barreras activas del campus. La ruta puede no tenerlas en cuenta.</AvisoBarrera>
  );
  if (lista) {
    return <>{sinVerificar}<VistaLista ruta={r.ruta} origen={r.origen} destino={r.destino} perfil={perfil} onVerMapa={() => cambiarLista(false)} /></>;
  }
  return (
    <div className="mapa-vista">
      <div className="mapa-lienzo">
        <MapaRuta
          ruta={r.ruta} grafo={r.grafo} mapa={r.mapa} origen={r.origen} destino={r.destino}
          barreras={r.barreras} alturaHoja={escritorio ? 0 : ALTO_HOJA[altura]} controles={escritorio || altura === 'resumen'}
          descripcion={describir(r.ruta)}
        />
        <div className="mapa-flotantes">
          <button type="button" className="boton-pastilla" aria-pressed="false" onClick={() => cambiarLista(true)}>
            <ListBullets weight="bold" aria-hidden="true" /> Ver como lista
          </button>
          {sinVerificar}
        </div>
      </div>
      <HojaRuta ruta={r.ruta} origen={r.origen} destino={r.destino} perfil={perfil} altura={altura} onAltura={setAltura} />
    </div>
  );
}

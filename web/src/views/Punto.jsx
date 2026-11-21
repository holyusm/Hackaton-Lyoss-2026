import { useLayoutEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Person, WifiSlash } from '@phosphor-icons/react';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import BarraVoz from '../components/BarraVoz.jsx';
import TarjetaDestino from '../components/TarjetaDestino.jsx';
import { armarPunto, frasesPunto } from '../lib/punto.js';
import { useBarreras } from '../hooks/useBarreras.js';
import { useLugares } from '../hooks/useLugares.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { usePunto } from '../hooks/usePunto.js';
import { useVoz } from '../hooks/useVoz.js';
import './Punto.css';

// /punto/:id (Lote 5): lo que abre el QR. Pensado para baja visión: abre en contraste y A+ si la persona
// nunca eligió otra cosa, y lee en voz alta, bloque por bloque, en el mismo orden en que se ve.
export default function Punto() {
  const { id } = useParams();
  const prefs = usePreferencias();
  const { setEnPunto } = prefs;
  useLayoutEffect(() => {
    setEnPunto(true);
    return () => setEnPunto(false);
  }, [setEnPunto]);

  const { punto, cargando, noEncontrado, sinConexion, reintentar } = usePunto(id);
  const { grafo } = useLugares();
  const { barreras, error, actualizado } = useBarreras();
  const estadoBarreras = error || sinConexion
    ? 'No pudimos verificar las barreras actuales. Las indicaciones pueden estar desactualizadas.'
    : !actualizado ? 'Estamos verificando las barreras actuales.' : null;

  const modelo = useMemo(() => (punto ? armarPunto(punto, grafo, barreras, prefs.perfil) : null), [punto, grafo, barreras, prefs.perfil]);
  const frases = useMemo(() => (modelo ? frasesPunto(modelo, estadoBarreras) : []), [modelo, estadoBarreras]);
  const v = useVoz(id);
  const actual = v.actual?.clave ?? null;
  const resaltar = (clave) => (actual === clave ? 'punto__leyendo' : '');

  if (cargando) return <div className="punto"><p>Cargando el punto…</p></div>;
  if (sinConexion && !modelo && !noEncontrado) {
    return (
      <div className="punto">
        <h1>No pudimos cargar este punto QR. Revisa tu conexión.</h1>
        <p><button type="button" className="boton boton--primario" onClick={reintentar}>Reintentar</button></p>
        <p><Link to="/">Ir al inicio</Link></p>
      </div>
    );
  }
  if (noEncontrado || !modelo) {
    return (
      <div className="punto">
        <h1>No encontramos este punto QR.</h1>
        <p><Link to="/">Ir al inicio</Link></p>
      </div>
    );
  }

  return (
    <div className="punto">
      {sinConexion && (
        <p className="banda-vivo banda-vivo--sin-conexion punto__sin-conexion" role="status">
          <WifiSlash weight="bold" aria-hidden="true" /> Sin conexión. Puedes seguir escuchando lo que ya cargó.
        </p>
      )}

      {estadoBarreras && (
        <div className={resaltar('estado-barreras')}>
          <AvisoBarrera titulo={estadoBarreras} />
        </div>
      )}

      {modelo.barrera && (
        <div className={resaltar('aviso')}>
          <AvisoBarrera variante="alerta" role="alert" titulo={modelo.barrera.titulo}>
            El aviso vence a las {modelo.barrera.vence}.
          </AvisoBarrera>
        </div>
      )}

      <div className={`punto__lugar ${resaltar('lugar')}`}>
        <h1>{modelo.titulo}</h1>
        {modelo.descripcion && <p>{modelo.descripcion}</p>}
      </div>

      <BarraVoz v={v} frases={frases} />

      <section aria-labelledby="punto-destinos" className="punto__destinos">
        <h2 id="punto-destinos">Desde aquí puedes ir a:</h2>
        <ul>
          {modelo.destinos.map((d) => <TarjetaDestino key={d.id} destino={d} resaltado={actual === d.id} />)}
        </ul>
      </section>

      <footer className="punto__pie">
        <p>Este punto QR es parte de un prototipo estudiantil.</p>
        <Link to="/" className="punto__perfil"><Person weight="bold" aria-hidden="true" /> Cambiar perfil</Link>
      </footer>
    </div>
  );
}

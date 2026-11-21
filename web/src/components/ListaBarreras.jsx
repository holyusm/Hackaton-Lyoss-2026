import { useEffect, useRef, useState } from 'react';
import { Prohibit, Warning } from '@phosphor-icons/react';
import { ICONOS_REPORTE } from './OpcionesTipo.jsx';
import BandaEnVivo from './BandaEnVivo.jsx';
import DialogoResolver from './DialogoResolver.jsx';
import { iconoReporte, lugarReporte, metaReporte, tituloReporte } from '../lib/reportes.js';

// Barreras activas. `barreras` ya viene ordenada (las nuevas primero). `nuevas` es un Set de ids con la marca "Nuevo".
export default function ListaBarreras({ barreras, grafo, nuevas, actualizado, errorConsulta, onResolver }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [abierta, setAbierta] = useState(null); // { barrera, boton }
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const refTitulo = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const confirmar = async (barrera) => {
    setEnviando(true);
    setError('');
    const ok = await onResolver(barrera);
    setEnviando(false);
    if (!ok) setError('No pudimos marcarla como resuelta. Intenta de nuevo.');
    return ok;
  };

  const verificada = Boolean(actualizado) && !errorConsulta;
  const estadoVacio = errorConsulta ? 'No pudimos verificar las barreras activas.' : 'Consultando barreras activas…';
  return (
    <section id="activas" className="reporte-lista" aria-labelledby="activas-titulo">
      <h2 id="activas-titulo" tabIndex={-1} ref={refTitulo}>Barreras activas{verificada ? ` (${barreras.length})` : ''}</h2>
      <div className="reporte-lista__vivo"><BandaEnVivo actualizado={actualizado} error={errorConsulta} /></div>

      {barreras.length === 0 ? (
        <div className="reporte-vacio">
          {verificada ? <p><strong>No hay barreras reportadas ahora.</strong> Si ves una, avísanos: ayudas a todo el campus.</p> : <p role="status">{estadoVacio}</p>}
        </div>
      ) : (
        <ul className="reporte-filas">
          {barreras.map((b) => {
            const titulo = tituloReporte(b, grafo);
            const lugar = lugarReporte(b, grafo);
            const Icono = ICONOS_REPORTE[iconoReporte(b)];
            const bloqueo = b.nivel === 'bloqueo';
            const Glifo = Icono ?? (bloqueo ? Prohibit : Warning);
            return (
              <li key={b.id} className={nuevas.has(b.id) ? 'reporte-fila reporte-fila--nueva' : 'reporte-fila'}>
                <span className={`reporte-fila__icono ${bloqueo ? 'reporte-fila__icono--bloqueo' : 'reporte-fila__icono--alerta'}`} role="img" aria-label={bloqueo ? 'Bloqueado' : 'Barrera activa'}>
                  <Glifo weight="bold" aria-hidden="true" />
                </span>
                <div className="reporte-fila__cuerpo">
                  <p className="reporte-fila__titulo">{titulo}{nuevas.has(b.id) && <span className="reporte-fila__nuevo">Nuevo</span>}</p>
                  <p className="reporte-fila__lugar">{lugar}</p>
                  {b.descripcion && b.descripcion !== titulo && <p id={`detalle-${b.id}`}>{b.descripcion}</p>}
                  <p className="reporte-fila__meta">{metaReporte(b, ahora)}</p>
                </div>
                <button
                  type="button" className="boton boton--secundario boton--chico" aria-label={`Ya está resuelto: ${titulo}, ${lugar}`} aria-describedby={b.descripcion && b.descripcion !== titulo ? `detalle-${b.id}` : undefined}
                  onClick={(e) => { setError(''); setAbierta({ barrera: b, boton: e.currentTarget }); }}
                >
                  Ya está resuelto
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {abierta && (
        <DialogoResolver
          barrera={abierta.barrera} titulo={tituloReporte(abierta.barrera, grafo)} lugar={lugarReporte(abierta.barrera, grafo)}
          enviando={enviando} error={error} onConfirmar={confirmar} onCerrar={() => setAbierta(null)}
          devolverFoco={abierta.boton} respaldoFoco={() => refTitulo.current}
        />
      )}
    </section>
  );
}

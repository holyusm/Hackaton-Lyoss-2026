import { useRef, useState } from 'react';
import { UsersThree } from '@phosphor-icons/react';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { useSimulador } from '../hooks/useSimulador.js';
import './Campus.css';

// /campus (Lote 8): "¿Qué arreglar primero?". Ranking de obras con el simulador (contrato §7, GLOSSARY.md).
const OPCIONES = [...PERFILES, { id: 'todos', nombre: 'Todos los perfiles', Icono: UsersThree }];
const QUE_ES_BARRERA = {
  estandar: 'En Estándar no hay trayectos con barrera: es la base para comparar.',
  silla_ruedas: 'En silla de ruedas, un trayecto tiene barrera cuando no hay ruta posible.',
  movilidad_reducida: 'Con movilidad reducida, un trayecto tiene barrera cuando su ruta obliga a subir escalones.',
  baja_vision: 'Con baja visión, un trayecto tiene barrera cuando su ruta pasa por adoquín, piso irregular o sin guía podotáctil.',
  todos: 'Con todos los perfiles, un trayecto tiene barrera cuando la tiene para al menos uno.',
};
const minutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function Campus() {
  const [perfil, setPerfil] = useState('silla_ruedas');
  const [activas, setActivas] = useState([]);
  const { estado, datos } = useSimulador(perfil, activas);
  const chips = useRef([]);

  const alternar = (id) => setActivas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const indice = OPCIONES.findIndex((o) => o.id === perfil);
  const alTeclear = (e, i) => {
    const n = OPCIONES.length;
    const a = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (a === undefined) return;
    e.preventDefault();
    const j = ((a % n) + n) % n;
    setPerfil(OPCIONES[j].id);
    chips.current[j]?.focus();
  };

  const hoy = datos?.hoy;
  const con = datos?.con_obras;

  return (
    <div className="campus">
      <div className="campus__titulo">
        <h1>¿Qué arreglar primero?</h1>
        <p>Simula obras en Casa Central y mira cuántos trayectos dejan de tener barreras.</p>
      </div>

      <section className="campus__bloque" aria-labelledby="campus-perfil">
        <h2 id="campus-perfil" className="campus__etiqueta">Para quién</h2>
        <div className="campus__perfiles" role="radiogroup" aria-labelledby="campus-perfil">
          {OPCIONES.map((o, i) => (
            <button
              key={o.id} ref={(el) => { chips.current[i] = el; }} type="button" role="radio"
              className="chip-perfil" aria-checked={perfil === o.id} tabIndex={i === indice ? 0 : -1}
              onClick={() => setPerfil(o.id)} onKeyDown={(e) => alTeclear(e, i)}
            >
              <span className="perfil__icono"><o.Icono weight="bold" aria-hidden="true" /></span>
              {o.nombre}
            </button>
          ))}
        </div>
        <p className="campus__explica">{QUE_ES_BARRERA[perfil]}</p>
      </section>

      {estado === 'error' && !datos && <p role="alert">No pudimos calcular el campus. Intenta de nuevo en unos segundos.</p>}

      {hoy && (
        <section className="campus__bloque" aria-labelledby="campus-hoy" aria-busy={estado === 'cargando'}>
          <h2 id="campus-hoy" className="campus__etiqueta">Hoy</h2>
          <dl className="metricas">
            <div className="metrica">
              <dt>trayectos con barrera, de {hoy.trayectos_evaluados}</dt>
              <dd className="cifras">{hoy.trayectos_con_barrera}</dd>
            </div>
            {hoy.minutos_extra_prom !== null && (
              <div className="metrica">
                <dt>minutos de desvío en promedio</dt>
                <dd className="cifras">{minutos(hoy.minutos_extra_prom)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Siempre montado: el lector anuncia el resultado al activar o desactivar una obra. */}
      <div className="campus__comparacion" aria-live="polite">
        {con && hoy && (
          <p>
            <strong>Hoy:</strong> {hoy.trayectos_con_barrera} trayectos con barrera.{' '}
            <strong>Con {activas.length === 1 ? 'la obra elegida' : `las ${activas.length} obras elegidas`}:</strong>{' '}
            {con.trayectos_con_barrera} trayectos con barrera.
          </p>
        )}
      </div>

      {datos?.obras && (
        <section className="campus__bloque" aria-labelledby="campus-obras">
          <h2 id="campus-obras" className="campus__etiqueta">Obras, de más a menos impacto</h2>
          <ol className="campus__obras">
            {datos.obras.map((o) => {
              const id = `obra-${o.id}`;
              const on = activas.includes(o.id);
              return (
                <li key={o.id} className="campus__obra">
                  <div className="campus__obra-texto">
                    <h3 id={id}>{o.titulo}</h3>
                    <p className="campus__obra-meta">{o.lugar}. Costo {o.costo_relativo} (estimación del equipo).</p>
                    <p>
                      {o.trayectos_sin_barrera > 0
                        ? <>Saca la barrera de <strong>{o.trayectos_sin_barrera}</strong> {o.trayectos_sin_barrera === 1 ? 'trayecto' : 'trayectos'}</>
                        : 'No cambia los trayectos con barrera para este perfil'}
                      {o.minutos_ahorrados_prom > 0 && <>, y ahorra {minutos(o.minutos_ahorrados_prom)} min en promedio</>}.
                    </p>
                  </div>
                  <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-sim ${id}`} className="interruptor campus__simular" onClick={() => alternar(o.id)}>
                    <span id={`${id}-sim`} className="interruptor__texto">
                      <strong>Simular</strong>
                      <span className="interruptor__estado">{on ? 'Activada' : 'Desactivada'}</span>
                    </span>
                    <span className="interruptor__riel" aria-hidden="true"><span className="interruptor__perilla" /></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="campus__supuestos">
        Datos de ejemplo. Las obras y su costo son estimaciones del equipo, no un presupuesto de la USM. Se mide sobre el campus construido, sin contar los reportes del momento.
      </p>
    </div>
  );
}

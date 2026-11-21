import { useRef, useState } from 'react';
import { Coins, Elevator, Footprints, Path, Prohibit, TrendUp, Umbrella, UsersThree, Warning } from '@phosphor-icons/react';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { useSimulador } from '../hooks/useSimulador.js';
import './Campus.css';

// /campus (Lote 8): "¿Qué arreglar primero?". Spec: docs/diseno/prompts-lotes-8-9.md (alcance esencial del 21-11).
// Datos: GET /api/simulador (contrato §7). Palabras: GLOSSARY.md.
const OPCIONES = [...PERFILES, { id: 'todos', nombre: 'Todos los perfiles', Icono: UsersThree }];
const QUE_ES_BARRERA = {
  silla_ruedas: 'En silla de ruedas, un trayecto tiene barrera cuando no hay ruta sin escalones.',
  movilidad_reducida: 'Con movilidad reducida, un trayecto tiene barrera cuando su ruta obliga a subir escalones.',
  baja_vision: 'Con baja visión, un trayecto tiene barrera cuando su ruta pasa por adoquín o piso irregular, o sin guía podotáctil.',
  todos: 'Con todos los perfiles, cuenta cada trayecto que tiene barrera para al menos uno.',
  estandar: '',
};
// "N trayectos más …" por perfil en la franja Con obras.
const GANANCIA = {
  silla_ruedas: ['Silla de ruedas', 'con ruta'],
  movilidad_reducida: ['Movilidad reducida', 'sin escalones'],
  baja_vision: ['Baja visión', 'con piso parejo y guía'],
};
const PARA = { silla_ruedas: 'en silla de ruedas', movilidad_reducida: 'con movilidad reducida', baja_vision: 'con baja visión', todos: 'para al menos un perfil' };
const TIPO = { rampa: TrendUp, ascensor: Elevator, superficie: Path, guia_tactil: Footprints, techado: Umbrella };
const minutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const trayectos = (n) => `${n} ${n === 1 ? 'trayecto' : 'trayectos'}`;

export default function Campus() {
  const [perfil, setPerfil] = useState('silla_ruedas');
  const [activas, setActivas] = useState([]);
  const [intento, setIntento] = useState(0);
  const { estado, datos } = useSimulador(perfil, activas, intento);
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
  const obras = datos?.obras ?? [];
  const estandar = perfil === 'estandar';
  const nombrePerfil = OPCIONES.find((o) => o.id === perfil)?.nombre;
  const menos = hoy && con ? hoy.trayectos_con_barrera - con.trayectos_con_barrera : 0;
  // Anuncio corto para el lector: la franja completa es demasiado larga para leerla en cada cambio.
  const anuncio = con
    ? `Con ${activas.length === 1 ? 'la obra simulada' : `${activas.length} obras simuladas`}, ${trayectos(menos)} menos tienen barrera ${PARA[perfil] ?? ''}.`
    : '';

  return (
    <div className="campus">
      <header className="campus__encabezado">
        <div className="campus__titulo">
          <h1>¿Qué arreglar primero?</h1>
          <span className="campus__ejemplo">Datos de ejemplo</span>
        </div>
        <p>Simulamos obras sobre el mapa accesible de Casa Central y medimos cuántos trayectos dejan de tener barrera para cada perfil.</p>

        <div className="campus__perfiles" role="radiogroup" aria-label="Perfil">
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
        {QUE_ES_BARRERA[perfil] && <p className="campus__explica">{QUE_ES_BARRERA[perfil]}</p>}
      </header>

      <p className="sr-only" aria-live="polite">{anuncio}</p>

      {estado === 'error' && (
        <div className="campus__error" role="alert">
          <p>No pudimos calcular el campus para esta elección.</p>
          <button type="button" className="boton boton--secundario boton--chico" onClick={() => setIntento((n) => n + 1)}>Reintentar</button>
        </div>
      )}
      {!datos && estado === 'cargando' && <p className="campus__cargando">Calculando los trayectos del campus…</p>}

      {estandar && datos && (
        <p className="campus__aviso">Para el perfil Estándar ningún trayecto tiene barrera. Elige otro perfil para ver dónde está.</p>
      )}

      {hoy && !estandar && (
        <section aria-labelledby="campus-hoy" aria-busy={estado === 'cargando'}>
          <h2 id="campus-hoy" className="sr-only">Hoy</h2>
          <dl className="metricas campus__cifras">
            <div className="metrica campus__cifra--barrera">
              <dt>de {hoy.trayectos_evaluados} trayectos con barrera</dt>
              <dd className="cifras"><Prohibit weight="bold" aria-hidden="true" />{hoy.trayectos_con_barrera}</dd>
            </div>
            {perfil !== 'todos' && (
              <div className="metrica">
                <dt>{hoy.minutos_extra_prom === null ? 'desvío promedio' : 'min de desvío promedio'}</dt>
                {hoy.minutos_extra_prom === null
                  ? <dd className="campus__sin-datos">Sin trayectos comparables</dd>
                  : <dd className="cifras">+{minutos(hoy.minutos_extra_prom)}</dd>}
              </div>
            )}
          </dl>
        </section>
      )}

      {con && hoy && (
        <section className="campus__franja" aria-labelledby="campus-con-obras">
          <h2 id="campus-con-obras">Con las obras simuladas</h2>
          <div className="campus__franja-columnas">
            <div>
              <p className="campus__franja-encabezado">Hoy</p>
              <p className="campus__franja-cifra"><span className="cifras">{hoy.trayectos_con_barrera}</span> con barrera</p>
            </div>
            <div>
              <p className="campus__franja-encabezado">Con {activas.length === 1 ? '1 obra' : `${activas.length} obras`}</p>
              <p className="campus__franja-cifra"><span className="cifras">{con.trayectos_con_barrera}</span> con barrera</p>
            </div>
          </div>
          <ul className="campus__por-perfil">
            {Object.entries(con.trayectos_sin_barrera_por_perfil).filter(([, n]) => n > 0).map(([id, n]) => (
              <li key={id}><strong>{GANANCIA[id][0]}:</strong> {trayectos(n)} más {GANANCIA[id][1]}.</li>
            ))}
          </ul>
          {activas.length === obras.length && con.trayectos_con_barrera > 0 && (
            <p className="campus__quedan">
              <Warning weight="bold" aria-hidden="true" />
              Aún quedan {trayectos(con.trayectos_con_barrera)} con barrera: necesitan obras que no están en la lista.
            </p>
          )}
          <button type="button" className="boton boton--enlace" onClick={() => setActivas([])}>Quitar todas</button>
        </section>
      )}

      {obras.length > 0 && !estandar && (
        <section className="campus__obras-bloque" aria-labelledby="campus-obras">
          <h2 id="campus-obras">Obras que más ayudan</h2>
          <p className="campus__bajada">Ordenadas por trayectos que dejan de tener barrera.</p>
          {obras.every((o) => o.trayectos_sin_barrera === 0) && (
            <p className="campus__aviso">Ninguna de las obras de la lista quita barreras para {nombrePerfil}.</p>
          )}
          <ol className="campus__obras">
            {obras.map((o, i) => {
              const on = activas.includes(o.id);
              const IconoTipo = TIPO[o.tipo] ?? Path;
              const beneficiados = PERFILES.filter((p) => o.perfiles_beneficiados?.includes(p.id));
              return (
                <li key={o.id} className="campus__obra">
                  <span className="campus__posicion cifras" aria-hidden="true">{i + 1}</span>
                  <div className="campus__obra-texto">
                    <h3>{o.titulo}</h3>
                    <p className="campus__obra-meta"><IconoTipo weight="bold" aria-hidden="true" /> {o.lugar}</p>
                    <p>
                      {o.trayectos_sin_barrera > 0 ? <strong>{trayectos(o.trayectos_sin_barrera)} sin barrera</strong> : 'No quita barreras para este perfil'}
                      {o.minutos_ahorrados_prom > 0 && <>, {minutos(o.minutos_ahorrados_prom)} min menos en promedio</>}.
                    </p>
                    {beneficiados.length > 0 && (
                      <ul className="campus__beneficiados" aria-label="Perfiles beneficiados">
                        {beneficiados.map((p) => <li key={p.id}><p.Icono weight="bold" aria-hidden="true" /> {p.nombre}</li>)}
                      </ul>
                    )}
                    <p className="campus__obra-meta"><Coins weight="bold" aria-hidden="true" /> Costo {o.costo_relativo}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={on} aria-label={`Simular ${o.titulo.charAt(0).toLowerCase()}${o.titulo.slice(1)}`}
                    className="interruptor campus__simular" onClick={() => alternar(o.id)}>
                    <span className="interruptor__texto" aria-hidden="true">
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

      <section className="campus__supuestos" aria-labelledby="campus-supuestos">
        <h2 id="campus-supuestos">Supuestos</h2>
        <ul>
          <li>Trayecto: ir de una entrada, edificio, sala o baño a otro. La ida y la vuelta cuentan aparte.</li>
          <li>Medimos el campus tal como está construido. Los reportes del momento (un ascensor detenido) no cuentan aquí: se ven en Reportar.</li>
          <li>El costo de cada obra es una estimación relativa del equipo, no un presupuesto.</li>
          <li>El grafo del campus es simulado. Las distancias se estiman sobre el plano de OpenStreetMap y los tiempos se calculan con el modelo de recorrido.</li>
        </ul>
      </section>
    </div>
  );
}

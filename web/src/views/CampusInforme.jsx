import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { useSimulador } from '../hooks/useSimulador.js';
import {
  anuncioSimulacion, estadoZona, etiquetaZona, FRASE_POR_PERFIL, minutos, NOMBRE_PERFIL, PERFILES_MEDIBLES, SUPUESTOS, TEXTO_COSTO,
  trayectos, zonasMejoradas,
} from '../lib/campus.js';
import FormaZona from './campus/FormaZona.jsx';
import IconoObra, { TIPO_TEXTO } from './campus/IconoObra.jsx';
import './CampusInforme.css';

// /campus/informe (Lote 8, ref. 16): "Armar informe" de /campus. Una página A4, en blanco y negro, para imprimir o guardar como PDF.
// Va FUERA del Shell (sin cabecera ni navegación). Lee ?perfil=&obras=. Datos: GET /api/simulador (contrato §7), una consulta por perfil
// medible para la tabla "en cada perfil" (cada obra se mide sola contra el campus de hoy) y una sin obras para saber qué lugares mejoran.
const PERFILES_INFORME = [...PERFILES_MEDIBLES, 'todos'];
const TITULO = 'Propuesta de obras para un campus parejo';
const obrasTexto = (n) => (n === 1 ? '1 obra' : `${n} obras`);
const desvio = (d) => (d?.minutos_extra_prom == null ? null : `${minutos(d.minutos_extra_prom)} min de desvío promedio`);

const fecha = () => new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

export default function CampusInforme() {
  const [params] = useSearchParams();
  const perfil = PERFILES_INFORME.includes(params.get('perfil')) ? params.get('perfil') : 'silla_ruedas';
  const crudo = params.get('obras') ?? '';
  const ids = useMemo(() => [...new Set(crudo.split(',').map((s) => s.trim()).filter(Boolean))], [crudo]);

  const principal = useSimulador(perfil, ids);
  const base = useSimulador(perfil, []);
  const silla = useSimulador('silla_ruedas', ids);
  const movilidad = useSimulador('movilidad_reducida', ids);
  const vision = useSimulador('baja_vision', ids);
  const porPerfil = { silla_ruedas: silla, movilidad_reducida: movilidad, baja_vision: vision };

  useEffect(() => {
    const anterior = document.title;
    document.title = `${TITULO} - parejo`;
    return () => { document.title = anterior; };
  }, []);

  const consultas = [principal, base, silla, movilidad, vision];
  const hayError = consultas.some((c) => c.estado === 'error');
  const cargando = consultas.some((c) => c.estado === 'cargando' && !c.datos);
  const datos = principal.datos;
  const sinObras = ids.length === 0;
  const listo = !sinObras && !hayError && !cargando && datos?.hoy && datos?.con_obras && base.datos?.zonas;

  const elegidas = listo ? ids.map((id) => datos.obras.find((o) => o.id === id)).filter(Boolean) : [];
  const nuevos = listo ? zonasMejoradas(base.datos.zonas, datos.zonas) : new Set();
  const antes = listo ? new Map(base.datos.zonas.map((z) => [z.nodo_id, z])) : new Map();
  const volver = `/campus?perfil=${perfil}`;

  return (
    <div className="informe-pagina">
      <div className="informe__acciones">
        <Link to={volver} className="boton boton--secundario boton--chico"><ArrowLeft weight="bold" aria-hidden="true" /> Volver a Mejorar el campus</Link>
        {listo && (
          <button type="button" className="boton boton--primario boton--chico" onClick={() => window.print()}>
            <Printer weight="bold" aria-hidden="true" /> Imprimir o guardar como PDF
          </button>
        )}
      </div>

      {sinObras && (
        <main className="informe informe--vacio">
          <h1>{TITULO}</h1>
          <p>Aún no elegiste obras. Simula una o más obras en Mejorar el campus y vuelve a tocar “Armar informe”.</p>
          <Link to={volver} className="boton boton--primario">Ir a Mejorar el campus</Link>
        </main>
      )}

      {!sinObras && hayError && (
        <main className="informe informe--vacio" role="alert">
          <h1>{TITULO}</h1>
          <p>No pudimos armar el informe. Revisa que las obras elegidas existan y que el servidor responda.</p>
          <Link to={volver} className="boton boton--primario">Volver a Mejorar el campus</Link>
        </main>
      )}

      {!sinObras && !hayError && !listo && (
        <main className="informe informe--vacio" role="status" aria-busy="true">
          <h1>{TITULO}</h1>
          <p>Armando el informe…</p>
        </main>
      )}

      {listo && (
        <main className={`informe${elegidas.length > 3 ? ' informe--denso' : ''}`}>
          <header className="informe__cab">
            <div>
              <p className="informe__marca">parejo</p>
              <h1>{TITULO}</h1>
            </div>
            <dl className="informe__ficha">
              <dt>Fecha</dt><dd>{fecha()}</dd>
              <dt>Perfil evaluado</dt><dd>{NOMBRE_PERFIL[perfil]}</dd>
              <dt>Campus</dt><dd>Casa Central, Valparaíso</dd>
              <dt>Datos</dt><dd>De ejemplo</dd>
            </dl>
          </header>

          <section className="informe__cifras" aria-labelledby="inf-cifras">
            <h2 id="inf-cifras" className="sr-only">Hoy y con obras</h2>
            <div className="informe__cifra">
              <p className="informe__cifra-t">Hoy</p>
              <p className="informe__cifra-n"><strong>{datos.hoy.trayectos_con_barrera}</strong> de {datos.hoy.trayectos_evaluados}</p>
              <p>trayectos con barrera</p>
              {desvio(datos.hoy) && <p className="informe__chico">{desvio(datos.hoy)}</p>}
            </div>
            <div className="informe__cifra">
              <p className="informe__cifra-t">Con {obrasTexto(elegidas.length)}</p>
              <p className="informe__cifra-n"><strong>{datos.con_obras.trayectos_con_barrera}</strong> de {datos.con_obras.trayectos_evaluados}</p>
              <p>trayectos con barrera</p>
              {desvio(datos.con_obras) && <p className="informe__chico">{desvio(datos.con_obras)}</p>}
            </div>
            <div className="informe__cifra">
              <p className="informe__cifra-t" id="inf-por-perfil">Por perfil, con {obrasTexto(elegidas.length)}</p>
              <ul aria-labelledby="inf-por-perfil">
                {PERFILES.filter((p) => p.id in (datos.con_obras.trayectos_sin_barrera_por_perfil ?? {})).map((p) => (
                  <li key={p.id}><strong>{p.nombre}:</strong> {FRASE_POR_PERFIL[p.id](datos.con_obras.trayectos_sin_barrera_por_perfil[p.id])}</li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="inf-obras">
            <h2 id="inf-obras">Obras propuestas</h2>
            <table className="informe__tabla">
              <caption className="sr-only">Trayectos que dejan de tener barrera en cada perfil, y costo relativo de cada obra.</caption>
              <thead>
                <tr>
                  <th scope="col">Obra</th>
                  {PERFILES_MEDIBLES.map((p) => <th key={p} scope="col" className="informe__num">{NOMBRE_PERFIL[p]}</th>)}
                  <th scope="col">Costo relativo</th>
                </tr>
              </thead>
              <tbody>
                {elegidas.map((o) => (
                  <tr key={o.id}>
                    <th scope="row">
                      <span className="informe__obra">
                        <span className="informe__obra-icono"><IconoObra tipo={o.tipo} /></span>
                        <span>{o.titulo}<span className="informe__chico informe__bloque">{TIPO_TEXTO[o.tipo] ?? o.tipo}, {o.lugar}</span></span>
                      </span>
                    </th>
                    {PERFILES_MEDIBLES.map((p) => {
                      const dato = porPerfil[p].datos?.obras?.find((x) => x.id === o.id);
                      return <td key={p} className="informe__num informe__grande">{dato ? dato.trayectos_sin_barrera : '—'}</td>;
                    })}
                    <td>{TEXTO_COSTO[o.costo_relativo]?.replace('Costo ', '') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="informe__nota">Trayectos que dejan de tener barrera en cada perfil. Cada obra se mide sola contra el campus de hoy.</p>
          </section>

          <section aria-labelledby="inf-lugares">
            <h2 id="inf-lugares">Cómo queda cada lugar para {NOMBRE_PERFIL[perfil].toLowerCase()}</h2>
            <table className="informe__tabla informe__tabla--lugares">
              <caption className="sr-only">Estado de cada lugar hoy y con las obras propuestas, para {NOMBRE_PERFIL[perfil]}.</caption>
              <thead>
                <tr>
                  <th scope="col">Lugar</th>
                  <th scope="col">Hoy</th>
                  <th scope="col">Con las obras</th>
                </tr>
              </thead>
              <tbody>
                {datos.zonas.map((z) => {
                  const previa = antes.get(z.nodo_id) ?? z;
                  return (
                    <tr key={z.nodo_id}>
                      <th scope="row">{z.nombre}</th>
                      <td><EstadoLugar zona={previa} perfil={perfil} /></td>
                      <td><EstadoLugar zona={z} perfil={perfil} nuevo={nuevos.has(z.nodo_id)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="informe__leyenda">
              <li><FormaZona estado="accesible" tamano={18} /> Círculo con check: accesible</li>
              <li><FormaZona estado="desvio" mas="N" tamano={26} /> Rombo con minutos: se llega con desvío</li>
              <li><FormaZona estado="con_barrera" tamano={18} /> Cuadrado tachado: con barrera, con el número de trayectos</li>
              <li><span className="informe__nuevo">Nuevo</span> El lugar mejora con las obras</li>
            </ul>
            <p className="informe__resumen">
              {anuncioSimulacion(elegidas, datos.hoy, datos.con_obras, perfil)}{' '}
              {nuevos.size > 0 ? `${nuevos.size} de ${datos.zonas.length} lugares mejoran. ` : 'Ningún lugar cambia de estado. '}
              {`Quedan ${trayectos(datos.con_obras.trayectos_con_barrera)} con barrera.`}
            </p>
          </section>

          <section aria-labelledby="inf-sup">
            <h2 id="inf-sup">Supuestos</h2>
            <ul className="informe__supuestos">
              {SUPUESTOS.map((s) => <li key={s}>{s}</li>)}
              <li>Las obras se miden contra el mapa accesible de Casa Central; la ubicación de cada obra en el plano de /campus es aproximada.</li>
            </ul>
          </section>

          <footer className="informe__pie">
            <span>Prototipo estudiantil. No es un servicio oficial de la USM.</span>
            <span>parejo, Hackathon USM 2026</span>
          </footer>
        </main>
      )}
    </div>
  );
}

// Forma + texto del estado de un lugar. Nunca solo la forma o solo el color.
function EstadoLugar({ zona, perfil, nuevo = false }) {
  const estado = zona.estado ?? estadoZona(zona);
  const mas = Math.max(1, Math.round(zona.minutos_extra ?? 0));
  return (
    <span className="informe__estado">
      <FormaZona estado={estado} mas={mas} tamano={estado === 'desvio' ? 26 : 20} />
      <span>{etiquetaZona(zona, perfil)}</span>
      {nuevo && <span className="informe__nuevo">Nuevo</span>}
    </span>
  );
}

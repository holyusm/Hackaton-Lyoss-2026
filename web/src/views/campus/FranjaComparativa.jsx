import { Printer, Prohibit } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PERFILES } from '../../components/GrupoPerfiles.jsx';
import { FRASE_POR_PERFIL, minutos, trayectos } from '../../lib/campus.js';

const obras = (n) => (n === 1 ? '1 obra' : `${n} obras`);
const desvio = (d) => (d?.minutos_extra_prom == null ? null : `${minutos(d.minutos_extra_prom)} min de desvío`);

// Franja "Con las obras simuladas" (README del Lote 8 §3): Hoy | Con N obras | Por perfil. Sin flechas ni barras.
// La cifra de "Con N obras" va en Paso si llega a 0, en Pacífico si bajó y en Alto si no cambió.
export default function FranjaComparativa({ hoy, con, cantidad, quedan, onQuitar, informeHref, ocupada }) {
  const tono = con.trayectos_con_barrera === 0 ? 'paso' : con.trayectos_con_barrera < hoy.trayectos_con_barrera ? 'baja' : 'igual';
  const porPerfil = PERFILES.filter((p) => con.trayectos_sin_barrera_por_perfil && p.id in con.trayectos_sin_barrera_por_perfil);
  return (
    <section className="campus__franja" aria-labelledby="campus-franja-t" aria-busy={ocupada || undefined}>
      <h2 id="campus-franja-t">Con las obras simuladas</h2>
      <div className="campus__franja-bloques">
        <div className="campus__bloque">
          <p className="campus__bloque-titulo">Hoy</p>
          <p className="campus__bloque-cifra campus__bloque-cifra--igual"><span className="cifras">{hoy.trayectos_con_barrera}</span> con barrera</p>
          {desvio(hoy) && <p className="campus__bloque-desvio">{desvio(hoy)}</p>}
        </div>
        <div className="campus__bloque">
          <p className="campus__bloque-titulo">Con {obras(cantidad)}</p>
          <p className={`campus__bloque-cifra campus__bloque-cifra--${tono}`}><span className="cifras">{con.trayectos_con_barrera}</span> con barrera</p>
          {desvio(con) && <p className="campus__bloque-desvio">{desvio(con)}</p>}
        </div>
        {porPerfil.length > 0 && (
          <div className="campus__bloque campus__bloque--perfiles">
            <p className="campus__bloque-titulo" id="campus-por-perfil">Por perfil, con {obras(cantidad)}</p>
            <ul aria-labelledby="campus-por-perfil" className="campus__por-perfil">
              {porPerfil.map((p) => (
                <li key={p.id}>
                  <p.Icono weight="bold" aria-hidden="true" />
                  <span><strong>{p.nombre}:</strong> {FRASE_POR_PERFIL[p.id](con.trayectos_sin_barrera_por_perfil[p.id])}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {quedan && (
        <p className="campus__quedan">
          <Prohibit weight="bold" aria-hidden="true" />
          Aún quedan {trayectos(con.trayectos_con_barrera)} con barrera: necesitan obras que no están en la lista.
        </p>
      )}
      <div className="campus__franja-acciones">
        <button type="button" className="boton boton--enlace" onClick={onQuitar}>Quitar todas</button>
        {informeHref && (
          <Link to={informeHref} className="boton boton--primario boton--chico"><Printer weight="bold" aria-hidden="true" /> Armar informe</Link>
        )}
      </div>
    </section>
  );
}

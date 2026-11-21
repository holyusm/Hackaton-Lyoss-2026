import { estadoZona, etiquetaZona, minutos, NOMBRE_PERFIL } from '../../lib/campus.js';
import FormaZona from './FormaZona.jsx';

// "Ver como lista": el plano como tabla (README del Lote 8 §4). Misma información que el plano, con la forma del estado
// al lado del texto, y "(nuevo)" cuando el lugar mejoró con las obras simuladas.
export default function TablaZonas({ zonas, perfil, nuevos }) {
  return (
    <div className="campus__tabla-caja" role="region" aria-labelledby="campus-zonas" tabIndex={0}>
      <table className="campus__tabla">
        <caption>Trayectos que llegan a cada lugar, para {NOMBRE_PERFIL[perfil] ?? perfil}.</caption>
        <thead>
          <tr>
            <th scope="col">Lugar</th>
            <th scope="col" className="campus__tabla-num">Trayectos con barrera que llegan</th>
            <th scope="col" className="campus__tabla-num">Desvío promedio</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {zonas.map((z) => {
            const estado = z.estado ?? estadoZona(z);
            const mas = Math.max(1, Math.round(z.minutos_extra ?? 0));
            return (
              <tr key={z.nodo_id}>
                <th scope="row">{z.nombre}</th>
                <td className="campus__tabla-num cifras">{z.trayectos_con_barrera}</td>
                <td className="campus__tabla-num">
                  {z.minutos_extra == null
                    ? <><span aria-hidden="true">—</span><span className="sr-only">sin dato</span></>
                    : `${minutos(z.minutos_extra)} min`}
                </td>
                <td>
                  <span className={`campus__estado campus__estado--${estado}`}>
                    <FormaZona estado={estado} mas={mas} tamano={28} />
                    <span>{etiquetaZona(z, perfil)}{nuevos?.has(z.nodo_id) && ' (nuevo)'}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

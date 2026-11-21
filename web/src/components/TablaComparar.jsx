import { Prohibit } from '@phosphor-icons/react';
import { PERFILES } from './GrupoPerfiles.jsx';
import './TablaComparar.css';

export const fmtMetros = (n) => Math.round(n).toLocaleString('es-CL');
export const fmtMinutos = (n) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Tabla de escritorio (Lote 3, A3). La fila elegida se marca con aria-pressed en su botón;
// el CSS pinta la fila entera con :has(), sin clases de estado.
export default function TablaComparar({ filas, seleccion, onElegir, motivo }) {
  return (
    <div className="tabla-comparar__caja">
      <table className="tabla-comparar">
        <caption>Mismo trayecto para cada perfil. Elige una fila para resaltar su ruta en el mapa. Datos de ejemplo.</caption>
        <thead>
          <tr>
            <th scope="col">Perfil</th>
            <th scope="col" className="tabla-comparar__num">Metros</th>
            <th scope="col" className="tabla-comparar__num">Minutos</th>
            <th scope="col" className="tabla-comparar__num">Escalones</th>
            <th scope="col">Pasa por</th>
            <th scope="col">Advertencias</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const p = PERFILES.find((x) => x.id === f.id);
            return (
              <tr key={f.id}>
                <th scope="row">
                  <button type="button" className="chip-perfil" aria-pressed={seleccion === f.id} onClick={() => onElegir(f.id)}>
                    <span className="perfil__icono"><p.Icono weight="bold" aria-hidden="true" /></span>
                    {p.nombre}
                  </button>
                </th>
                {f.ok ? (
                  <>
                    <Cifra valor={fmtMetros(f.metros)} dif={f.difMetros} />
                    <Cifra valor={fmtMinutos(f.minutos)} dif={f.difMinutos} />
                    <Cifra valor={f.escalones} dif={f.notaEscalones} buena={f.escalones === 0} />
                    <td>{f.pasaPor || 'Camino directo'}</td>
                    <td>{f.advertencias.length ? f.advertencias.join('. ') + '.' : 'Sin advertencias'}</td>
                  </>
                ) : (
                  <td colSpan={5} className="tabla-comparar__sin-ruta">
                    <p className="tabla-comparar__sin-ruta-titulo"><Prohibit weight="bold" aria-hidden="true" /> Sin ruta accesible</p>
                    <p>{motivo}</p>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cifra({ valor, dif, buena }) {
  return (
    <td className="tabla-comparar__num">
      <span className={buena ? 'tabla-comparar__cifra metrica--buena' : 'tabla-comparar__cifra'}>{valor}</span>
      <span className="tabla-comparar__dif">{dif}</span>
    </td>
  );
}

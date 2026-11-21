import { useId } from 'react';
import { CaretDown, Prohibit } from '@phosphor-icons/react';
import { PERFILES } from './GrupoPerfiles.jsx';
import { fmtMetros, fmtMinutos } from './TablaComparar.jsx';

// Tarjeta móvil de un perfil (Lote 3, A4). Abrirla también resalta su ruta en el mapa.
export default function FilaPerfilMovil({ fila: f, abierta, onAlternar }) {
  const panel = useId();
  const p = PERFILES.find((x) => x.id === f.id);
  const dif = (d) => (d && d !== 'Base' ? `, ${d.replace(/ (m|min)$/, '')}` : d === 'Base' ? ', base' : '');
  return (
    <li className="fila-perfil">
      <button type="button" className="fila-perfil__boton" aria-expanded={abierta} aria-controls={abierta ? panel : undefined} onClick={onAlternar}>
        <span className="fila-perfil__cabeza">
          <span className="perfil__icono"><p.Icono weight="bold" aria-hidden="true" /></span>
          <span className="fila-perfil__nombre">{p.nombre}</span>
          <CaretDown weight="bold" className="fila-perfil__caret" aria-hidden="true" />
        </span>
        {f.ok ? (
          <span className="fila-perfil__cifras">
            <span><strong>{fmtMetros(f.metros)}</strong> metros{dif(f.difMetros)}</span>
            <span><strong>{fmtMinutos(f.minutos)}</strong> min{dif(f.difMinutos)}</span>
            <span><strong className={f.escalones === 0 ? 'metrica--buena' : ''}>{f.escalones}</strong> escalones</span>
          </span>
        ) : (
          <span className="fila-perfil__sin-ruta"><Prohibit weight="bold" aria-hidden="true" /> Sin ruta accesible</span>
        )}
      </button>
      {abierta && (
        <div id={panel} className="fila-perfil__panel">
          {f.ok ? (
            <>
              <p className="fila-perfil__titulo">Pasa por</p>
              <p>{f.pasaPor || 'Camino directo'}</p>
              <p className="fila-perfil__titulo">Advertencias</p>
              <p>{f.advertencias.length ? f.advertencias.join('. ') + '.' : 'Sin advertencias'}</p>
              <p className="fila-perfil__nota">Su ruta está resaltada en el mapa.</p>
            </>
          ) : <p>{f.motivo}</p>}
        </div>
      )}
    </li>
  );
}

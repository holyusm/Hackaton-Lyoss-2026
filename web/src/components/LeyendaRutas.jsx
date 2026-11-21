import { PERFILES } from './GrupoPerfiles.jsx';

// Leyenda del mapa de /comparar: la diferencia se dice en texto y se muestra con el mismo trazo que el mapa.
const TRAZO = {
  estandar: { texto: 'línea fina', ancho: 3, color: 'var(--tinta)' },
  silla_ruedas: { texto: 'línea gruesa continua', ancho: 6, color: 'var(--cobalto)' },
  movilidad_reducida: { texto: 'línea discontinua', ancho: 5, color: 'var(--cobalto)', guiones: '12 8' },
  baja_vision: { texto: 'línea de puntos', ancho: 6, color: 'var(--paso)', guiones: '0.1 11' },
};

export default function LeyendaRutas({ filas }) {
  return (
    <ul className="leyenda-rutas" aria-label="Leyenda de rutas">
      {PERFILES.map((p) => {
        const fila = filas.find((f) => f.id === p.id);
        const t = TRAZO[p.id];
        const tiene = fila?.ok;
        return (
          <li key={p.id}>
            {tiene ? (
              <svg className="leyenda-rutas__muestra" viewBox="0 0 44 12" aria-hidden="true">
                <line x1="3" y1="6" x2="41" y2="6" stroke={t.color} strokeWidth={t.ancho} strokeDasharray={t.guiones} />
              </svg>
            ) : <span className="leyenda-rutas__muestra" aria-hidden="true" style={{ width: 44 }} />}
            <p.Icono weight="bold" className="leyenda-rutas__icono" aria-hidden="true" />
            <span><strong>{p.nombre}</strong>, {tiene ? t.texto : 'sin ruta hoy'}</span>
          </li>
        );
      })}
    </ul>
  );
}

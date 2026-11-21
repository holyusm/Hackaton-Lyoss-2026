import { Door, Elevator, Info, PersonSimpleWalk, Stairs, TrendUp, Umbrella } from '@phosphor-icons/react';

// Piezas de contenido de la ruta, compartidas por la hoja del mapa y la vista lista (Lote 2).

const ICONOS = { TrendUp, Umbrella, Elevator, Door, PersonSimpleWalk, Stairs };
const ETIQUETA = { TrendUp: 'Rampa', Umbrella: 'Tramo techado', Elevator: 'Ascensor', Door: 'Sala', Stairs: 'Escalera', PersonSimpleWalk: 'Camino' };

export const coma = (n) => String(n).replace('.', ',');

// Línea de metro (componentes.md, ListaPasos). Los pasos desde el tercero llevan paso--resto: la hoja en vista
// media muestra solo los dos primeros.
export function ListaPasos({ pasos }) {
  return (
    <ol className="pasos">
      {pasos.map((p, i) => {
        const Icono = ICONOS[p.icono] ?? PersonSimpleWalk;
        return (
          <li key={`${i}-${p.nodo}`} className={i >= 2 ? 'paso paso--resto' : 'paso'}>
            <span className="paso__numero"><span className="sr-only">Paso {i + 1} de {pasos.length}: </span><span aria-hidden="true">{i + 1}</span></span>
            <div className="paso__texto">
              <span className="paso__instruccion">{p.instruccion}</span>
              <span className="paso__detalle">{p.detalle}</span>
            </div>
            <span className="paso__tramo"><Icono weight="bold" role="img" aria-label={ETIQUETA[p.icono] ?? 'Camino'} /></span>
          </li>
        );
      })}
    </ol>
  );
}

// Cifra antes que etiqueta en el DOM; column-reverse las ordena (componentes.md, MetricasRuta).
export function MetricasRuta({ ruta, compactas = false }) {
  return (
    <dl className={compactas ? 'metricas metricas--compactas' : 'metricas'}>
      <div className="metrica"><dd>{coma(Math.round(ruta.metros))}</dd><dt>metros</dt></div>
      <div className="metrica"><dd>{coma(ruta.minutos)}</dd><dt>minutos</dt></div>
      <div className={ruta.escalones === 0 ? 'metrica metrica--buena' : 'metrica'}><dd>{ruta.escalones}</dd><dt>{ruta.escalones === 1 ? 'escalón' : 'escalones'}</dt></div>
    </dl>
  );
}

export function Advertencias({ advertencias }) {
  if (!advertencias.length) return null;
  return (
    <section className="ruta-advertencias" aria-labelledby="ruta-advertencias">
      <h3 id="ruta-advertencias" className="ruta-subtitulo">Ten en cuenta</h3>
      <ul>
        {advertencias.map((a) => (
          <li key={a}><Info weight="bold" aria-hidden="true" /><span>{a}</span></li>
        ))}
      </ul>
    </section>
  );
}

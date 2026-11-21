import { CaretDown, CaretUp, Stack } from '@phosphor-icons/react';

// Panel "Capas" de /plano (Lote 10 v2): botón plegable, 4 casillas con su muestra de línea,
// la leyenda de servicios y "Estás aquí". Sin overflow, para no recortar el anillo de foco.
const CAPAS = [
  { id: 'senderos', texto: 'Senderos' },
  { id: 'escaleras', texto: 'Escaleras' },
  { id: 'servicios', texto: 'Servicios' },
  { id: 'calles', texto: 'Nombres de calles' },
];
const SERVICIOS = [
  ['P', 'Estacionamiento'], ['C', 'Casino'], ['B', 'Bicicletas'], ['S', 'Centro estudiantil'],
  ['R', 'Estudio'], ['$', 'Cajero'], ['I', 'Investigación'],
];

export default function PanelCapas({ abierto, onAlternar, capas, onCambiar, movil = false }) {
  return (
    <div className={`plano-panelcapas${movil ? ' plano-panelcapas--movil' : ''}`}>
      <button type="button" className="plano-panelcapas__boton" aria-expanded={abierto} aria-controls="plano-capas-cuerpo" onClick={onAlternar}>
        <Stack weight="bold" aria-hidden="true" />
        <span>Capas</span>
        {abierto ? <CaretUp weight="bold" aria-hidden="true" /> : <CaretDown weight="bold" aria-hidden="true" />}
      </button>
      <div id="plano-capas-cuerpo" hidden={!abierto} className="plano-panelcapas__cuerpo">
        <fieldset className="plano-panelcapas__casillas">
          <legend className="sr-only">Capas del plano</legend>
          {CAPAS.map((c) => (
            <label key={c.id} className="plano-capa">
              <input type="checkbox" checked={capas[c.id]} onChange={(e) => onCambiar({ ...capas, [c.id]: e.target.checked })} />
              <span className={`plano-muestra plano-muestra--${c.id}`} aria-hidden="true" />
              {c.texto}
            </label>
          ))}
        </fieldset>
        <p className="plano-panelcapas__titulo" id="plano-capas-servicios">Servicios</p>
        <ul className="plano-panelcapas__servicios" aria-labelledby="plano-capas-servicios">
          {SERVICIOS.map(([l, n]) => (
            <li key={n}><span className="plano-servicio-letra" aria-hidden="true">{l}</span>{n}</li>
          ))}
        </ul>
        <p className="plano-panelcapas__aqui"><span className="plano-aqui__punto plano-aqui__punto--chico" aria-hidden="true" />Estás aquí, punto simulado</p>
        <p className="plano-panelcapas__nota">Los edificios H, O, J, I, N, F2 y P2 aún no están en OpenStreetMap y no se dibujan.</p>
      </div>
    </div>
  );
}

import { Elevator, SquaresFour, TrendUp, Umbrella } from '@phosphor-icons/react';

// Pictograma de cada tipo de obra (datos-ejemplo.json, pictogramas_obra). La guía podotáctil es un SVG propio de tres barras.
function Barras(props) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="64" y="40" width="28" height="176" rx="8" />
      <rect x="114" y="40" width="28" height="176" rx="8" />
      <rect x="164" y="40" width="28" height="176" rx="8" />
    </svg>
  );
}

const ICONOS = { rampa: TrendUp, ascensor: Elevator, superficie: SquaresFour, guia_tactil: Barras, techado: Umbrella };

export const TIPO_TEXTO = {
  rampa: 'Rampa',
  ascensor: 'Plataforma elevadora',
  superficie: 'Superficie',
  guia_tactil: 'Guía podotáctil',
  techado: 'Techado',
};

export default function IconoObra({ tipo, ...props }) {
  const Icono = ICONOS[tipo] ?? SquaresFour;
  return <Icono weight="bold" aria-hidden="true" {...props} />;
}

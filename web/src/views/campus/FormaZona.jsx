import { Check, Prohibit } from '@phosphor-icons/react';

// Forma de un lugar según su estado (README del Lote 8): círculo con check = accesible, rombo con "+N" = con desvío,
// cuadrado redondeado tachado = con barrera. La forma distingue el estado aunque no se vea el color.
// Es un SVG para que sirva igual en el plano (divIcon de Leaflet), en la leyenda y en la tabla; el color va por clase (CSS), no por atributo.
export default function FormaZona({ estado, mas, tamano }) {
  return (
    <svg
      className={`forma-zona forma-zona--${estado}`} viewBox="0 0 44 44" width={tamano} height={tamano}
      aria-hidden="true" focusable="false"
    >
      {estado === 'accesible' && <circle className="forma-zona__fondo" cx="22" cy="22" r="20" />}
      {estado === 'desvio' && <polygon className="forma-zona__fondo" points="22,1.5 42.5,22 22,42.5 1.5,22" />}
      {estado === 'con_barrera' && <rect className="forma-zona__fondo" x="2" y="2" width="40" height="40" rx="11" />}
      {estado === 'accesible' && <Check className="forma-zona__glifo" x="10" y="10" width="24" height="24" weight="bold" />}
      {estado === 'con_barrera' && <Prohibit className="forma-zona__glifo" x="10" y="10" width="24" height="24" weight="bold" />}
      {estado === 'desvio' && <text className="forma-zona__mas" x="22" y="23" textAnchor="middle" dominantBaseline="central">+{mas}</text>}
    </svg>
  );
}

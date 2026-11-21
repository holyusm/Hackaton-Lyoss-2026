import { MetricasRuta } from './PasosRuta.jsx';

// Cabecera de la hoja: destino, perfil, origen y métricas. `nivel` es 'h1' por defecto: es el título de la vista (hoja y lista).
// El chip de perfil todavía no abre el cambio de perfil (PR C): hasta entonces es solo texto, no un botón muerto.
export default function ResumenRuta({ ruta, origen, destino, perfil, nivel = 'h1', compactas = true }) {
  const Titulo = nivel;
  const { Icono } = perfil;
  return (
    <div className="ruta-resumen">
      <Titulo id="ruta-titulo" className="ruta-resumen__titulo">Hacia {destino.nombre}</Titulo>
      <p className="ruta-resumen__perfil">
        <span className="chip-perfil chip-perfil--solo">
          <Icono weight="bold" aria-hidden="true" />
          <span><span className="sr-only">Perfil: </span>{perfil.nombre}</span>
        </span>
        <span>Desde {origen.nombre}</span>
      </p>
      <MetricasRuta ruta={ruta} compactas={compactas} />
    </div>
  );
}

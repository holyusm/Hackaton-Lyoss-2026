import './Estados.css';

// Bloque gris con la forma del contenido que viene (Lote 7). Siempre aria-hidden: lo anuncia <Cargando>.
export function Bloque({ ancho = '100%', alto = 16, suave = false, redondo = false, className = '', style }) {
  const clase = ['esqueleto', suave && 'esqueleto--suave', redondo && 'esqueleto--redondo', className].filter(Boolean).join(' ');
  return <span className={clase} aria-hidden="true" style={{ width: ancho, height: alto, ...style }} />;
}

// Contenedor de una carga: aria-busy y un texto oculto con role="status" ("Calculando tu ruta.").
export function Cargando({ anuncio, children, className = '', as: Etiqueta = 'div', ...resto }) {
  return (
    <Etiqueta className={`cargando ${className}`} aria-busy="true" {...resto}>
      <p className="sr-only" role="status">{anuncio}</p>
      {children}
    </Etiqueta>
  );
}

// Tarjeta esqueleto: una línea fuerte y otras suaves dentro de un panel.
export function TarjetaEsqueleto({ lineas = 2, icono = false, className = '' }) {
  return (
    <div className={`esqueleto-tarjeta ${className}`} aria-hidden="true">
      {icono && <Bloque ancho={40} alto={40} className="esqueleto-tarjeta__icono" />}
      <div className="esqueleto-tarjeta__lineas">
        <Bloque ancho="55%" alto={14} />
        {Array.from({ length: lineas - 1 }, (_, i) => <Bloque key={i} ancho={i % 2 ? '60%' : '85%'} alto={10} suave />)}
      </div>
    </div>
  );
}

// Contorno punteado de los edificios (sin relleno) mientras carga el plano.
export function PlanoEsqueleto({ className = '' }) {
  return (
    <div className={`esqueleto-plano ${className}`} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

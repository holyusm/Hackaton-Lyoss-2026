import { Component } from 'react';

// Límite de error pequeño para el mapa: si Leaflet lanza al renderizar o en un efecto, se muestra un aviso con salidas
// en vez de desmontar toda la app. Los errores de ResizeObserver (fuera de React) no pasan por aquí; se evitan en MapaRuta.
export default class LimiteError extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() { return { fallo: true }; }

  componentDidCatch(error) { console.error('Falla del mapa', error); }

  render() {
    if (!this.state.fallo) return this.props.children;
    const { onVerLista } = this.props;
    return (
      <div className="mapa-estado" role="alert">
        <h2>No pudimos mostrar el mapa</h2>
        {onVerLista && <p>Puedes seguir tu ruta paso a paso en la lista.</p>}
        {onVerLista && <button type="button" className="boton boton--primario" onClick={onVerLista}>Ver como lista</button>}
        <button type="button" className="boton" onClick={() => window.location.reload()}>Volver a cargar</button>
      </div>
    );
  }
}

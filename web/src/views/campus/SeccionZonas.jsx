import { useState } from 'react';
import { ListBullets, MapTrifold } from '@phosphor-icons/react';
import MapaZonas, { LeyendaZonas } from './MapaZonas.jsx';
import TablaZonas from './TablaZonas.jsx';

// "Cómo se llega a cada lugar": plano con los lugares y las obras, o la misma información como tabla (botón "Ver como lista").
export default function SeccionZonas({ zonas, obras, activas, perfil, nuevos, recientes, seleccionada, onElegirObra, ocupada, compacto = false, sinLeyenda = false }) {
  const [lista, setLista] = useState(false);
  return (
    <section className="campus__zonas" aria-labelledby="campus-zonas" aria-busy={ocupada || undefined}>
      <div className="campus__zonas-cab">
        <h2 id="campus-zonas">Cómo se llega a cada lugar</h2>
        <button type="button" className="boton-pastilla campus__ver-lista" aria-pressed={lista} onClick={() => setLista((v) => !v)}>
          <ListBullets weight="bold" aria-hidden="true" /> Ver como lista
        </button>
      </div>
      {lista ? (
        <TablaZonas zonas={zonas} perfil={perfil} nuevos={nuevos} />
      ) : (
        <div className="campus__plano-caja">
          <MapaZonas
            zonas={zonas} obras={obras} activas={activas} perfil={perfil} recientes={recientes}
            seleccionada={seleccionada} onElegirObra={onElegirObra} compacto={compacto}
          />
          {!sinLeyenda && <LeyendaZonas compacto={compacto} />}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import CampoLugar from '../components/CampoLugar.jsx';
import TablaComparar from '../components/TablaComparar.jsx';
import FilaPerfilMovil from '../components/FilaPerfilMovil.jsx';
import MapaComparar from '../components/MapaComparar.jsx';
import LeyendaRutas from '../components/LeyendaRutas.jsx';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { conArticulo } from '../../../motor/ruta.js';
import { iconoLugar } from '../components/iconoLugar.js';
import { useComparacion } from '../hooks/useComparacion.js';
import '../components/TablaComparar.css';
import './Comparar.css';

// /comparar (Lote 3): el mismo trayecto para los 4 perfiles. El mapa con las 4 rutas llega en el PR B.
export default function Comparar() {
  const c = useComparacion();
  const [editando, setEditando] = useState(false);
  const silla = c.filas.find((f) => f.id === 'silla_ruedas');
  const sillaSinRuta = silla && !silla.ok;

  // Selección compartida por tabla, tarjetas y (luego) mapa: silla por defecto, o "todas" si no tiene ruta.
  const [seleccion, setSeleccion] = useState('silla_ruedas');
  useEffect(() => { if (sillaSinRuta) setSeleccion('todas'); }, [sillaSinRuta]);
  const elegir = (id) => setSeleccion((s) => (s === id ? 'todas' : id));

  const nombreDesde = c.origen?.nombre ?? c.desde;
  const nombreHasta = c.destino?.nombre ?? c.hasta;
  const IconoHasta = iconoLugar(c.destino);
  const elegido = PERFILES.find((p) => p.id === seleccion);
  const descripcion = c.origen && c.destino
    ? `Plano de Casa Central desde ${conArticulo(c.origen)} hasta ${conArticulo(c.destino)}, ${elegido
      ? `resaltando la ruta ${elegido.textoBoton || 'estándar'}` : 'con las rutas de cada perfil'}.${sillaSinRuta ? ` ${motivo} No hay ruta en silla de ruedas.` : ''}`
    : 'Plano de Casa Central';

  return (
    <div className="comparar">
      <div className="comparar__cabeza">
        <h1>Comparar perfiles</h1>
        <div className="comparar__trayecto">
          <button type="button" className="comparar__lugar comparar__lugar--escritorio" aria-label={`Desde: ${nombreDesde}. Cambiar`} aria-expanded={editando} onClick={() => setEditando(!editando)}>
            <MapPin weight="bold" aria-hidden="true" /> Desde <strong>{nombreDesde}</strong>
          </button>
          <button type="button" className="comparar__lugar comparar__lugar--escritorio" aria-label={`Hasta: ${nombreHasta}. Cambiar`} aria-expanded={editando} onClick={() => setEditando(!editando)}>
            <IconoHasta weight="bold" aria-hidden="true" /> Hasta <strong>{nombreHasta}</strong>
          </button>
          <button type="button" className="comparar__lugar comparar__lugar--movil" aria-label={`Trayecto: desde ${nombreDesde} hasta ${nombreHasta}. Cambiar`} aria-expanded={editando} onClick={() => setEditando(!editando)}>
            <MapPin weight="bold" aria-hidden="true" />
            <span><strong>{nombreDesde}</strong> hasta <strong>{nombreHasta}</strong></span>
            <span className="comparar__cambiar">Cambiar</span>
          </button>
        </div>
      </div>

      {editando && (
        <div className="comparar__editar">
          <CampoLugar etiqueta="Desde" Icono={MapPin} lugares={c.lugares} valor={c.desde} onCambiar={(id) => c.cambiar('desde', id)} />
          <CampoLugar etiqueta="Hasta" Icono={MagnifyingGlass} lugares={c.lugares} valor={c.hasta} onCambiar={(id) => c.cambiar('hasta', id)} />
        </div>
      )}

      {/* La frase cambia sola cuando un perfil queda sin ruta: se anuncia sin mover el foco. */}
      <div className="comparar__vivo" aria-live="polite">
        {c.estado === 'cargando' && <p>Calculando las rutas…</p>}
        {c.estado === 'error' && <><p>No pudimos verificar las rutas actuales.</p><button type="button" onClick={c.reintentar}>Reintentar</button></>}
        {c.frase && <h2 className="comparar__frase">{c.frase}</h2>}
      </div>

      {c.filas.length > 0 && c.grafo && (
        <div className="comparar__mapa">
          <MapaComparar grafo={c.grafo} filas={c.filas} seleccion={seleccion} barreras={c.barreras}
            origen={c.origen} destino={c.destino} descripcion={descripcion} />
          <LeyendaRutas filas={c.filas} />
        </div>
      )}

      {c.filas.length > 0 && (
        <>
          <div className="comparar__tabla">
            <TablaComparar filas={c.filas} seleccion={seleccion} onElegir={elegir} />
          </div>
          <ul className="comparar__tarjetas">
            {c.filas.map((f) => (
              <FilaPerfilMovil key={f.id} fila={f} abierta={seleccion === f.id} onAlternar={() => elegir(f.id)} />
            ))}
          </ul>
        </>
      )}

      <p className="comparar__pie">Las diferencias se calculan frente al perfil Estándar.</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import CampoLugar from '../components/CampoLugar.jsx';
import TablaComparar from '../components/TablaComparar.jsx';
import FilaPerfilMovil from '../components/FilaPerfilMovil.jsx';
import { iconoLugar } from '../components/iconoLugar.js';
import { motivoSinRuta } from '../lib/comparar.js';
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

  const motivo = sillaSinRuta ? motivoSinRuta(c.barreras, c.grafo, { motivo: silla.motivo }) : '';
  const nombreDesde = c.origen?.nombre ?? c.desde;
  const nombreHasta = c.destino?.nombre ?? c.hasta;
  const IconoHasta = iconoLugar(c.destino);

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
      <div aria-live="polite">
        {c.estado === 'cargando' && <p>Calculando las rutas…</p>}
        {c.estado === 'error' && <p>No pudimos calcular las rutas. Intenta de nuevo en unos segundos.</p>}
        {c.frase && <h2 className="comparar__frase">{c.frase}</h2>}
      </div>

      {c.filas.length > 0 && (
        <>
          <div className="comparar__tabla">
            <TablaComparar filas={c.filas} seleccion={seleccion} onElegir={elegir} motivo={motivo} />
          </div>
          <ul className="comparar__tarjetas">
            {c.filas.map((f) => (
              <FilaPerfilMovil key={f.id} fila={f} abierta={seleccion === f.id} onAlternar={() => elegir(f.id)} motivo={motivo} />
            ))}
          </ul>
        </>
      )}

      <p className="comparar__pie">Las diferencias se calculan frente al perfil Estándar.</p>
    </div>
  );
}

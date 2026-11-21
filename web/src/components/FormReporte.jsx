import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Flag, MapPin, Prohibit, Warning } from '@phosphor-icons/react';
import CampoLugar from './CampoLugar.jsx';
import OpcionesTipo from './OpcionesTipo.jsx';
import SegmentadoDuracion from './SegmentadoDuracion.jsx';
import { DURACION_INICIAL, MAX_DETALLE, cuerpoReporte, validarReporte } from '../lib/reportes.js';

const VACIO = { tipo: null, lugar: null, detalle: '', duracion: DURACION_INICIAL };
const TEXTO_429 = 'Espera unos minutos y vuelve a intentar. Tu reporte sigue escrito.';

// Formulario de /reportar. Estados: editando | enviando | enviado | limite.
// `onEnviado(reporte)` avisa a la vista para que ponga la barrera nueva primera en la lista.
export default function FormReporte({ lugares, grafo, urlMapa, onEnviado }) {
  const id = useId();
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [resumen, setResumen] = useState(false);
  const [estado, setEstado] = useState('editando');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(null);
  const refResumen = useRef(null);
  const refAviso = useRef(null);
  const refLugar = useRef(null);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => { if (!e[campo]) return e; const { [campo]: _, ...resto } = e; return resto; });
    if (estado === 'limite') setEstado('editando');
  };

  useEffect(() => { if (resumen) refResumen.current?.focus(); }, [resumen]);
  useEffect(() => { if (estado === 'enviado') refAviso.current?.focus(); }, [estado]);

  const faltan = Object.keys(errores);
  // Con todos los errores corregidos el resumen se retira solo.
  const mostrarResumen = resumen && faltan.length > 0;

  const enviar = async (e) => {
    e.preventDefault();
    if (estado === 'enviando') return;
    const nuevos = validarReporte(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) { setResumen(true); return; }
    setResumen(false);
    setEstado('enviando');
    try {
      const r = await fetch('/api/reportes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpoReporte(form, grafo)),
      });
      if (r.status === 429) { setMensaje(TEXTO_429); setEstado('limite'); return; }
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}));
        setMensaje(`${cuerpo.error ?? 'No pudimos enviar el reporte.'} Tu reporte sigue escrito.`);
        setEstado('limite');
        return;
      }
      const reporte = await r.json();
      setEnviado({ reporte, lugar: grafo?.nodos.find((n) => n.id === form.lugar)?.nombre ?? 'ese lugar' });
      onEnviado?.(reporte);
      setEstado('enviado');
    } catch {
      setMensaje('No pudimos conectar con el servidor. Tu reporte sigue escrito.');
      setEstado('limite');
    }
  };

  const irA = (campo) => (ev) => {
    ev.preventDefault();
    if (campo === 'tipo') document.getElementById('campo-tipo-grupo')?.querySelector('[tabindex="0"]')?.focus();
    else refLugar.current?.querySelector('input')?.focus();
  };

  if (estado === 'enviado') {
    return (
      <div className="reporte-enviado">
        <div className="reporte-enviado__aviso" role="status" aria-live="polite" tabIndex={-1} ref={refAviso}>
          <span className="reporte-enviado__check"><Check weight="bold" aria-hidden="true" /></span>
          <p><strong>Reporte enviado.</strong> Las rutas que pasaban por {enviado.lugar} ya se recalcularon.</p>
          <Link to={urlMapa}>Ver en el mapa</Link>
        </div>
        <button type="button" className="boton boton--secundario" onClick={() => { setForm(VACIO); setErrores({}); setEstado('editando'); }}>
          Reportar otra barrera
        </button>
      </div>
    );
  }

  const textoLimite = estado === 'limite' && (
    <p className="reporte-limite" role="alert">
      <Prohibit weight="bold" aria-hidden="true" />
      <span>{mensaje === TEXTO_429 ? <><strong>Enviaste muchos reportes seguidos.</strong> {mensaje}</> : mensaje}</span>
    </p>
  );

  return (
    <form className="reporte-form" onSubmit={enviar} noValidate>
      <div className="reporte-form__titulo">
        <h1>Reportar una barrera</h1>
        <p>Tu aviso cambia las rutas de todos en segundos.</p>
      </div>

      {mostrarResumen && (
        <div className="reporte-resumen" role="alert" tabIndex={-1} ref={refResumen}>
          <p><Warning weight="bold" aria-hidden="true" /> <strong>Faltan {faltan.length} {faltan.length === 1 ? 'dato' : 'datos'} para enviar el reporte:</strong></p>
          <ul>
            {errores.tipo && <li><a href="#campo-tipo" onClick={irA('tipo')}>Elige qué pasa</a></li>}
            {errores.lugar && <li><a href="#campo-lugar" onClick={irA('lugar')}>Elige dónde está la barrera</a></li>}
          </ul>
        </div>
      )}

      <div id="campo-tipo-grupo"><OpcionesTipo valor={form.tipo} onCambiar={(v) => cambiar('tipo', v)} error={errores.tipo} /></div>

      <div ref={refLugar} id="campo-lugar">
        <CampoLugar
          etiqueta="¿Dónde?" Icono={MapPin} lugares={lugares} valor={form.lugar}
          onCambiar={(v) => cambiar('lugar', v)} error={errores.lugar} placeholder="Busca un lugar del campus"
          extra={<span className="campo__ayuda">Elige de la lista.</span>}
        />
      </div>

      <div className="campo">
        <div className="campo__cabeza">
          <label className="campo__etiqueta" htmlFor={`${id}-detalle`}>Detalle <span className="campo__ayuda">(opcional)</span></label>
          <span className="campo__ayuda" id={`${id}-cuenta`} aria-live="polite">{form.detalle.length} de {MAX_DETALLE}</span>
        </div>
        <textarea
          id={`${id}-detalle`} className="campo__input reporte-detalle" rows={3} maxLength={MAX_DETALLE}
          value={form.detalle} onChange={(e) => cambiar('detalle', e.target.value)}
          placeholder="Por ejemplo: la puerta no abre en el piso 1" aria-describedby={`${id}-cuenta`}
        />
      </div>

      <SegmentadoDuracion valor={form.duracion} onCambiar={(v) => cambiar('duracion', v)} />

      <div className="accion-fija reporte-form__accion">
        {textoLimite}
        <button type="submit" className="boton boton--primario boton--ancho" aria-disabled={estado === 'enviando'}>
          <Flag weight="bold" aria-hidden="true" /> {estado === 'enviando' ? 'Enviando' : 'Enviar reporte'}
        </button>
        <p className="campo__ayuda reporte-form__nota">Puedes enviar hasta 10 reportes cada 10 minutos.</p>
      </div>
    </form>
  );
}

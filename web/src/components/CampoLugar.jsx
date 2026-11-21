import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { QrCode, Warning, X } from '@phosphor-icons/react';
import { iconoLugar, metaLugar } from './iconoLugar.js';
import './CampoLugar.css';

const GRUPOS = ['Salas', 'Servicios', 'Edificios'];
const QR = '__qr__';
// Sin mayúsculas ni tildes: "bano" encuentra "Baño".
const normalizar = (s) => (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// Selector de lugar con el patrón ARIA combobox + listbox.
// El valor solo cambia al elegir una opción; si se escribe y se sale sin elegir, vuelve el nombre elegido.
export default function CampoLugar({
  etiqueta, Icono, lugares, valor, onCambiar, onQr, error, placeholder, borrable = false, extra, className = '',
}) {
  const id = useId();
  const input = useRef(null);
  const elegido = lugares.find((l) => l.id === valor);
  const [texto, setTexto] = useState(elegido?.nombre ?? '');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);

  // Cuando el valor cambia desde fuera (chip frecuente, borrar), el texto lo sigue.
  useEffect(() => { setTexto(elegido?.nombre ?? ''); }, [elegido?.nombre]);

  // Mientras el texto sea el del lugar elegido se muestran todos; al escribir, se filtra.
  const filtro = texto === (elegido?.nombre ?? '') ? '' : normalizar(texto);
  const opciones = useMemo(() => {
    const visibles = lugares.filter((l) => !filtro || normalizar(`${l.nombre} ${metaLugar(l)}`).includes(filtro));
    const ordenadas = GRUPOS.flatMap((g) => visibles.filter((l) => l.grupo === g));
    return onQr ? [...ordenadas, { id: QR }] : ordenadas;
  }, [lugares, filtro, onQr]);

  const idLista = `${id}-lista`;
  const idOpcion = (i) => `${id}-op-${i}`;
  const idError = `${id}-error`;

  const elegir = (op) => {
    setAbierto(false);
    setActivo(-1);
    if (op.id === QR) return onQr();
    setTexto(op.nombre);
    onCambiar(op.id);
  };

  const alTeclear = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Patrón APG: sin opción activa, ↓ va a la primera y ↑ a la última.
      const n = opciones.length;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      const inicial = paso > 0 ? 0 : n - 1;
      if (!abierto) {
        setAbierto(true);
        setActivo(n ? inicial : -1);
        return;
      }
      if (!n) return;
      setActivo((a) => (a < 0 ? inicial : (a + paso + n) % n));
    } else if (e.key === 'Enter' && abierto && opciones[activo]) {
      e.preventDefault();
      elegir(opciones[activo]);
    } else if (e.key === 'Escape') {
      if (!abierto && borrable && valor) borrar();
      setAbierto(false);
      setActivo(-1);
    }
  };

  const borrar = () => {
    onCambiar(null);
    setTexto('');
    input.current.focus();
  };

  let grupoAnterior = null;
  return (
    <div className={`campo ${className}`}>
      <label className="campo__etiqueta" htmlFor={id}>{etiqueta}</label>
      <div className="campo__control">
        <Icono weight="bold" className="campo__icono" aria-hidden="true" />
        <input
          ref={input}
          id={id}
          name={etiqueta.toLowerCase()}
          className="campo__input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? ' '}
          value={texto}
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && opciones[activo] ? idOpcion(activo) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActivo(-1); }}
          onFocus={() => setAbierto(true)}
          onClick={() => setAbierto(true)}
          onBlur={() => { setAbierto(false); setActivo(-1); setTexto(elegido?.nombre ?? ''); }}
          onKeyDown={alTeclear}
        />
        {borrable && valor && (
          <button type="button" className="campo__borrar" aria-label="Borrar destino" onClick={borrar}>
            <X weight="bold" aria-hidden="true" />
          </button>
        )}
        {/* onMouseDown evita que el input pierda el foco antes del click. */}
        <ul id={idLista} role="listbox" aria-label={etiqueta} className="lista-lugares" hidden={!abierto} tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
          {opciones.length === (onQr ? 1 : 0) && <li className="lista-lugares__vacio" role="presentation">No encontramos ese lugar.</li>}
          {opciones.map((op, i) => {
            if (op.id === QR) {
              return (
                <li key={QR} id={idOpcion(i)} role="option" aria-selected={i === activo} className="lista-lugares__opcion lista-lugares__qr" onClick={() => elegir(op)}>
                  <QrCode weight="bold" aria-hidden="true" /> Estoy en un punto QR
                </li>
              );
            }
            const titulo = op.grupo !== grupoAnterior ? op.grupo : null;
            grupoAnterior = op.grupo;
            const IconoLugar = iconoLugar(op);
            return [
              titulo && <li key={`g-${titulo}`} role="presentation" className="lista-lugares__grupo">{titulo}</li>,
              <li key={op.id} id={idOpcion(i)} role="option" aria-selected={i === activo} className="lista-lugares__opcion" onClick={() => elegir(op)}>
                <IconoLugar weight="bold" aria-hidden="true" />
                <span className="lista-lugares__texto">
                  <span className="lista-lugares__nombre">{op.nombre}</span>
                  <span className="lista-lugares__meta">{metaLugar(op)}</span>
                </span>
              </li>,
            ];
          })}
        </ul>
      </div>
      {/* extra va después del input: en móvil se ve debajo y así el Tab sigue el orden visual. */}
      {extra}
      {error && (
        <p id={idError} className="campo__error"><Warning weight="bold" aria-hidden="true" />{error}</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, MapPin, QrCode } from '@phosphor-icons/react';
import GrupoPerfiles, { PERFILES } from '../components/GrupoPerfiles.jsx';
import CampoLugar from '../components/CampoLugar.jsx';
import AvisoBarrera from '../components/AvisoBarrera.jsx';
import { iconoLugar } from '../components/iconoLugar.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { useBarreras } from '../hooks/useBarreras.js';
import { useLugares } from '../hooks/useLugares.js';
import './Inicio.css';

const FRECUENTES = ['sala-a201', 'biblioteca', 'bano-b', 'casino'];
const ERROR_IGUAL = 'Elige un destino distinto al punto de partida.';

export default function Inicio() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { perfil, setPerfil } = usePreferencias();
  const { lugares } = useLugares();
  const { barreras } = useBarreras();

  const [desde, setDesde] = useState(() => params.get('desde') ?? 'entrada-principal');
  const [hasta, setHasta] = useState(null);
  // El error se muestra recién cuando la persona cambia un campo, no al cargar.
  const [tocado, setTocado] = useState(false);
  const cambiarDesde = (id) => { setDesde(id ?? 'entrada-principal'); setTocado(true); };
  const cambiarHasta = (id) => { setHasta(id); setTocado(true); };

  const error = tocado && hasta && hasta === desde ? ERROR_IGUAL : null;
  const motivo = !hasta ? 'Elige a dónde vas para ver tu ruta.' : error;
  const puede = !motivo;
  const textoBoton = PERFILES.find((p) => p.id === perfil)?.textoBoton;
  const verRuta = () => {
    if (!puede) return;
    const q = new URLSearchParams({ desde, hasta, perfil: perfil ?? 'estandar' });
    navigate(`/mapa?${q}`);
  };

  const frecuentes = FRECUENTES.map((id) => lugares.find((l) => l.id === id)).filter(Boolean);
  const n = barreras.length;

  return (
    <div className="inicio">
      <div className="inicio__form">
        <div className="inicio__titulo">
          <h1>¿A dónde vas hoy?</h1>
          <p>Te mostramos el camino que sí puedes recorrer en Casa Central.</p>
        </div>

        <GrupoPerfiles valor={perfil} onCambiar={setPerfil} />

        <CampoLugar
          className="inicio__desde"
          etiqueta="Desde" Icono={MapPin} lugares={lugares} valor={desde} onCambiar={cambiarDesde}
          extra={(
            <Link className="boton boton--enlace inicio__qr" to="/punto/p1">
              <QrCode weight="bold" aria-hidden="true" /> Estoy en un punto QR
            </Link>
          )}
        />

        <div className="inicio__hasta">
          <CampoLugar
            etiqueta="Hasta" Icono={MagnifyingGlass} lugares={lugares} valor={hasta} onCambiar={cambiarHasta}
            onQr={() => navigate('/punto/p1')} error={error} borrable
            placeholder="Busca una sala, un baño o un edificio"
          />
          {frecuentes.length > 0 && (
            <div className="frecuentes" role="group" aria-label="Lugares frecuentes">
              {frecuentes.map((l) => {
                const Icono = iconoLugar(l);
                return (
                  <button key={l.id} type="button" className="chip-lugar" aria-pressed={hasta === l.id} onClick={() => cambiarHasta(l.id)}>
                    <Icono weight="bold" aria-hidden="true" />{l.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Siempre montado: así el lector anuncia cuando aparece o cambia el número. */}
        <div role="status" aria-live="polite">
          {n > 0 && (
            <AvisoBarrera
              variante="compacto" role={undefined}
              titulo={n === 1 ? '1 barrera activa en el campus.' : `${n} barreras activas en el campus.`}
              acciones={<Link to="/reportar#activas">Ver barreras</Link>}
            >
              Tu ruta ya las evita.
            </AvisoBarrera>
          )}
        </div>

        <div className="accion-fija inicio__accion">
          <button
            type="button" className="boton boton--primario boton--ancho"
            aria-disabled={!puede} aria-describedby={puede ? undefined : 'motivo-ruta'} onClick={verRuta}
          >
            Ver mi ruta{textoBoton && <span className="inicio__boton-extra">{textoBoton}</span>}
          </button>
          {!puede && <span id="motivo-ruta" className="motivo">{motivo}</span>}
        </div>
      </div>

      <section className="inicio__mapa" aria-label="Mapa del campus Casa Central">
        <p>Mapa en preparación</p>
      </section>
    </div>
  );
}

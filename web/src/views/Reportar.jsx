import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FormReporte from '../components/FormReporte.jsx';
import ListaBarreras from '../components/ListaBarreras.jsx';
import { PERFILES } from '../components/GrupoPerfiles.jsx';
import { useBarreras } from '../hooks/useBarreras.js';
import { useLugares } from '../hooks/useLugares.js';
import { usePreferencias } from '../hooks/usePreferencias.js';
import { nivelReporte } from '../../../motor/barreras.js';
import './Reportar.css';

// /reportar (Lote 4): reportar una barrera y ver las activas. Sin backend nuevo.
// La barrera recién creada se agrega primera con la marca "Nuevo" hasta que la consulta (cada 5 s) la trae,
// y las resueltas se ocultan al instante. Todo local: useBarreras no se toca.
export default function Reportar() {
  const [params] = useSearchParams();
  const { perfil } = usePreferencias();
  const { lugares, grafo } = useLugares();
  const { barreras, actualizado, error } = useBarreras();
  const [creadas, setCreadas] = useState([]);
  const [resueltas, setResueltas] = useState(() => new Set());

  const lista = useMemo(() => {
    const delServidor = new Set(barreras.map((b) => b.id));
    const locales = creadas.filter((c) => !delServidor.has(c.id));
    const nuevasIds = new Set(creadas.map((c) => c.id));
    const todas = [...locales, ...barreras].filter((b) => !resueltas.has(b.id));
    // Las nuevas primero, sin cambiar el orden del resto.
    return { barreras: [...todas.filter((b) => nuevasIds.has(b.id)), ...todas.filter((b) => !nuevasIds.has(b.id))], nuevas: nuevasIds };
  }, [barreras, creadas, resueltas]);

  const alCrear = (reporte) => setCreadas((c) => [{ ...reporte, nivel: nivelReporte(reporte) }, ...c]);

  const resolver = async (barrera) => {
    try {
      const r = await fetch(`/api/reportes/${encodeURIComponent(barrera.id)}/resolver`, { method: 'POST' });
      if (!r.ok && r.status !== 404) return false;
      setResueltas((s) => new Set(s).add(barrera.id));
      return true;
    } catch {
      return false;
    }
  };

  // "Ver en el mapa": la ruta de la URL si viene, o la de la demo.
  const perfilId = PERFILES.some((p) => p.id === (params.get('perfil') ?? perfil)) ? (params.get('perfil') ?? perfil) : 'silla_ruedas';
  const urlMapa = `/mapa?${new URLSearchParams({
    desde: params.get('desde') || 'entrada-principal', hasta: params.get('hasta') || 'sala-a201', perfil: perfilId,
  })}`;

  return (
    <div className="reportar">
      <FormReporte lugares={lugares} grafo={grafo} urlMapa={urlMapa} onEnviado={alCrear} />
      <ListaBarreras
        barreras={lista.barreras} nuevas={lista.nuevas} grafo={grafo}
        actualizado={actualizado} errorConsulta={error} onResolver={resolver}
      />
    </div>
  );
}

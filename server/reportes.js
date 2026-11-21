import { Router } from 'express';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerDatos, asincrono } from './datos.js';

const TIPOS = ['ascensor_fuera_servicio', 'obstaculo', 'rampa_bloqueada', 'piso_mojado', 'otro'];
const MAX_ACTIVOS = 200;
const MAX_DURACION = 240;
// En el evento todos comparten la IP del Wi-Fi, por eso 10 y no menos.
const MAX_POR_IP = 10;
const VENTANA_IP_MS = 10 * 60_000;
// ponytail: mapa en memoria que se purga en cada envío; con tráfico real, un rate limiter compartido.
const enviosPorIp = new Map();
// ponytail: archivo en el tmp del SO; en Render se pierde al redeployar y se vuelven a cargar los ejemplos.
const archivo = process.env.REPORTES_PATH || join(tmpdir(), 'campus-sin-barreras-reportes.json');

// Ejemplo precargado SOLO con el grafo simulado (campus.json con "simulado": true): con el grafo real,
// un id inventado bloquearía un tramo que no tiene barrera (#43). Va en t10, que no corta la ruta
// de la demo ni contradice ninguna indicación de los puntos QR (#41). El ascensor se reporta en vivo.
const EJEMPLOS = [
  { tipo: 'obstaculo', tramo_id: 't10', descripcion: 'Camión de reparto en la calle de servicio', duracion_min: 240 },
];
const grafoSimulado = (await leerDatos('campus.json').catch(() => null))?.simulado === true;

const minutosDesdeAhora = (min) => new Date(Date.now() + min * 60_000).toISOString();
const nuevoReporte = (id, { tipo, tramo_id = null, nodo_id = null, descripcion, duracion_min = 120 }) => ({
  id, tipo, tramo_id, nodo_id, descripcion,
  creado: new Date().toISOString(), expira: minutosDesdeAhora(duracion_min), resuelto: false,
});

// Un archivo guardado puede venir dañado o editado a mano: se usan solo las entradas válidas
// y, si no queda una lista, se parte como en un arranque limpio. El servidor nunca se cae por esto.
const valido = (r) => r && typeof r.id === 'string' && typeof r.tipo === 'string' && typeof r.expira === 'string';
let reportes;
try {
  const leidos = JSON.parse(readFileSync(archivo, 'utf8'));
  if (!Array.isArray(leidos)) throw new Error('no es una lista');
  reportes = leidos.filter(valido);
  if (reportes.length < leidos.length) console.error(`Reportes: ignoré ${leidos.length - reportes.length} entradas inválidas de ${archivo}`);
} catch (e) {
  if (e.code !== 'ENOENT') console.error(`Reportes: no pude usar ${archivo} (${e.message}); parto de cero.`);
  reportes = grafoSimulado ? EJEMPLOS.map((r, i) => nuevoReporte(`r${i + 1}`, r)) : [];
}
let siguiente = Math.max(0, ...reportes.map((r) => Number(r.id.slice(1)) || 0)) + 1;
// Si falla el disco seguimos en memoria: mejor perder persistencia que tumbar la demo.
const guardar = () => {
  // Archivo temporal + rename: un corte a mitad de escritura no deja el JSON truncado.
  try { writeFileSync(`${archivo}.tmp`, JSON.stringify(reportes, null, 2)); renameSync(`${archivo}.tmp`, archivo); } catch (e) { console.error('No se pudo guardar reportes:', e.message); }
};

const activo = (r) => !r.resuelto && new Date(r.expira) > new Date();
export const reportesActivos = () => reportes.filter(activo);

// Devuelve el mensaje de error o null si el cuerpo es válido.
async function validar(b) {
  if (!b || typeof b !== 'object') return 'cuerpo JSON requerido';
  if (!TIPOS.includes(b.tipo)) return `tipo debe ser uno de: ${TIPOS.join(', ')}`;
  // El que no se usa va ausente o null: "", 0 o false no pasan (contrato §4).
  if ((b.tramo_id == null) === (b.nodo_id == null)) return 'indica tramo_id o nodo_id (solo uno)';
  const id = b.tramo_id ?? b.nodo_id;
  if (typeof id !== 'string' || !id) return 'tramo_id/nodo_id debe ser texto';
  if (typeof b.descripcion !== 'string' || !b.descripcion.trim() || b.descripcion.length > 280)
    return 'descripcion requerida (máx. 280 caracteres)';
  if (b.duracion_min !== undefined && !(Number.isFinite(b.duracion_min) && b.duracion_min >= 1 && b.duracion_min <= MAX_DURACION))
    return `duracion_min debe ser un número entre 1 y ${MAX_DURACION}`;
  // Si el grafo aún no existe no se puede verificar el id; se acepta.
  const grafo = await leerDatos('campus.json').catch(() => null);
  if (grafo) {
    const lista = (b.tramo_id ? grafo.tramos : grafo.nodos) || [];
    if (!lista.some((x) => x.id === id)) return `${b.tramo_id ? 'tramo' : 'nodo'} "${id}" no existe en el grafo`;
  }
  return null;
}

// Comprueba y consume un envío por conexión en el mismo paso síncrono (sin await intermedio).
function consumirCupoIp(ip) {
  const ahora = Date.now();
  for (const [k, ts] of enviosPorIp) if (ahora - ts.at(-1) >= VENTANA_IP_MS) enviosPorIp.delete(k);
  const envios = (enviosPorIp.get(ip) || []).filter((t) => ahora - t < VENTANA_IP_MS);
  if (envios.length >= MAX_POR_IP) return false;
  enviosPorIp.set(ip, [...envios, ahora]);
  return true;
}

export const rutasReportes = Router();

rutasReportes.get('/', (req, res) => res.json(reportesActivos()));

rutasReportes.post('/', asincrono(async (req, res) => {
  const error = await validar(req.body);
  if (error) return res.status(400).json({ error });
  reportes = reportesActivos(); // descarta vencidos y resueltos
  if (reportes.length >= MAX_ACTIVOS) return res.status(429).json({ error: 'demasiados reportes activos' });
  if (!consumirCupoIp(req.ip)) return res.status(429).json({ error: 'demasiados reportes desde esta conexión; espera unos minutos' });
  const { tipo, tramo_id, nodo_id, descripcion, duracion_min } = req.body;
  const reporte = nuevoReporte(`r${siguiente++}`, { tipo, tramo_id, nodo_id, descripcion: descripcion.trim(), duracion_min });
  reportes.push(reporte);
  guardar();
  res.status(201).json(reporte);
}));

rutasReportes.post('/:id/resolver', (req, res) => {
  const reporte = reportes.find((r) => r.id === req.params.id);
  if (!reporte) return res.status(404).json({ error: 'reporte no encontrado' });
  reporte.resuelto = true;
  guardar();
  res.json(reporte);
});

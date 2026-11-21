import { Router } from 'express';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerDatos } from './datos.js';

const TIPOS = ['ascensor_fuera_servicio', 'obstaculo', 'rampa_bloqueada', 'piso_mojado', 'otro'];
const MAX_ACTIVOS = 200;
const MAX_DURACION = 240;
// En el evento todos comparten la IP del Wi-Fi, por eso 10 y no menos.
const MAX_POR_IP = 10;
const VENTANA_IP_MS = 10 * 60_000;
// ponytail: mapa en memoria sin limpieza; con tráfico real usar un rate limiter con expiración.
const enviosPorIp = new Map();
// ponytail: archivo en el tmp del SO; en Render se pierde al redeployar y se vuelven a cargar los ejemplos.
const archivo = process.env.REPORTES_PATH || join(tmpdir(), 'campus-sin-barreras-reportes.json');

// Ejemplos que se ven en el mapa sin cortar la ruta principal de la demo (el ascensor se reporta en vivo).
// ponytail: ids del grafo falso; revisar cuando llegue el levantamiento real.
const EJEMPLOS = [
  { tipo: 'obstaculo', tramo_id: 't6', descripcion: 'Andamio sobre los escalones del atajo a la biblioteca', duracion_min: 240 },
  { tipo: 'piso_mojado', tramo_id: 't9', descripcion: 'Piso mojado en la rampa hacia el casino', duracion_min: 120 },
];

const minutosDesdeAhora = (min) => new Date(Date.now() + min * 60_000).toISOString();
const nuevoReporte = (id, { tipo, tramo_id = null, nodo_id = null, descripcion, duracion_min = 120 }) => ({
  id, tipo, tramo_id, nodo_id, descripcion,
  creado: new Date().toISOString(), expira: minutosDesdeAhora(duracion_min), resuelto: false,
});

let reportes;
try {
  reportes = JSON.parse(readFileSync(archivo, 'utf8'));
} catch {
  reportes = EJEMPLOS.map((r, i) => nuevoReporte(`r${i + 1}`, r));
}
let siguiente = Math.max(0, ...reportes.map((r) => Number(r.id.slice(1)) || 0)) + 1;
// Si falla el disco seguimos en memoria: mejor perder persistencia que tumbar la demo.
const guardar = () => {
  try { writeFileSync(archivo, JSON.stringify(reportes, null, 2)); } catch (e) { console.error('No se pudo guardar reportes:', e.message); }
};

const activo = (r) => !r.resuelto && new Date(r.expira) > new Date();
export const reportesActivos = () => reportes.filter(activo);

// Devuelve el mensaje de error o null si el cuerpo es válido.
async function validar(b) {
  if (!b || typeof b !== 'object') return 'cuerpo JSON requerido';
  if (!TIPOS.includes(b.tipo)) return `tipo debe ser uno de: ${TIPOS.join(', ')}`;
  if (!b.tramo_id === !b.nodo_id) return 'indica tramo_id o nodo_id (solo uno)';
  const id = b.tramo_id || b.nodo_id;
  if (typeof id !== 'string') return 'tramo_id/nodo_id debe ser texto';
  if (typeof b.descripcion !== 'string' || !b.descripcion.trim() || b.descripcion.length > 280)
    return 'descripcion requerida (máx. 280 caracteres)';
  if (b.duracion_min !== undefined && !(Number.isFinite(b.duracion_min) && b.duracion_min >= 1 && b.duracion_min <= MAX_DURACION))
    return `duracion_min debe ser un número entre 1 y ${MAX_DURACION}`;
  // Si el grafo aún no existe no se puede verificar el id; se acepta.
  const grafo = await leerDatos('campus.json').catch(() => null);
  if (grafo) {
    const lista = b.tramo_id ? grafo.tramos : grafo.nodos;
    if (!lista.some((x) => x.id === id)) return `${b.tramo_id ? 'tramo' : 'nodo'} "${id}" no existe en el grafo`;
  }
  return null;
}

export const rutasReportes = Router();

rutasReportes.get('/', (req, res) => res.json(reportesActivos()));

rutasReportes.post('/', async (req, res) => {
  const ahora = Date.now();
  const envios = (enviosPorIp.get(req.ip) || []).filter((t) => ahora - t < VENTANA_IP_MS);
  if (envios.length >= MAX_POR_IP) return res.status(429).json({ error: 'demasiados reportes desde esta conexión; espera unos minutos' });
  const error = await validar(req.body);
  if (error) return res.status(400).json({ error });
  reportes = reportesActivos(); // descarta vencidos y resueltos
  if (reportes.length >= MAX_ACTIVOS) return res.status(429).json({ error: 'demasiados reportes activos' });
  const { tipo, tramo_id, nodo_id, descripcion, duracion_min } = req.body;
  const reporte = nuevoReporte(`r${siguiente++}`, { tipo, tramo_id, nodo_id, descripcion: descripcion.trim(), duracion_min });
  reportes.push(reporte);
  enviosPorIp.set(req.ip, [...envios, ahora]);
  guardar();
  res.status(201).json(reporte);
});

rutasReportes.post('/:id/resolver', (req, res) => {
  const reporte = reportes.find((r) => r.id === req.params.id);
  if (!reporte) return res.status(404).json({ error: 'reporte no encontrado' });
  reporte.resuelto = true;
  guardar();
  res.json(reporte);
});

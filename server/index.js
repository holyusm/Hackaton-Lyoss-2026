import express from 'express';
import { existsSync } from 'node:fs';
import { raiz, leerDatos, asincrono } from './datos.js';
import { rutasReportes, reportesActivos } from './reportes.js';
import { calcularRuta, compararPerfiles } from '../motor/ruta.js';
import { bloqueosDe } from '../motor/barreras.js';
import { simular } from '../motor/simulador.js';

const dist = raiz + 'web/dist';
const app = express();
app.set('trust proxy', 1); // Render pone un proxy delante: req.ip = IP real del cliente
app.use(express.json());

const servirDatos = (archivo) => async (req, res) => {
  try {
    res.json(await leerDatos(archivo));
  } catch (e) {
    res.status(404).json({ error: `no se pudo leer data/${archivo}: ${e.code || e.message}` });
  }
};

app.get('/api/grafo', servirDatos('campus.json'));
app.get('/api/perfiles', servirDatos('perfiles.json'));
app.use('/api/reportes', rutasReportes);

// Ruta y comparación: los reportes activos bloquean su tramo o nodo.
const conMotor = (requeridos, calcular) => async (req, res) => {
  const falta = requeridos.find((p) => !req.query[p]);
  if (falta) return res.status(400).json({ error: `falta el parámetro ${falta}` });
  try {
    const [grafo, perfiles] = await Promise.all([leerDatos('campus.json'), leerDatos('perfiles.json')]);
    const bloqueos = bloqueosDe(reportesActivos());
    res.json(calcular(grafo, perfiles, { ...req.query, bloqueos }));
  } catch (e) {
    res.status(500).json({ error: `no se pudo calcular la ruta: ${e.message}` });
  }
};
app.get('/api/ruta', conMotor(['desde', 'hasta', 'perfil'], calcularRuta));
app.get('/api/comparar', conMotor(['desde', 'hasta'], compararPerfiles));

// Punto QR: data/puntos.json es una lista de Punto (contrato §4).
// Simulador de obras (contrato §7). Sin data/obras.json todavía, se simula sin obras.
app.get('/api/simulador', asincrono(async (req, res) => {
  // qs puede entregar string, Array (?obras=a&obras=b) u Object (?obras[0]=a): solo string o Array de strings.
  const { perfil: perfilQ = 'silla_ruedas', obras: obrasQ = '' } = req.query;
  if (typeof perfilQ !== 'string') return res.status(400).json({ error: 'perfil debe ser un texto' });
  const lista = Array.isArray(obrasQ) ? obrasQ : [obrasQ];
  if (!lista.every((o) => typeof o === 'string')) return res.status(400).json({ error: 'obras debe ser una lista separada por comas' });
  const perfil = perfilQ || 'silla_ruedas';
  const ids = [...new Set(lista.flatMap((o) => o.split(',')).map((s) => s.trim()).filter(Boolean))];
  const [grafo, perfiles, obras] = await Promise.all([
    leerDatos('campus.json'), leerDatos('perfiles.json'),
    leerDatos('obras.json').catch((e) => (e.code === 'ENOENT' ? [] : Promise.reject(e))),
  ]);
  if (perfil !== 'todos' && !perfiles.some((p) => p.id === perfil)) return res.status(400).json({ error: `perfil desconocido: ${perfil}` });
  const falta = ids.find((id) => !obras.some((o) => o.id === id));
  if (falta) return res.status(400).json({ error: `obra desconocida: ${falta}` });
  res.json(simular(grafo, perfiles, obras, { perfil, ids }));
}));

app.get('/api/puntos/:id', asincrono(async (req, res) => {
  const puntos = await leerDatos('puntos.json').catch((e) => (e.code === 'ENOENT' ? [] : Promise.reject(e)));
  if (!Array.isArray(puntos)) throw new Error('data/puntos.json debe ser una lista');
  const punto = puntos.find((p) => p?.id === req.params.id);
  if (punto) res.json(punto);
  else res.status(404).json({ error: `punto "${req.params.id}" no encontrado` });
}));
app.use('/api', (req, res) => res.status(404).json({ error: 'ruta no encontrada' }));

// Frontend: archivos de web/dist y, para rutas del SPA (/mapa, /punto/:id...), index.html.
app.use(express.static(dist));
app.use((req, res) => {
  if (existsSync(dist + '/index.html')) res.sendFile(dist + '/index.html');
  else res.status(503).send('Frontend sin compilar: corre npm run build');
});

// JSON mal formado u otro error: siempre { error } en vez de HTML.
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'error interno' });
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));

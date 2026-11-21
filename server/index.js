import express from 'express';
import { existsSync } from 'node:fs';
import { raiz, leerDatos } from './datos.js';
import { rutasReportes, reportesActivos } from './reportes.js';
import { calcularRuta, compararPerfiles } from '../motor/ruta.js';

const dist = raiz + 'web/dist';
const app = express();
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
    const bloqueos = reportesActivos().map((r) => r.tramo_id || r.nodo_id);
    res.json(calcular(grafo, perfiles, { ...req.query, bloqueos }));
  } catch (e) {
    res.status(500).json({ error: `no se pudo calcular la ruta: ${e.message}` });
  }
};
app.get('/api/ruta', conMotor(['desde', 'hasta', 'perfil'], calcularRuta));
app.get('/api/comparar', conMotor(['desde', 'hasta'], compararPerfiles));
app.use('/api', (req, res) => res.status(404).json({ error: 'ruta no encontrada' }));

// Frontend: archivos de web/dist y, para rutas del SPA (/mapa, /punto/:id...), index.html.
app.use(express.static(dist));
app.use((req, res) => {
  if (existsSync(dist + '/index.html')) res.sendFile(dist + '/index.html');
  else res.status(503).send('Frontend sin compilar: corre npm run build');
});

// JSON mal formado u otro error: siempre { error } en vez de HTML.
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.status ? err.message : 'error interno' }));

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));

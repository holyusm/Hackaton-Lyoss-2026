import express from 'express';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = raiz + 'web/dist';
const app = express();
app.use(express.json());

// Se lee en cada petición: si data/ cambia no hay que reiniciar.
const leerDatos = async (archivo) => JSON.parse(await readFile(raiz + 'data/' + archivo, 'utf8'));

const servirDatos = (archivo) => async (req, res) => {
  try {
    res.json(await leerDatos(archivo));
  } catch (e) {
    res.status(404).json({ error: `no se pudo leer data/${archivo}: ${e.code || e.message}` });
  }
};

app.get('/api/grafo', servirDatos('campus.json'));
app.get('/api/perfiles', servirDatos('perfiles.json'));
app.use('/api', (req, res) => res.status(404).json({ error: 'ruta no encontrada' }));

// Frontend: archivos de web/dist y, para rutas del SPA (/mapa, /punto/:id...), index.html.
app.use(express.static(dist));
app.use((req, res) => {
  if (existsSync(dist + '/index.html')) res.sendFile(dist + '/index.html');
  else res.status(503).send('Frontend sin compilar: corre npm run build');
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));

# parejo

Prototipo de orientación y rutas accesibles para estudiantes de Casa Central de la Universidad Técnica Federico Santa María, en Valparaíso. Calcula un recorrido según el perfil de movilidad y lo actualiza si aparece una barrera, como un ascensor fuera de servicio.

[Demo de parejo](https://hackaton-lyoss-2026.onrender.com) · [Enunciado «Campus sin barreras»](docs/oficial/Enunciado_Hackathon_2026.pdf) · [Bases de la hackatón](docs/oficial/Bases_Hackaton_Oficiales.pdf)

## Problema

Antes de salir hacia una sala, un estudiante necesita saber por dónde puede pasar y si la ruta sigue disponible. En el campus, una escalera, una rampa empinada o un ascensor detenido pueden hacer que tenga que devolverse y buscar otro camino. El prototipo se dirige a estudiantes que usan silla de ruedas, tienen movilidad reducida temporal o permanente o tienen baja visión. El plano también ayuda a quienes recién llegan al campus.

En Chile, el 17,6 % de la población de 18 años o más tenía alguna discapacidad según el estudio nacional de 2022. [SENADIS, III Estudio Nacional de la Discapacidad](https://www.senadis.gob.cl/pag/693/2004/iii_estudio_nacional_de_la_discapacidad)

La planificación por perfil apoya el **ODS 10** de reducción de desigualdades y la **meta 4.a** de entornos educativos inclusivos. El plano y los avisos de barreras aportan información para el acceso a los espacios del campus, en línea con la **meta 11.7**.

## Solución y funcionalidades

parejo modela el campus como un grafo de lugares y tramos. El motor usa escalones, pendiente, superficie, techo, guía podotáctil y ascensores para calcular una ruta con los costos y restricciones de cada perfil.

- **Ruta por perfil** (`/` y `/mapa`). Elige el punto de partida, la llegada y el perfil. La aplicación dibuja la ruta y muestra los pasos, las advertencias y una alternativa en formato de lista.
- **Barreras en vivo** (`/reportar`). Reporta una barrera temporal y elige cuándo vence. Las rutas se recalculan ante un bloqueo y muestran un aviso si el perfil se queda sin recorrido. El piso mojado genera una alerta.
- **Plano interactivo** (`/plano`). Explora edificios y pisos documentados. Selecciona una sala como salida o llegada para dibujar el recorrido en el mismo plano.
- **Comparación** (`/comparar`). Revisa un mismo trayecto para los cuatro perfiles con sus distancias, tiempos, escalones y advertencias.
- **Puntos QR con voz** (`/punto/:id`). Consulta dónde estás y cómo seguir. Puedes escuchar las indicaciones si el navegador ofrece síntesis de voz en español. [QR para imprimir](docs/qr/)
- **Simulador de obras** (`/campus`). Compara cuántos trayectos presentan barreras antes y después de simular rampas, ascensores u otras obras. Incluye modo de proyector (`?presentacion=1`) e informe A4 imprimible en `/campus/informe`.

La interfaz incluye tipografía Atkinson Hyperlegible Next, tres tamaños de texto, modo oscuro y alto contraste. Las vistas ofrecen navegación con teclado, indicadores de foco y etiquetas para lectores de pantalla.

## Demostración

1. Abre **Comparar** con la Entrada principal como origen y Sala C231 como destino. Con los datos de ejemplo, la ruta estándar mide **540 m y tiene 20 escalones**. En silla de ruedas mide **550 m y tiene 0 escalones**, usando el ascensor simulado del Edificio C.
2. En una instancia local, reporta el Ascensor C fuera de servicio. Al actualizarse las barreras, la ruta en silla de ruedas queda sin recorrido. Resuelve el reporte para restaurarla.
3. En **Mejorar el campus**, selecciona silla de ruedas. El simulador parte de **20 de 42 trayectos con barreras** y permite medir cómo cambia esa cifra al seleccionar una obra. En la muestra de rutas desde la Entrada principal, **2 de 6 destinos** quedan sin ruta en silla de ruedas con los datos base.

## Instalación

Requiere Node.js 22 o superior.

```bash
git clone https://github.com/holyusm/Hackaton-Lyoss-2026.git
cd Hackaton-Lyoss-2026
npm ci
```

La instalación local funciona con la configuración predeterminada. El servidor usa el puerto 3000. Para iniciar la compilación de producción en otro puerto, usa `PORT=3999 npm start`.

## Ejecución

Para trabajar con recarga automática, inicia la API y el frontend:

```bash
npm run dev
```

Abrir la URL que muestra Vite (por defecto <http://localhost:5173>). La API corre en <http://localhost:3000/api>.

Para ejecutar la misma compilación que sirve Render:

```bash
npm run build
npm start
```

Abrir <http://localhost:3000>.

Para ejecutar las pruebas o generar los QR:

```bash
npm test   # pruebas del motor, la API y la lógica del frontend
npm run qr # vuelve a generar los QR de docs/qr/ (BASE_URL=<url> para otra URL)
```

### API

| Método y ruta | Qué hace |
|---|---|
| `GET /api/grafo` | El grafo del campus (lugares y tramos) |
| `GET /api/perfiles` | Los cuatro perfiles con sus costos y prohibiciones |
| `GET /api/ruta?desde&hasta&perfil` | Mejor ruta para un perfil, evitando las barreras reportadas |
| `GET /api/comparar?desde&hasta` | El mismo trayecto para los cuatro perfiles |
| `GET /api/reportes` · `POST /api/reportes` · `POST /api/reportes/:id/resolver` | Barreras reportadas en vivo |
| `GET /api/puntos/:id` | Contenido de un punto QR |
| `GET /api/simulador?perfil&obras` | Trayectos con barrera hoy y con las obras elegidas |

Contrato completo en [`docs/contratos.md`](docs/contratos.md).

## Supuestos y limitaciones

- **Plano y grafo.** La cartografía base, las 28 salas numeradas y los dos baños del segundo piso del Edificio C vienen de OpenStreetMap. El grafo abarca una muestra del campus y usa atributos de ejemplo para escalones, pendientes, superficies y guía podotáctil. Las rutas interiores y el ascensor del Edificio C son simulados. El acceso sin escalones de la Entrada principal requiere verificación en terreno. [Datos y levantamiento](docs/levantamiento.md) · [Cómo agregar salas](data/README.md)
- **Métricas.** Se estima la distancia según el trazado disponible. El tiempo usa 1,2 m/s más 2 s por escalón y un tiempo estimado en los tramos con ascensor. Los costos y restricciones representan perfiles de ejemplo.
- **Reportes.** Los avisos tienen vencimiento y se almacenan en un archivo temporal que puede reiniciarse al desplegar. La primera carga de la demo puede tardar si el servicio está inactivo.
- **Obras.** La ubicación en el mapa y los costos relativos son aproximados. Las cifras de impacto son resultados de la simulación sobre la muestra del prototipo.
- **Alcance.** parejo es un prototipo estudiantil. Para usarlo como guía oficial se requiere completar y validar el levantamiento del campus.

## Tecnologías, dependencias y servicios

| Tipo | Qué usamos |
|---|---|
| Lenguajes y frameworks | JavaScript (ESM), React 18, Node.js 22, Express 4 |
| Frontend | Vite 5, React Router 6, Leaflet 1.9 con React Leaflet 4, Phosphor Icons, Atkinson Hyperlegible Next |
| Motor de rutas | Dijkstra propio en JavaScript puro (`motor/ruta.js`), sin dependencias |
| Backend | Express; reportes persistidos en un archivo JSON |
| Otras dependencias | `qrcode` (generar los QR), `concurrently` (desarrollo) |
| Pruebas | `node:test` (incluido en Node) |
| Deploy | Render (plan gratuito). GitHub Actions ejecuta pruebas y compilación en cada push a `main`. Si el secreto de Render está configurado y las verificaciones pasan, solicita el despliegue |

## Equipo

| Integrante | GitHub | Rol |
|---|---|---|
| José | [@holyusm](https://github.com/holyusm) | Líder, diseño de las vistas, accesibilidad, contratos y pitch |
| Gxppe | [@Gxppe](https://github.com/Gxppe) | Servidor, API de reportes y simulador, QR, despliegue e integración de vistas |
| juaquo15 | [@juaquo15](https://github.com/juaquo15) | Datos del campus, perfiles de accesibilidad y motor de rutas |

## Recursos externos

| Recurso | Uso | Licencia |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Plano de Casa Central (edificios, escaleras, senderos) y coordenadas | ODbL, © colaboradores de OpenStreetMap |
| [Leaflet](https://leafletjs.com/) | Mapa | BSD-2-Clause |
| [React Leaflet](https://react-leaflet.js.org/) | Leaflet en React | Hippocratic License 2.1 |
| [React](https://react.dev/), [React Router](https://reactrouter.com/), [Vite](https://vitejs.dev/), [Express](https://expressjs.com/) | Frontend, servidor y compilación | MIT |
| [Phosphor Icons](https://phosphoricons.com/) | Íconos | MIT |
| [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) (vía Fontsource) | Tipografía | SIL OFL 1.1 |
| [node-qrcode](https://github.com/soldair/node-qrcode) | Generar los QR | MIT |
| [concurrently](https://github.com/open-cli-tools/concurrently) | Ejecutar la API y Vite durante el desarrollo | MIT |
| [III Estudio Nacional de la Discapacidad 2022, SENADIS](https://www.senadis.gob.cl/pag/693/2004/iii_estudio_nacional_de_la_discapacidad) | Contexto de la problemática | Publicación de acceso público |

## Herramientas de IA utilizadas

- **Claude Code** (Anthropic) asistió con la coordinación de tareas, la implementación, la revisión de código, las pruebas y la accesibilidad. Las guías reutilizables de trabajo están en [`.claude/skills/`](.claude/skills/).
- **Codex** (OpenAI) asistió con implementación, auditoría, pruebas locales y documentación.
- **Antigravity** asistió con la revisión y las pruebas de integración.
- **Claude Design** (Anthropic) asistió con el diseño del sistema visual y de las vistas. [Diseños exportados](docs/diseno/vistas/)

## Componentes preexistentes (declarados)

Antes del evento preparamos solo herramientas genéricas de coordinación del equipo. **No contienen código del producto.** Están en el primer commit del repositorio:

- `tools/board`, `tools/nuevo-proyecto`, `.claude/hooks/`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/`: tablero de mensajes entre los agentes del equipo sobre un issue de GitHub. Basado en la plantilla "Hackathon agent board" de [azizu06](https://github.com/azizu06) ([guía](https://marvelous-relative-5de.notion.site/hack)).
- `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`, `docs/hackaton.md`, `docs/skills.md`, `docs/kit.md`: reglas de trabajo y guías para los agentes.

Todo el código del producto se escribió durante la hackatón, desde las 09:20.

## Licencia

[MIT](LICENSE)

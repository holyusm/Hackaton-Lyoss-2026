# parejo

Prototipo de orientación y rutas accesibles para estudiantes de Casa Central de la Universidad Técnica Federico Santa María, en Valparaíso. Calcula un recorrido según el perfil de movilidad y lo actualiza si aparece una barrera, como un ascensor fuera de servicio.

[Demo de parejo](https://hackaton-lyoss-2026.onrender.com) · [Enunciado «Campus sin barreras»](docs/oficial/Enunciado_Hackathon_2026.pdf) · [Bases de la hackatón](docs/oficial/Bases_Hackaton_Oficiales.pdf)

## Problema

Antes de salir hacia una sala, un estudiante necesita saber por dónde puede pasar y si la ruta sigue disponible. En el campus, una escalera, una rampa empinada o un ascensor detenido pueden hacer que tenga que devolverse y buscar otro camino. El prototipo se dirige a estudiantes que usan silla de ruedas, tienen movilidad reducida temporal o permanente o tienen baja visión. El plano también ayuda a quienes recién llegan al campus.

En Chile, el 17,6 % de la población de 18 años o más tenía alguna discapacidad según el estudio nacional de 2022. [SENADIS, III Estudio Nacional de la Discapacidad](https://www.senadis.gob.cl/pag/693/2004/iii_estudio_nacional_de_la_discapacidad)

La planificación por perfil apoya el **ODS 10** de reducción de desigualdades y la **meta 4.a** de entornos educativos inclusivos. El plano y los avisos de barreras aportan información para el acceso a los espacios del campus, en línea con la **meta 11.7**.

Los estudiantes que más lo sufren son los que usan silla de ruedas, los que tienen movilidad reducida (bastón, lesión temporal, embarazo), los que tienen baja visión y los estudiantes nuevos que aún no conocen el campus.

Un ejemplo con los datos simulados del prototipo: de la Entrada principal a la Sala C231, la ruta estándar mide 540 m y sube 20 escalones. En silla de ruedas, parejo encuentra una de 550 m y 0 escalones por el ascensor del edificio C: casi el mismo largo, pero hay que conocerla. Si ese ascensor se detiene, no queda ninguna ruta en silla de ruedas, y parejo lo dice en vez de mandar a la escalera. Hoy, 2 de los 6 destinos de la muestra no tienen ruta en silla de ruedas, y 20 de los 42 trayectos entre lugares del campus tienen alguna barrera para ese perfil.

## Solución y funcionalidades

parejo modela el campus como un grafo de lugares y tramos. El motor usa escalones, pendiente, superficie, techo, guía podotáctil y ascensores para calcular una ruta con los costos y restricciones de cada perfil.

- **Ruta por perfil** (`/` y `/mapa`): eliges desde dónde, hacia dónde y cómo te mueves. parejo dibuja la ruta en el plano real del campus (OpenStreetMap) y la cuenta paso a paso, con advertencias como "escalones" o "piso irregular". *ODS 10 y 4.a: el estudiante llega solo, sin depender de que alguien le muestre el camino.*
- **Barreras en vivo que recalculan la ruta** (`/reportar`): cualquier estudiante reporta un ascensor detenido, un obstáculo o una rampa bloqueada. El reporte vence solo, y mientras está activo, las rutas lo evitan. Si ya no hay camino posible, parejo lo dice en vez de mandar al estudiante a una escalera. *ODS 11.7: información de accesibilidad actualizada por la comunidad.*
- **Plano interactivo** (`/plano`): el plano de Casa Central con sus 25 edificios, que se recorre con el dedo, el mouse o el teclado. Se busca por letra, nombre o servicio ("Casino", "Biblioteca"), y cada edificio tiene su ficha con pisos, salas y accesibilidad. Un panel de capas muestra u oculta senderos, escaleras, servicios y nombres de calles. Del Edificio C se ve el interior de sus pisos −1, 1 y 2 (OpenStreetMap), y del Edificio P los pisos 0 y 1, dibujados por el equipo a partir de un boceto en terreno (escala aproximada); cualquier sala se puede usar como inicio o llegada, y la ruta del perfil se dibuja sobre el plano. Los edificios que aún no están en OpenStreetMap se declaran en pantalla en vez de inventarlos.
- **Comparar perfiles** (`/comparar`): el mismo trayecto para los cuatro perfiles, lado a lado, con metros, minutos y escalones. Muestra en cinco segundos que el campus no es igual para todos.
- **Puntos QR con voz** (`/punto/:id`): carteles QR en puntos clave que, al escanearlos, leen en voz alta dónde estás y cómo seguir. Pensados para estudiantes con baja visión. Los QR para imprimir están en [`docs/qr/`](docs/qr/).
- **¿Qué arreglar primero?** (`/campus`): para la universidad. Cuenta cuántos trayectos tienen barrera para cada perfil, ordena obras posibles (rampas, ascensores, piso liso, guía podotáctil) según cuántas barreras quitan, y simula el campus con las obras elegidas. Tiene un modo para proyectar en una reunión (`?presentacion=1`) y arma un informe de una hoja A4 para imprimir o guardar como PDF (`/campus/informe`).

**La app misma es accesible:** tipografía Atkinson Hyperlegible Next, contraste AA o mejor, tema oscuro y de alto contraste, tres tamaños de texto, manejo completo con teclado, foco visible, etiquetas para lector de pantalla y anuncios en vivo cuando cambia la ruta. Además se puede instalar como app (PWA), tiene una página 404 propia y cada ruta pone su título en la pestaña. El estado nunca se indica solo con color.

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

- **Plano y grafo.** La cartografía base, las 29 salas numeradas y los dos baños del segundo piso del Edificio C vienen de OpenStreetMap (la sala C224 no trae piso en OSM y se asigna al 2). El interior de los pisos 0 y 1 del Edificio P es un dibujo del equipo a partir de un boceto en terreno, con escala aproximada. El grafo abarca una muestra del campus y usa atributos de ejemplo para escalones, pendientes, superficies y guía podotáctil. Las rutas interiores y el ascensor del Edificio C son simulados. El acceso sin escalones de la Entrada principal requiere verificación en terreno. [Datos y levantamiento](docs/levantamiento.md) · [Cómo agregar salas](data/README.md)
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
| Gxppe | [@Gxppe](https://github.com/Gxppe) | Servidor, API de reportes y simulador, QR, deploy y las vistas Inicio, Comparar, Punto QR y Mejorar el campus |
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

- **Claude Code** (Anthropic): asistente de programación. La sesión del líder (Claude Opus 5.5) coordinó el trabajo, escribió los contratos y las tareas, y revisó PRs. Las sesiones de @Gxppe y @juaquo15 (Claude Sonnet 5.5) implementaron sus áreas a partir de esas tareas. Se usó para generar código y pruebas, depurar y revisar accesibilidad. El equipo revisó y entiende todo el código, y cada integrante puede explicar su área.
- **Claude Design** (Anthropic): diseño del sistema visual y de cada vista. Los diseños exportados están en [`docs/diseno/vistas/`](docs/diseno/vistas/).
- **Codex** (OpenAI) asistió con implementación, auditoría, pruebas locales y documentación.
- **Antigravity** asistió con la revisión y las pruebas de integración.
- Skills de Claude Code incluidas en `.claude/skills/` (guías de trabajo para el agente): `tablero-equipo`, `grilling`, `grill-me`, `prototype`, `design-taste-frontend` (`taste-skill`), `redesign-existing-projects` (`redesign-skill`), `web-design-guidelines`, `diagnosing-bugs`, `research`.
- No ingresamos datos personales, credenciales ni claves en herramientas de IA.

## Componentes preexistentes (declarados)

Antes del evento preparamos solo herramientas genéricas de coordinación del equipo. **No contienen código del producto.** Están en el primer commit del repositorio:

- `tools/board`, `tools/nuevo-proyecto`, `.claude/hooks/`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/`: tablero de mensajes entre los agentes del equipo sobre un issue de GitHub. Basado en la plantilla "Hackathon agent board" de [azizu06](https://github.com/azizu06) ([guía](https://marvelous-relative-5de.notion.site/hack)).
- `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`, `docs/hackaton.md`, `docs/skills.md`, `docs/kit.md`: reglas de trabajo y guías para los agentes.

Todo el código del producto se escribió durante la hackatón, desde las 09:20.

## Licencia

[MIT](LICENSE)

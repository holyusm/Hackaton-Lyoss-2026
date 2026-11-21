<!--
  BORRADOR (12:20). Revisar a las 15:45, después del [CONGELAR]:
  - Funcionalidades: confirmar en la URL pública que todas funcionan (/, /mapa, /plano, /reportar, /comparar, /punto/:id, /campus, /acerca).
  - Impacto: cifras de PR #195; confirmar con main cuando se mergee.
  - Equipo: nombres de @Gxppe y @juaquo15.
-->

# parejo

Rutas accesibles por perfil para moverse por Casa Central de la USM. parejo le indica a cada estudiante el camino que le sirve según cómo se mueve (silla de ruedas, movilidad reducida o baja visión), y cambia la ruta en vivo cuando alguien reporta una barrera, como un ascensor detenido. A la universidad le muestra qué obras quitarían más barreras.

"Parejo" es el piso sin desniveles, y lo que es igual para todos.

**Desafío:** Campus sin barreras: movilidad y orientación para todos · **ODS:** 10 Reducción de las desigualdades, 11 Ciudades y comunidades sostenibles (meta 11.7), 4 Educación de calidad (meta 4.a) · **Demo:** https://hackaton-lyoss-2026.onrender.com

## Problema

En Chile, el 17,6 % de las personas de 18 años o más tiene alguna discapacidad, según el III Estudio Nacional de la Discapacidad 2022 de SENADIS ([fuente](https://www.senadis.gob.cl/)). En un campus histórico y en pendiente como Casa Central, un estudiante en silla de ruedas, con una lesión temporal o con baja visión se encuentra con lo mismo:

- **El camino accesible no está señalizado.** Hay escaleras, adoquín y desniveles, y la alternativa (un ascensor, una rampa, un rodeo) solo la conoce quien ya la recorrió.
- **El camino cambia durante el día.** Si el ascensor está detenido o una rampa está bloqueada, nadie avisa, y el estudiante lo descubre al llegar.
- **La universidad no ve el problema completo.** Sabe dónde hay una escalera, pero no cuántos trayectos deja sin salida para cada perfil ni qué obra conviene hacer primero.

Los estudiantes que más lo sufren son los que usan silla de ruedas, los que tienen movilidad reducida (bastón, lesión temporal, embarazo), los que tienen baja visión y los estudiantes nuevos que aún no conocen el campus.

<!-- Cifras de PR #195 (juaquo15, 16:35Z). Confirmar con main cuando se mergee. -->
Un ejemplo con los datos simulados del prototipo: de la Entrada principal a la Sala C231, la ruta estándar mide 540 m y sube 20 escalones. En silla de ruedas, parejo encuentra una de 550 m y 0 escalones por el ascensor del edificio C: casi el mismo largo, pero hay que conocerla. Si ese ascensor se detiene, no queda ninguna ruta en silla de ruedas, y parejo lo dice en vez de mandar a la escalera. Hoy, 2 de los 6 destinos de la muestra no tienen ruta en silla de ruedas, y 20 de los 42 trayectos entre lugares del campus tienen alguna barrera para ese perfil.

## Solución y funcionalidades

parejo modela el campus como un grafo de lugares y tramos, con lo que importa para moverse: escalones, pendiente, superficie, techo, guía podotáctil y ascensores. Un motor de rutas calcula el mejor camino para cada perfil con costos y prohibiciones propias, en vez de buscar el camino más corto para todos.

- **Ruta por perfil** (`/` y `/mapa`): eliges desde dónde, hacia dónde y cómo te mueves. parejo dibuja la ruta en el plano real del campus (OpenStreetMap) y la cuenta paso a paso, con advertencias como "escalones" o "piso irregular". *ODS 10 y 4.a: el estudiante llega solo, sin depender de que alguien le muestre el camino.*
- **Barreras en vivo que recalculan la ruta** (`/reportar`): cualquier estudiante reporta un ascensor detenido, un obstáculo o una rampa bloqueada. El reporte vence solo, y mientras está activo, las rutas lo evitan. Si ya no hay camino posible, parejo lo dice en vez de mandar al estudiante a una escalera. *ODS 11.7: información de accesibilidad actualizada por la comunidad.*
- **Plano interactivo** (`/plano`): el plano de Casa Central con sus edificios, que se recorre con el dedo, el mouse o el teclado. Al elegir un edificio o una sala se ve su ficha, y la sala se puede usar como inicio o llegada: la ruta del perfil se dibuja sobre el plano.
- **Comparar perfiles** (`/comparar`): el mismo trayecto para los cuatro perfiles, lado a lado, con metros, minutos y escalones. Muestra en cinco segundos que el campus no es igual para todos.
- **Puntos QR con voz** (`/punto/:id`): carteles QR en puntos clave que, al escanearlos, leen en voz alta dónde estás y cómo seguir. Pensados para estudiantes con baja visión. Los QR para imprimir están en [`docs/qr/`](docs/qr/).
- **¿Qué arreglar primero?** (`/campus`): para la universidad. Cuenta cuántos trayectos tienen barrera para cada perfil, ordena obras posibles (rampas, ascensores, piso liso, guía podotáctil) según cuántas barreras quitan, y simula el campus con las obras elegidas.

**La app misma es accesible:** tipografía Atkinson Hyperlegible Next, contraste AA o mejor, tema oscuro y de alto contraste, tres tamaños de texto, manejo completo con teclado, foco visible, etiquetas para lector de pantalla y anuncios en vivo cuando cambia la ruta. El estado nunca se indica solo con color.

**En qué se distingue:** los mapas de campus muestran dónde están los edificios; parejo muestra *por dónde puede pasar cada persona hoy*, y le da a la universidad los datos para decidir qué obra hacer.

## Instalación

Requiere Node.js 22 o superior.

```bash
git clone https://github.com/holyusm/Hackaton-Lyoss-2026.git
cd Hackaton-Lyoss-2026
npm install
```

No hace falta `.env`: la única variable es `PORT` (por defecto 3000). Si quieres cambiarla, copia `.env.example` a `.env`.

## Ejecución

Desarrollo (API y frontend con recarga):

```bash
npm run dev
```

Abrir la URL que muestra Vite (por defecto <http://localhost:5173>). La API corre en <http://localhost:3000/api>.

Producción local (lo mismo que corre en Render):

```bash
npm run build
npm start
```

Abrir <http://localhost:3000>.

Otros comandos:

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

- **Datos del campus:** el grafo de Casa Central (`data/campus.json`) es una muestra de lugares y tramos con coordenadas reales sobre el plano de OpenStreetMap. Las 28 salas y 2 baños del piso 2 del Edificio C también salen de OpenStreetMap. Todo lo demás es **simulado**: escalones, pendientes, superficies, guía podotáctil, el acceso sin escalones de la entrada principal, el interior de los edificios y el ascensor del Edificio C (no sabemos si existe). La app lo indica con la marca "Datos de ejemplo". Para agregar salas reales basta con editar `data/levantamiento/salas.csv` (ver [`data/README.md`](data/README.md)).
- **Distancias y tiempos:** distancias en línea recta entre los puntos del plano, redondeadas a 5 m. Tiempos a 1,2 m/s más 2 s por escalón; el ascensor incluye la espera. Son aproximados.
- **Perfiles:** los costos de cada perfil (cuánto pesa un escalón, el adoquín o la falta de guía podotáctil) son supuestos nuestros, inspirados en criterios de accesibilidad universal. No reemplazan la experiencia de cada persona.
- **Reportes:** se guardan en el servidor y vencen solos. En la demo (Render, plan gratuito) se reinician con cada despliegue, y el servidor se duerme tras unos 15 minutos sin uso: la primera carga puede tardar.
- **Obras:** el costo relativo (bajo, medio, alto) de cada obra es una estimación nuestra, no un presupuesto.
- parejo es un prototipo estudiantil. No es un servicio oficial de la USM.

## Tecnologías, dependencias y servicios

| Tipo | Qué usamos |
|---|---|
| Lenguajes y frameworks | JavaScript (ESM), React 18, Node.js 22, Express 4 |
| Frontend | Vite 5, React Router 6, Leaflet 1.9 con React Leaflet 4, Phosphor Icons, Atkinson Hyperlegible Next |
| Motor de rutas | Dijkstra propio en JavaScript puro (`motor/ruta.js`), sin dependencias |
| Backend | Express; reportes persistidos en un archivo JSON |
| Otras dependencias | `qrcode` (generar los QR), `concurrently` (desarrollo) |
| Pruebas | `node:test` (incluido en Node) |
| Deploy | Render (plan gratuito). Cada push a `main` corre pruebas y build en GitHub Actions y, si pasan, despliega |

## Equipo

| Integrante | GitHub | Rol |
|---|---|---|
| José | [@holyusm](https://github.com/holyusm) | Líder, diseño de las vistas, accesibilidad, contratos y pitch |
| <nombre> | [@Gxppe](https://github.com/Gxppe) | Servidor, API, integración de vistas, QR y deploy |
| <nombre> | [@juaquo15](https://github.com/juaquo15) | Datos del campus, perfiles de accesibilidad y motor de rutas |

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
| III Estudio Nacional de la Discapacidad 2022, [SENADIS](https://www.senadis.gob.cl/) | Dato del problema | Público |

## Herramientas de IA utilizadas

- **Claude Code** (Anthropic): asistente de programación. La sesión del líder (Claude Opus 5.5) coordinó el trabajo, escribió los contratos y las tareas, y revisó PRs. Las sesiones de @Gxppe y @juaquo15 (Claude Sonnet 5.5) implementaron sus áreas a partir de esas tareas. Se usó para generar código y pruebas, depurar y revisar accesibilidad. El equipo revisó y entiende todo el código, y cada integrante puede explicar su área.
- **Claude Design** (Anthropic): diseño del sistema visual y de cada vista. Los diseños exportados están en [`docs/diseno/vistas/`](docs/diseno/vistas/).
- Skills de Claude Code incluidas en `.claude/skills/` (guías de trabajo para el agente): `tablero-equipo`, `grilling`, `prototype`, `design-taste-frontend`, `redesign-existing-projects`, `web-design-guidelines`, `diagnosing-bugs`, `research`.
- No ingresamos datos personales, credenciales ni claves en herramientas de IA.

## Componentes preexistentes (declarados)

Antes del evento preparamos solo herramientas genéricas de coordinación del equipo. **No contienen código del producto.** Están en el primer commit del repositorio:

- `tools/board`, `tools/nuevo-proyecto`, `.claude/hooks/`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/`: tablero de mensajes entre los agentes del equipo sobre un issue de GitHub. Basado en la plantilla "Hackathon agent board" de [azizu06](https://github.com/azizu06) ([guía](https://marvelous-relative-5de.notion.site/hack)).
- `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`, `docs/hackaton.md`, `docs/skills.md`, `docs/kit.md`: reglas de trabajo y guías para los agentes.

Todo el código del producto se escribió durante la hackatón, desde las 09:20.

## Licencia

[MIT](LICENSE)

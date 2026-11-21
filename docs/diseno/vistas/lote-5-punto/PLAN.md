# Plan de implementación: Lote 5 (`/punto/:id`)

**Implementa:** @Gxppe. **Diseño:** [README.md](README.md), [datos-ejemplo.json](datos-ejemplo.json) y `referencia/`. Abre los `.html` en el navegador para medir; los `.png` solo muestran la composición.

**Objetivo:** Valentina tiene baja visión y usa lector de pantalla. Escanea el QR y la página abre en alto contraste y A+. Toca un botón grande y escucha dónde está y a dónde puede ir, una frase a la vez, con el bloque que se lee resaltado.

**Ya existe (no hay backend nuevo):**
- `GET /api/puntos/:id` (`server/index.js`) lee `data/puntos.json`. Los ids son `p1` a `p5` (el diseño dice `qr-01`: usa los ids reales).
- Los QR ya están impresos en `docs/qr/p1.png` a `p5.png`.
- `GET /api/reportes` entrega las barreras activas, vía `useBarreras()`.

**Diferencias del diseño frente al contrato, y cómo resolverlas (todo en el cliente):**
- **El `Punto` del contrato** (`docs/contratos.md` §4) trae `{ id, nodo_id, titulo, texto_voz, indicaciones: [{ hacia, texto }] }`, y opcionalmente `descripcion` y `indicaciones[].nodo_id`.
- **Id e ícono de cada destino:**
  - si viene `indicaciones[].nodo_id`, se usa ese;
  - si no, se busca el nodo con `nombre === hacia` en `useLugares().grafo` (hoy todos los `hacia` calzan exacto con un nodo);
  - el ícono sale de `iconoLugar(nodo)`;
  - si un destino no tiene nodo, la tarjeta va igual, pero sin "Llévame".
- **Descripción:** `punto.descripcion ?? nodo.descripcion`. Si no hay ninguna, se omite el párrafo. `texto_voz` no se usa: la voz se arma con los bloques visibles.
- **Barrera:**
  - es la barrera activa de `useBarreras()` con `nodo_id === punto.nodo_id`; si hay varias, la de mayor `nivel`;
  - título: "Atención: {descripcion}." (sin el punto final repetido);
  - texto: "El aviso vence a las HH:MM.", con `toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})`;
  - en la voz, la hora va como "12 y 35".
- **Velocidad de la voz:** se guarda en `localStorage['parejo:velocidad-voz']`.

**Reglas:**
- Usa las clases de `componentes.css` y los colores de `tokens.css`, sin hex.
- Resaltado del bloque que se lee: `outline: 4px solid var(--cobalto)` con `outline-offset` y fondo `var(--cobalto-tinte)`.
- Barra de estado: Pacífico no existe en tokens. Usa `--cobalto` (y negro en contraste) o lo que corresponda al tema.
- Textos exactos de `datos-ejemplo.json`, sin abreviaturas, sin guion largo, sin semiguion y sin "·".
- **Dueños:**
  - los archivos nuevos son tuyos;
  - `main.jsx`, `Shell.jsx` y `usePreferencias.js` también son tuyos (Lote 0);
  - `data/puntos.json` es de @juaquo15: no se toca.
- **Reutiliza:**
  - `AvisoBarrera` (variante `alerta`, `role="alert"`);
  - `useBarreras()`, `useLugares()`, `iconoLugar()` y `usePreferencias()`;
  - las clases `.boton--primario`, `.boton--secundario`, `.boton--ancho`, `.banda-vivo--sin-conexion` y `.saltar`.
- **No uses `.segmentado` para la velocidad:** sus botones tienen tamaños por posición (`nth-child`).

### PR A: vista completa con voz (meta 14:00)

| # | Archivo | Qué hace | Hecho cuando |
|---|---|---|---|
| A1 | `web/src/lib/punto.js` + `.test.js` | Funciones puras. `armarPunto(punto, grafo, barreras, perfil)` devuelve `{ titulo: "Estás en: X", descripcion, barrera \| null, destinos: [{ id, nombre, nodo, indicacion, enlace }] }`; `enlace` es `/mapa?desde=<nodo_id>&hasta=<id>` más `&perfil=<perfil>` si hay perfil guardado. `horaHablada("12:35")` devuelve "12 y 35", y `"12:00"` devuelve "12 en punto". `frasesPunto(modelo)` devuelve `[{ clave, nombre, texto }]` en orden: aviso (nombre "el aviso", texto con la hora hablada), lugar (nombre "dónde estás", texto "Estás en: X. {descripcion}") y cada destino ("{nombre}: {indicación con minúscula inicial}"). Tests: orden con y sin barrera, destino sin nodo y que ningún texto contenga "·", "—" ni "–". | `npm test` pasa |
| A2 | `hooks/useVoz.js` | Las voces se cargan con `getVoices()` más el evento `voiceschanged` (en Chrome llegan tarde). `disponible` es verdadero si hay alguna voz `es-*`; se prefiere `es-CL` y siempre se pone `utterance.lang = "es-CL"`. Estados: `reposo`, `leyendo` y `pausa`, más `indice`. `leer(frases, desde)` encadena una utterance por frase: `onstart` fija `indice` y `onend` lanza la siguiente; con la última vuelve a `reposo`. **Cada corrida lleva un token**, porque `cancel()` dispara el `onend` de la frase en curso y sin token se salta un bloque. Además: `pausar` y `seguir` (`pause()` y `resume()`); `repetir`, que cancela y lee desde 0; y `setVelocidad` (0,8, 1 o 1,25, guardada con try/catch), que si está leyendo cancela y retoma desde `indice`. Al desmontar y en `pagehide` se llama `cancel()`. **Nunca arranca sola.** | Lee las frases de `p1` en orden y resalta cada una |
| A3 | `hooks/usePunto.js` | `GET /api/puntos/:id` con AbortController. Si responde 200, guarda la respuesta en `localStorage['parejo:punto:<id>']` (con try/catch). Si falla la red, usa lo guardado y pone `sinConexion: true`. Con los eventos `offline` y `online` actualiza la banda. Un 404 da `noEncontrado: true`. | Con la red cortada en DevTools, la página se sigue viendo y escuchando |
| A4 | `components/BarraVoz.jsx` + `.css` | **En reposo:** botón primario a todo el ancho, de 72 px mínimo, "Escuchar indicaciones" con `SpeakerHigh`. **Leyendo:** barra `role="status"` `aria-live="polite"` de 56 px que dice "Leyendo {nombre}" o "En pausa" (el contenedor live existe siempre en el DOM, aunque esté vacío). Debajo, "Pausar"/"Seguir" con `aria-pressed` y "Repetir", de 64 px. **Siempre visible:** `fieldset role="radiogroup"` con la leyenda "Velocidad de la voz", en píldora, con segmentos de 52 px y roving tabindex (las flechas mueven foco y selección). **Sin voz en español:** el botón queda `disabled` y el motivo exacto va en un texto enlazado con `aria-describedby`. | Se maneja solo con teclado y se ve como `02` |
| A5 | `components/TarjetaDestino.jsx` | Tarjeta (`<li>`) con radio de 20 px y borde de 2 px: ícono `aria-hidden`, `<h3>` con el nombre, la indicación completa y un `<Link>` "Llévame" (`.boton--secundario`, 56 px, `aria-label="Llévame a {nombre}"`). La prop `resaltado` agrega el contorno y el fondo del bloque leído. | Se ve como `01` |
| A6 | `views/Punto.jsx` + `Punto.css` | **El orden del DOM es el orden de la voz:** banda sin conexión (si aplica), aviso de barrera (si hay), `<h1>` y descripción, `BarraVoz`, `<h2>` "Desde aquí puedes ir a:" con `<ul>` de tarjetas, y el pie con "Este punto QR es parte de un prototipo estudiantil." y el enlace "Cambiar perfil" (va a `/`, 48 px). El aviso y el bloque "dónde estás" también se resaltan cuando se leen. Sin `tabindex` positivos ni posiciones absolutas que cambien el orden. Estados: cargando (texto simple) y no encontrado ("No encontramos este punto QR." con un enlace al inicio). | Se ve como `01`, `03` y `04` |
| A7 | `main.jsx`, `Shell.jsx` y `usePreferencias.js` | **Ruta:** `/punto/:id` apunta a `<Punto/>`. **Shell:** con `enPunto` se ocultan `nav-movil`, `nav-escritorio` y `pie-legal`; quedan la cabecera, el botón Accesibilidad y "Saltar al contenido". **Provider:** se agrega `aplicarPorDefecto({ tema, texto })`, que cambia el estado solo si no existen `parejo:tema` ni `parejo:texto` en `localStorage`, y **no guarda nada**. Punto la llama en un `useLayoutEffect` con `{ tema: 'contraste', texto: 'grande' }`. Revisa que el wordmark en contraste use el símbolo blanco y negro. | `/punto/p1` en una ventana privada abre en contraste y A+, sin navegación inferior |

### PR B: pulido (meta 14:45)
- Revisión completa:
  - teclado;
  - NVDA o TalkBack: el orden es el visual y cada "Llévame" anuncia su destino;
  - A++ con zoom al 200 % a 390 px, sin nada cortado ni scroll horizontal;
  - 1440 px;
  - los 3 temas;
  - todo lo que se toca mide 48 px o más.
- Barrera de prueba: `POST /api/reportes` con `tipo` `piso_mojado` y `nodo_id` `entrada-principal`. Al recargar `/punto/p1`, el aviso queda arriba y la voz lo lee primero.
- **Prueba de la demo del pitch:** escanear `docs/qr/p1.png` con Chrome de Android contra Render.

### Prueba de la demo
1. En una ventana privada, abre `/punto/p1`: está en alto contraste y A+, como `01`.
2. "Escuchar indicaciones": lee en es-CL, en el orden visual, resalta cada bloque y la barra dice cuál.
3. Pausar, Seguir y Repetir funcionan. Cambiar a "Rápida" a mitad de lectura retoma desde el mismo bloque.
4. Con una barrera activa en `entrada-principal`, el aviso aparece primero en pantalla y en la voz.
5. Corta la red: aparece la banda "Sin conexión…" y se puede volver a escuchar.
6. "Llévame" en Ascensor A abre `/mapa?desde=entrada-principal&hasta=ascensor-a` con el perfil guardado.
7. `npm test` y `npm run build` pasan.

## Decide tú (y avisa en el tablero)
- Las medidas que falten.
- El color exacto de la barra de estado en cada tema.
- Qué hacer si `pause()` falla en algún navegador: como alternativa, Pausar hace `cancel()` y Seguir retoma desde `indice`.

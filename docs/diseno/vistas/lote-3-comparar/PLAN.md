# Plan de implementación: Lote 3 (`/comparar`)

**Implementa:** @Gxppe, **antes** que el Lote 8 (#88, #89). **Diseño:** [README.md](README.md), [datos-ejemplo.json](datos-ejemplo.json) y `referencia/` (abre los `.html` en el navegador para medir; los `.png` solo muestran la composición).

**Objetivo:** el jurado entiende en 5 segundos que el mismo trayecto no es el mismo para todos. La frase resumen se lee en el pitch.

**Ya existe (no hay backend nuevo):**
- `compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos })` en `motor/ruta.js` devuelve `{ [perfilId]: resultado de calcularRuta }`.
- `GET /api/comparar?desde&hasta` en `server/index.js` aplica los reportes activos como bloqueos.
- `/comparar` ya está en el router (`Pendiente`, `web/src/main.jsx`) y en la nav del Shell.

**Mapa:** usa la misma base que el Lote 2: el plano de Casa Central armado desde OpenStreetMap, con `<CapaPlano/>` y `LIMITES` de `web/src/plano/` (los hace José). Leaflet va con el CRS normal, sin teselas, y las rutas se dibujan con `[lat, lng]` de los nodos. **No** se usa el plano esquemático de la referencia, y las coordenadas `plano` de `datos-ejemplo.json` no se usan. Mientras `web/src/plano/` no esté en main, usa un `Rectangle` vacío con los límites de los nodos de `campus.json` y sigue avanzando.

**Coordina con el Lote 2:** @juaquo15 tiene en el PR #98 `web/src/lib/posicion.js` (nodo → `[lat, lng]`) y `MapaRuta`, con el mismo esquema (CRS normal, sin teselas). Cuando #98 esté en main, usa `posicion.js` para las coordenadas y copia de `MapaRuta` la configuración del mapa (límites, zoom, marcadores de origen y destino) para que los dos mapas se vean iguales. Si necesitas extraer algo común a un archivo compartido, pídelo en el tablero.

## Reglas
- Usa los ids del contrato: `estandar`, `silla_ruedas`, `movilidad_reducida`, `baja_vision`, `entrada-principal` y `sala-a201`. Los ids y las cifras de `datos-ejemplo.json` son solo un ejemplo: las cifras reales salen del motor.
- Usa las clases de `componentes.css` y los colores de `tokens.css`, sin hex. No copies los estilos en línea de las referencias.
- Usa los textos exactos del README, sin guion largo, sin "·" y sin "→".
- Números con coma decimal (`toLocaleString('es-CL')`): metros enteros, minutos con 1 decimal.
- **Dueños:** los archivos de este lote son tuyos (`components/`, `hooks/` y `main.jsx` ya lo son). `web/src/plano/` es de José. `MapaRuta` y `Mapa.jsx` son de @juaquo15: no los toques.
- **Reutiliza:**
  - `PERFILES` de `GrupoPerfiles.jsx` (nombre e ícono);
  - `useLugares()` (grafo y nombres);
  - `useBarreras()` (barreras activas y causa);
  - `CampoLugar` (para editar el trayecto);
  - `bloqueosDe` de `motor/barreras.js`;
  - `compararPerfiles` y `conArticulo` de `motor/ruta.js`;
  - las clases `.marcador--*`, `.marcador-destino__etiqueta` y `.chip-perfil`.

## PR A0: ajustes al Shell pedidos por el diseño (15 min)
- En la cabecera de escritorio, la `nav` y el grupo de accesibilidad llevan `flex-wrap: wrap`, para que no haya scroll horizontal a 390 px ni con zoom al 200 %.
- El enlace del wordmark mide al menos 48 px de alto.

## PR A: comparación sin mapa. Meta: ~13:15

| # | Archivo | Qué hace | Hecho cuando |
|---|---|---|---|
| A1 | `web/src/lib/comparar.js` (+ `comparar.test.js`) | Funciones puras, detalladas abajo: `armarFilas(grafo, resultados)`, `fraseResumen(filas, destinoNombre)` y `motivoSinRuta(barreras, grafo, resultado)`. | `npm test` pasa con la escena normal y con `bloqueos: ['ascensor-a', 'pasarela-b-a']` (silla sin ruta y frase de sinRuta) |
| A2 | `web/src/hooks/useComparacion.js` | Lee `desde` y `hasta` de la URL (por defecto, `entrada-principal` y `sala-a201`). Pide `/api/comparar`; si falla, calcula `compararPerfiles` local con `campus.json`, `perfiles.json` y `bloqueosDe(barreras)`. Vuelve a pedir cuando cambian los ids de `useBarreras` (ese hook ya consulta cada 5 s). Devuelve `{ estado: 'cargando'\|'ok'\|'error', filas, frase, barreras, desde, hasta }`. | `/comparar` muestra las cifras del grafo |
| A3 | `components/TablaComparar.jsx` + `.css` | Tabla de escritorio, detallada abajo. | Se ve como `01` y `02` |
| A4 | `components/FilaPerfilMovil.jsx` | Tarjeta móvil, detallada abajo. | Se ve como `03` |
| A5 | `views/Comparar.jsx` + `Comparar.css` y `main.jsx` | Compone la vista, detallada abajo. Reemplaza el `Pendiente` de `/comparar`. | Se ve como `01`, `02` y `03` (sin el mapa) |

### A1. `armarFilas(grafo, resultados)`
Devuelve una fila por perfil, en este orden: `estandar`, `silla_ruedas`, `movilidad_reducida`, `baja_vision`. Cada fila es:

```js
{ id, ok, metros, minutos, escalones, difMetros, difMinutos, notaEscalones, pasaPor, advertencias, motivo, nodos }
```

Las diferencias se calculan frente a `estandar`:
- En la fila Estándar, las tres dicen "Base".
- Metros: "+35 m", "igual" o "5 m menos".
- Minutos: "+1,4 min", "igual" o "0,5 min menos".
- Escalones: "evita 12", "igual" o "+8".

`pasaPor` son los nombres de los nodos intermedios (sin origen ni destino), unidos con comas y "y". Si el tramo tiene `nombre`, usa ese nombre.

### A1. `fraseResumen(filas, destinoNombre)`
El perfil de la frase es siempre `silla_ruedas`. Plantillas, en este orden:
1. **sinRuta:** "En silla de ruedas hoy no hay ruta hacia la {destino}. El resto debe subir al menos {mínimo de escalones de los demás} escalones." Si ese mínimo es 0, la segunda oración es "El resto tiene ruta sin escalones."
2. **masLargoYEvita:** "En silla de ruedas este trayecto es {dif} m más largo y evita {n} escalones."
3. **masLargo:** "En silla de ruedas este trayecto es {dif} m más largo, con los mismos escalones."
4. **igual:** "Para silla de ruedas el trayecto es igual al Estándar."

Usa `conArticulo` para "la Sala A-201".

### A1. `motivoSinRuta(barreras, grafo, resultado)`
Arma el motivo desde las barreras activas, por ejemplo: "El Ascensor A está fuera de servicio desde las 11:05 y la pasarela del Edificio B está cerrada." Si no hay barreras activas, usa el `motivo` del motor.

### A3. `TablaComparar`
- `<table>` real con `<caption>`: "Mismo trayecto para cada perfil. Elige una fila para resaltar su ruta en el mapa. Datos de ejemplo."
- Encabezados `scope="col"`. El perfil va en un `<th scope="row">` con un botón píldora de 48 px y `aria-pressed`.
- Fila elegida: el botón va invertido y la fila entera con fondo `--cobalto-tinte`.
- Cifras: 32 px, 800, tabulares y alineadas a la derecha. Debajo, la diferencia en 15 px y `--tinta-2`. Cero escalones va en `--paso`.
- Fila sin ruta: una sola celda `colspan="5"` con `Prohibit`, "Sin ruta accesible" en `--alto` (20 px) y el motivo debajo.
- La tabla tiene `min-width: 820px` dentro de una caja con `overflow-x: auto`.
- Sin barras ni gráficos.

### A4. `FilaPerfilMovil`
- `<li>` con radio de 20 px y borde de 2 px.
- Botón de ancho completo con `aria-expanded`. `aria-controls` apunta al panel solo mientras está abierto.
- El caret gira al abrir, sin animación si está activo `prefers-reduced-motion`.
- Tres cifras de 28 px, con etiquetas "metros, +35", "min, +1,4" y "escalones".
- Panel abierto: "Pasa por", "Advertencias" y "Su ruta está resaltada en el mapa."
- Solo una fila abierta a la vez.

### A5. `Comparar`
- `<h1>` "Comparar perfiles".
- **Trayecto compacto:** en escritorio, dos botones de 48 px, "Desde **…**" y "Hasta **…**", con sus `aria-label` del README. En móvil, un botón de ancho completo, "**…** hasta **…** Cambiar". Al tocarlos se abre un panel con dos `CampoLugar`, que actualizan la URL.
- **Frase** como `<h2>`: 38 px en escritorio y 26 px en móvil, `text-wrap: balance`, máximo 26ch.
- A ≥ 900 px va la tabla, en dos columnas con el mapa (`flex-wrap`). A < 900 px van las tarjetas, debajo del mapa y la leyenda.
- En escritorio todo va un paso más grande (cuerpo de 20 px), para leerse en el proyector.
- **Estado `seleccion`,** compartido entre tabla, tarjetas y mapa: al inicio vale `silla_ruedas`, o `todas` si silla no tiene ruta. Activar de nuevo la fila elegida vuelve a `todas`.
- Pie de la vista: "Las diferencias se calculan frente al perfil Estándar."

## PR B: mapa con las 4 rutas. Meta: ~14:15

### B1. `components/MapaComparar.jsx` + `.css`
- **Base:** react-leaflet sin teselas, con `<CapaPlano/>` y `LIMITES` (o el rectángulo de respaldo).
- **Rutas:** una `Polyline` por perfil con ruta, con los `[lat, lng]` de `fila.nodos`. Los estilos y el orden de dibujo están en `estilosDeRuta` de `datos-ejemplo.json`:

  | Perfil | Trazo | Color | Borde |
  |---|---|---|---|
  | Estándar | 3 px, continuo | `--tinta` | no |
  | Silla de ruedas | 6 px, continuo | `--cobalto` | 12 px `--superficie` |
  | Movilidad reducida | 5 px, `dashArray "12 8"` | `--cobalto` | 9 px `--superficie` |
  | Baja visión | 6 px, `dashArray "0.1 11"`, punta redonda | `--paso` | no |

- **Colores:** se leen de las variables CSS con `getComputedStyle`, así respetan el tema.
- **Selección:** la ruta elegida lleva +2 px, opacidad 1 y va arriba. Las demás bajan a opacidad 0,2.
- **Marcadores:**
  - origen hueco;
  - pin de destino en `--tinta` (neutro), con su etiqueta;
  - la escalera del Estándar ("Escalera, N escalones");
  - las barreras activas, con `.marcador--bloqueo` y etiqueta.
- Los marcadores no reciben foco ni clics (`keyboard: false`, `interactive: false`).
- **Texto alternativo:** el contenedor lleva `role="img"` y un `aria-label` que cambia con la selección: "Plano de Casa Central desde la Entrada principal hasta la Sala A-201, resaltando la ruta en silla de ruedas." Si silla no tiene ruta, agrega "El Ascensor A está fuera de servicio y no hay ruta en silla de ruedas."
- **Tamaño:** en escritorio, tarjeta de 520 px de alto, radio de 20 px y `flex: 5 1 440px`. En móvil, 372 px arriba de todo.

### B2. `components/LeyendaRutas.jsx`
- Rejilla de 2 columnas. Cada entrada lleva un SVG de muestra con el mismo trazo, el ícono y el texto, por ejemplo "**Silla de ruedas**, línea gruesa continua".
- Un perfil sin ruta dice "sin ruta hoy" y no lleva muestra.
- En móvil, versión compacta de 15 px sin ícono.

### B3. Prueba de la demo
1. Abre `/comparar` y reporta `ascensor-a`:
   ```
   curl -X POST /api/reportes -d '{"tipo":"ascensor_fuera_servicio","nodo_id":"ascensor-a","descripcion":"Ascensor A fuera de servicio","duracion_min":60}'
   ```
   La silla sigue con ruta por el Edificio B y cambian sus cifras.
2. Reporta además `pasarela-b-a`. En 5 s o menos debe aparecer:
   - la fila "Sin ruta accesible";
   - la frase de sinRuta;
   - el marcador de bloqueo en el mapa;
   - la selección en `todas`.

## PR C: si alcanza el tiempo. Meta: ~15:15
- **C1.** Desplaza 6 a 8 px en paralelo las rutas que comparten tramo, como en un mapa de metro. El offset se calcula en píxeles con `map.latLngToLayerPoint` y se recalcula en `zoomend`.
- **C2.** Cada fila lleva el enlace "Ver paso a paso", que abre `/mapa?desde&hasta&perfil`.

## Aceptación (del README, más la demo)
- [ ] Móvil 390 px y escritorio 1440 px se ven como las referencias, en claro, oscuro y alto contraste.
- [ ] A 720 px (zoom al 200 %) y a 390 px no hay scroll horizontal. Solo la tabla se desplaza dentro de su caja.
- [ ] Las 4 rutas se distinguen en escala de grises y la leyenda lo dice en texto.
- [ ] La tabla se lee bien con lector de pantalla: caption, encabezados y botón de fila con `aria-pressed`.
- [ ] Elegir una fila con teclado resalta la ruta y actualiza el `aria-label` del mapa.
- [ ] La frase sale de los datos y cambia sola cuando un perfil queda sin ruta.
- [ ] Sin barras ni gráficos. Sin guion largo ni "·".
- [ ] La prueba de la demo funciona en `npm run dev` y en Render.
- [ ] `npm test` y `npm run build` pasan. Adjunta al PR las capturas del script CDP (teclado, 390 y 1440 px, 3 temas).

## Decide tú (y avisa en el tablero)
Las medidas que falten, el texto de "Pasa por" si el grafo no da buenos nombres y qué hacer si un texto no cabe.

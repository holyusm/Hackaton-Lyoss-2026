# Lote 8: ¿Qué arreglar primero? (`/campus`)

Herramienta de decisión para la universidad (Programa de Inclusión, infraestructura) y el jurado. En 10 segundos tiene que quedar claro **cuántos trayectos tienen barrera para un perfil, qué obra quita más barreras y cómo cambia el campus si se hace**. En la navegación se llama "Mejorar el campus".

**Requiere** el sistema del Lote 0 (`tokens.css`, `componentes.css`, `componentes.md`, `iconos.md`). Esta carpeta trae solo lo propio de la vista. Los textos exactos y las respuestas de ejemplo del servidor están en `datos-ejemplo.json`.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-escritorio-sin-obras` | **La principal.** Silla de ruedas, sin obras simuladas |
| `02-escritorio-una-obra` | Rampa del patio simulada: franja comparativa y lugares "Nuevo" |
| `03-escritorio-tres-obras` | Rampa, piso liso y guía táctil del Casino |
| `04-escritorio-ver-como-lista` | El plano como tabla |
| `05-escritorio-todos-los-perfiles` | Chip "Todos los perfiles": sin cifra de desvío |
| `06-escritorio-aun-quedan-barreras` | Baja visión con las 3 obras que ayudan: "Aún quedan 31 trayectos con barrera" |
| `07-escritorio-modo-oscuro`, `08-escritorio-alto-contraste` | Temas de la vista principal |
| `09-estado-cargando`, `10-estado-perfil-estandar`, `11-estado-error` | Estados |
| `12-proyector` | Modo presentación con una obra activa (1920×1080) |
| `13-movil-obras-con-simulacion`, `14-movil-mapa`, `15-movil-panel-mas` | Móvil 390 px |
| `16-informe-a4` | Vista de impresión, A4 vertical, blanco y negro |
| `17-componentes-nuevos` | Fila de obra, interruptor, marcadores, franjas, mensajes y panel Más |
| `18-componente-plano-de-zonas` | El plano con marcadores, solo |

Los `.html` cargan la tipografía real; los `.png` usan una fuente de reemplazo. El plano de las referencias es el esquema de los lotes anteriores: en la app es el plano vectorial de OpenStreetMap de `/mapa`, y los marcadores van en `lat`, `lng` de cada zona.

## Estructura en escritorio (de arriba hacia abajo)

### 1. Encabezado
- `<h1>` "¿Qué arreglar primero?" (48 px, 800, -3 %) y al lado la marca **"Datos de ejemplo"** (píldora con borde punteado de 2 px). Se muestra mientras el servidor diga que hay datos de ejemplo.
- Bajada en Cuerpo, `--tinta-2`, máximo 66 caracteres por línea.
- Selector de perfil: etiqueta visible "Medir para" y cuatro `ChipPerfil` del Lote 0 en un `role="radiogroup"` con `aria-labelledby`: Silla de ruedas (por defecto), Movilidad reducida, Baja visión y **Todos los perfiles** (ícono `UsersThree`). Flechas y roving tabindex como en el resto de la app. El perfil se refleja en la URL (`?perfil=silla_ruedas`).
- Debajo, en Detalle, qué significa barrera para el perfil elegido (textos en `textos.definicion_barrera`).
- Estándar no es chip. Si llega por la URL, se ve el estado "Perfil Estándar" (ref. 10) con los chips a la mano y ninguno marcado.

### 2. Estado de hoy
- `<dl>` con las cifras como `MetricasRuta`: sin tarjetas, separadas por líneas verticales finas.
  - **"20 de 42"** en Alto (`--alto-texto`), con `Prohibit` a la izquierda. Etiqueta: "trayectos con barrera".
  - **"0,0 min"**: "de desvío promedio en los trayectos con ruta". Se muestra aunque sea cero. Con Todos los perfiles no existe (`minutos_extra_prom: null`) y la franja queda con una sola cifra.
  - Tercera cifra opcional, solo si el servidor la trae: "6 traslados entre salas no alcanzan en 10 min de recreo" (ver ref. 17).
- Debajo, la **frase del pitch** en Subtítulo (24 px, 700), generada con los datos:
  - Silla de ruedas: "Hoy, 1 de cada {round(42/n)} trayectos de Casa Central no se puede hacer en silla de ruedas."
  - Movilidad reducida: "En movilidad reducida, 1 de cada {round(42/n)} trayectos obliga a subir escalones."
  - Si la proporción pasa de 85 %: "En baja visión, casi todos los trayectos (40 de 42) pasan por adoquín, piso irregular o sin guía podotáctil."
  - Todos: "Hoy, 40 de 42 trayectos tienen barrera para al menos uno de los tres perfiles."

### 3. Simulación (aparece con una o más obras activas)
- Panel "Con las obras simuladas" (`<section>` con `<h2>`): superficie, borde de 2 px Pacífico, radio 20 px.
- Tres bloques en fila (pasan a dos filas en pantallas angostas):
  - **Hoy**: "20" en Alto + "con barrera", y debajo el desvío.
  - **Con N obras**: la cifra en Paso si llega a 0, en Pacífico si bajó y en Alto si no cambió. Debajo, el desvío.
  - **Por perfil**: "Silla de ruedas: 20 trayectos más con ruta", "Movilidad reducida: 16 trayectos más sin escalones", "Baja visión: 0 trayectos más sin barrera", cada uno con su ícono. Sale de `con_obras.trayectos_sin_barrera_por_perfil`.
- Sin flechas ni barras.
- Acciones: "Quitar todas" (botón enlace) y "Armar informe" (primario, ícono `Printer`).
- Si todas las obras que ayudan ya están activas y quedan trayectos con barrera: línea en Alto con `Prohibit`, "Aún quedan 31 trayectos con barrera: necesitan obras que no están en la lista."
- **aria-live:** un `<p role="status" aria-live="polite">` oculto anuncia cada cambio: "Con la rampa del patio central, 20 trayectos más tienen ruta en silla de ruedas." Con varias obras: "Con 3 obras, …".

### 4. Cuerpo en dos columnas (7/12 y 5/12)
Con `flex-wrap`: debajo de unos 1000 px las dos columnas se apilan (sin scroll horizontal con zoom al 200 %).

**Izquierda: "Cómo se llega a cada lugar"**
- Botón "Ver como lista" (`aria-pressed`, ícono `ListBullets`), el mismo de `/mapa`.
- Plano de 700 px de alto en una caja de radio 20 px.
- **Marcadores de zona** (44 px, con etiqueta en píldora de dos líneas: nombre en 800 y estado):

| Estado | Forma | Color | Texto de la etiqueta |
|---|---|---|---|
| `accesible` | Círculo con `Check` | Paso | "Accesible" |
| `desvio` | Rombo con "+N" dentro | Cobalto | "Con desvío de N min" |
| `con_barrera` | Cuadrado redondeado con `Prohibit` | Alto | "{Sin ruta \| Con escalones \| Sin guía \| Con barrera}: N trayectos" |

  - **Nuevo:** un lugar que cambia de estado con las obras lleva la píldora "Nuevo" (Paso) sobre el marcador y borde Paso de 2 px en la etiqueta durante 4 s. Con `prefers-reduced-motion`, sin animación de entrada.
  - Regla de estado (igual que el motor): `con_barrera` si `trayectos_con_barrera > 0`; si no, `desvio` si `minutos_extra > 0,5`; si no, `accesible`.
- **Obras sobre el plano:** cuadrado Pacífico de 36 px con borde blanco de 3 px y el pictograma blanco del tipo (rampa, ascensor, superficie, guía, techado).
  - Simulada: check Paso en la esquina.
  - Seleccionada desde la lista (o al tocarla en el plano): anillo Cobalto y una etiqueta Cobalto con el tipo. La fila correspondiente se resalta y viceversa.
- **Leyenda** fija abajo, en una franja: las tres formas, el pictograma de obra y, a la derecha, "© colaboradores de OpenStreetMap" (siempre visible).
- **Ver como lista** cambia el plano por una tabla: Lugar, Trayectos con barrera que llegan, Desvío promedio y Estado (forma + texto, con "(nuevo)" cuando cambió). `<caption>` "Trayectos que llegan a cada lugar, para {perfil}."
- **Supuestos** (siempre visibles, como texto) van debajo del plano en escritorio, para no dejar el hueco que deja la lista de obras. En móvil, al final de la pestaña Obras.

**Derecha: "Obras que más ayudan"**
- `<h2>` y la bajada "Ordenadas por trayectos que dejan de tener barrera." La bajada cambia con el orden.
- "Ordenar por": segmentado `role="radiogroup"` con Trayectos sin barrera, Minutos ahorrados y Costo.
  - Trayectos: `trayectos_sin_barrera` desc, luego `minutos_ahorrados_prom` desc.
  - Minutos: al revés.
  - Costo: bajo, medio, alto.
  - En los tres órdenes, las obras que no quitan barreras para el perfil siguen al final, ordenadas por costo.
- `<ol>` de **Filas de obra** (componente nuevo, ver abajo). Las obras que no quitan barreras para el perfil van al final, tras un separador "No quitan barreras para {perfil}".

## Componentes nuevos (ref. 17)

### FilaObra
- Grilla: posición (28 px, 800, tabular) | contenido | interruptor. Sin tarjeta: línea fina arriba.
- Contenido:
  - título de la obra (18 px, 700);
  - pictograma del tipo en cuadrado Pacífico de 26 px, más "{Tipo}, {lugar}" en Detalle;
  - impacto en texto: **"20 trayectos sin barrera"** en Paso 800, más ", 0,4 min menos en promedio" (", sin cambio en minutos" si es 0; nada con Todos);
  - perfiles beneficiados con ícono y nombre;
  - costo con ícono `CurrencyCircleDollar` y palabra: "Costo bajo", "Costo medio" o "Costo alto".
- Si no ayuda al perfil: "No quita barreras para Silla de ruedas." en Detalle, y la posición en `--tinta-2`.
- Estados:
  - hover: fondo `#E6EBEA`, radio 12;
  - foco: el anillo `--foco` va en el interruptor;
  - simulada: fondo `--cobalto-tinte`, radio 12, interruptor invertido y la palabra "Simulada". Sobre ese fondo el Paso `#0E7A57` queda en 4,37:1, así que el impacto pasa a `#0B6B4C` (5,34:1).

### InterruptorSimular
- `<button role="switch" aria-checked>`.
- Texto visible corto ("Simular" o "Simulada") con `aria-hidden`. Nombre accesible completo: `aria-label="Simular rampa en la escalera del patio central hacia la Biblioteca"`.
- Riel de 60×34 y perilla de 24, como el `.interruptor` del Lote 0. Encendido se invierte a Pacífico con check en la perilla.
- Deshabilitado: `aria-disabled="true"`, riel punteado y un motivo con `aria-describedby` ("Sin conexión: la simulación necesita al servidor.").

### MarcadorZona y MarcadorObra
Ver la tabla de arriba. En Leaflet son `divIcon` como los del Lote 0, con la forma en SVG y la etiqueta en HTML.

### FranjaComparativa
Ver sección 3. En móvil hay una versión compacta (abajo).

### PanelMas (shell móvil)
- La barra inferior pasa a **Ruta, Comparar, Reportar y Más** (ícono `DotsThree`). Más se ve activo cuando la vista actual está adentro, con `aria-label="Más, estás en Mejorar el campus"`.
- Hoja inferior `role="dialog"` `aria-modal="true"`: título "Más", botón Cerrar de 48 px y cuatro destinos de 56 px con ícono:
  - Mejorar el campus (`Hammer`),
  - ¿Llegas a tu próxima clase? (`Clock`),
  - Plano (`SquaresFour`),
  - Acerca (`Info`).
- El actual se invierte, lleva `aria-current="page"` y el texto "Estás aquí".
- Atrapa el foco. Escape o Cerrar la cierran y el foco vuelve al botón Más.
- En escritorio la cabecera queda con Ruta, Plano, Comparar, Reportar, Mejorar el campus y Acerca.

## Móvil (390×844)
- Encabezado y bajada.
- Chips en una fila con scroll horizontal y snap, que llega hasta el borde.
- Definición de barrera, las cifras en una columna y la frase.
- **Pestañas** `role="tablist"`: "Obras" (primero, ícono `Hammer`) y "Mapa" (`MapTrifold`). Cada panel lleva `role="tabpanel"` y `aria-labelledby`. Flechas izquierda y derecha cambian de pestaña.
- **Franja compacta fija** bajo la cabecera mientras haya obras activas (fondo Pacífico, texto claro): "**Con 1 obra: 0 con barrera** (hoy 20)", más el botón "Armar informe". Va con `role="status"`.
- Pestaña Obras: la franja comparativa completa, la lista de obras (la fila resume perfiles y costo en una línea: "Costo medio. Ayuda a Movilidad reducida, Baja visión y Silla de ruedas.") y los supuestos.
- Pestaña Mapa: botón "Ver como lista" y plano de 460 px en **modo compacto**: etiqueta de una línea con el nombre corto (Entrada, Edificio A, Sala A-201, Biblioteca, Baño B, Casino, Edificio B) y la cantidad de trayectos en un círculo sobre el cuadrado. La leyenda va debajo del plano, no encima.

## Proyector (`?presentacion=1`, Lote 7)
- Texto +20 % (zoom 1,2 sobre 1600×900).
- Se ocultan la barra de accesibilidad, la bajada, la definición, la frase y los supuestos.
- Sin obras se ven las cifras de hoy. Con obras, solo la franja comparativa en una fila, con "Quitar todas" y "Armar informe".
- Plano de 500 px con el encuadre recortado al campus (sin la franja de la calle), así se ve más grande. La leyenda pasa a la columna derecha, bajo las **3 primeras obras**, que van sin la línea de perfiles y costo.
- Todo cabe en 1920×1080 sin scroll.

## Estados
- **Cargando:** esqueletos con la forma de las dos cifras y de tres filas de obra. El plano muestra el contorno punteado de los edificios. `aria-busy="true"` y "Midiendo los trayectos del campus." oculto.
- **Perfil Estándar:** "Para el perfil Estándar ningún trayecto tiene barrera. Elige otro perfil para ver dónde está." (`role="status"`).
- **Ninguna obra ayuda:** "Ninguna de las obras de la lista quita barreras para este perfil." en lugar de la lista, con las obras debajo igual.
- **Aún quedan:** ver sección 3.
- **Error de servidor:** mensaje en línea (borde Alto) "No pudimos medir el campus." más "El servidor no respondió. El perfil que elegiste se mantiene." y el botón "Reintentar". Mismo patrón del Lote 7.

## Informe para la universidad (ref. 16)
- "Armar informe" abre `/campus/informe?perfil=…&obras=…`, una página para imprimir o guardar como PDF: A4 vertical, blanco y negro, una sola página.
- Contenido:
  - título "Propuesta de obras para un campus parejo", con fecha, perfil evaluado, campus y "Datos de ejemplo";
  - las cifras Hoy y Con obras, con el desvío y los tres perfiles;
  - una tabla de obras elegidas con los trayectos que deja sin barrera **en cada perfil** y el costo relativo;
  - el plano en miniatura con tema impreso. Las formas se distinguen sin color: círculo blanco con check, rombo negro, cuadrado negro tachado, obra negra y "Nuevo" con borde;
  - la leyenda en palabras, una frase resumen, los supuestos y el pie.
- CSS: `@page { size: A4; margin: 12mm; }`, sin cabecera ni navegación, texto de 13 a 14 px, `break-inside: avoid` en la tabla.

## Datos (contrato §7 de `docs/contratos.md`)

| Elemento | Campo |
|---|---|
| "20 de 42" | `hoy.trayectos_con_barrera`, `hoy.trayectos_evaluados` |
| Desvío | `hoy.minutos_extra_prom` (`null` con `todos`: no se muestra) |
| Franja comparativa | `con_obras` (`null` sin obras) |
| Filas de obra | `obras[]`, ya ordenadas por el servidor para "Trayectos sin barrera" |
| Marcadores | `zonas[]` (con las obras activas aplicadas) |

- Perfiles en la API: `silla_ruedas`, `movilidad_reducida`, `baja_vision`, `todos`.
- Cada cambio de chip o interruptor hace una nueva consulta, con `obras=id1,id2` en el orden en que se activaron.
- El "Nuevo" se calcula en el cliente comparando el `estado` de cada `nodo_id` con la respuesta anterior.

## Accesibilidad
- Un `<h1>`, secciones con `<h2>`, y el orden de foco igual al visual: chips, Ver como lista, plano, orden, filas, supuestos.
- Todo lo que se hace en el plano se puede hacer en la tabla y en la lista de obras: el plano es `role="img"` con un resumen en `aria-label`.
- El estado nunca va solo en color: forma, ícono y texto.
- Contraste AA en claro, oscuro y alto contraste. En oscuro, el desvío usa `#8FA5FF` con texto `#0A1C29`.
- Zoom al 200 %: las columnas se apilan y la franja comparativa baja a dos filas. Revisado a 720 px sin scroll horizontal.
- `prefers-reduced-motion`: el "Nuevo" aparece sin transición.

## Decisiones y diferencias con el encargo
- **Reparto por lugar de ejemplo:**
  - Las cifras totales son las del motor: 20, 16 y 40 de 42; con rampa y plataforma, 0 con barrera y 0,6 min.
  - Cómo se reparten por lugar (por ejemplo Biblioteca 5 y Casino 5 en Silla de ruedas) y los minutos ahorrados por obra son de ejemplo. Por eso la marca "Datos de ejemplo" va junto al título.
  - Con Silla de ruedas hoy, **los 7 lugares salen con barrera**: si la Biblioteca y el Casino quedan aislados, a todos los demás les llegan trayectos con barrera. Es correcto y hace más visible el cambio al simular la rampa.
- **"Aún quedan":** con el reparto de ejemplo da 31 en Baja visión (40 menos 4, 4 y 1). El encargo ponía 2 como ejemplo.
- **Supuestos bajo el plano** en escritorio, en vez de al final a todo el ancho.
- **Leyenda horizontal** en una franja inferior, con la atribución adentro, para no tapar marcadores.
- **Radios:** la vista usa 12, 20 y píldora. La hoja del panel Más usa `--r-hoja`, que el Lote 7 dejó en 24 px. Si en el repo sigue en 28, se respeta el token.
- **Íconos que hay que sumar a `iconos.md`:** `UsersThree` (Todos los perfiles), `Hammer` (Mejorar el campus, pestaña Obras), `Clock`, `SquaresFour` (Plano), `DotsThree` (Más), `CurrencyCircleDollar` (costo), `Printer` (informe), y, para las obras, `TrendUp`, `Elevator`, `Umbrella` y un SVG de tres barras para guía podotáctil (superficie usa `SquaresFour`).

## Criterios de aceptación
- [ ] Con Silla de ruedas y sin obras se lee "20 de 42", "0,0 min" y la frase del pitch.
- [ ] Al activar la rampa: franja Hoy 20 / Con 1 obra 0, los tres perfiles, el anuncio por aria-live y los 7 lugares con "Nuevo".
- [ ] Todos los perfiles oculta el desvío.
- [ ] Estándar por URL muestra su mensaje.
- [ ] Las obras que no ayudan quedan al final con su frase.
- [ ] "Ordenar por" reordena y cambia la bajada.
- [ ] "Ver como lista" muestra la tabla con la misma información del plano.
- [ ] El interruptor se maneja con teclado y su nombre accesible incluye la obra.
- [ ] Móvil: pestañas accesibles, franja compacta fija y panel Más con Escape y foco de vuelta.
- [ ] Proyector cabe en 1920×1080.
- [ ] El informe imprime en una página A4 y se entiende en blanco y negro.
- [ ] Sin guiones largos, sin "·", sin flechas en textos y sin etiquetas en mayúsculas.

## Archivos sugeridos
```
web/src/views/Campus.jsx              (vista, estado: perfil, obras activas, orden, vista mapa o lista)
web/src/views/CampusInforme.jsx       (impresión)
web/src/components/FilaObra.jsx
web/src/components/InterruptorSimular.jsx
web/src/components/FranjaComparativa.jsx
web/src/components/MarcadorZona.jsx   (divIcon de Leaflet)
web/src/components/PanelMas.jsx       (shell móvil)
web/src/lib/frases.js                 (frase del pitch y anuncio aria-live)
web/src/styles/campus.css
```

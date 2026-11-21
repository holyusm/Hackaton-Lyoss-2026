# Lote 10: Plano de Casa Central (`/plano`)

> **Rediseño (v2) de una vista que ya existe.** `/plano` está implementado con el diseño anterior (#165, #177 y #203). Lo que falta para llegar a este diseño, por fases, está en [PLAN.md](PLAN.md) (issue #220). Dos ajustes respecto de este README:
> - La ruta de salas de #189 (elegir una sala como inicio o llegada y ver la ruta dibujada en el plano) **se mantiene**, aunque los tableros no la muestren.
> - "Cómo llegar sin barreras" lleva a `/?hasta=<id>`, no a `/?destino=<id>`: Inicio lee `?hasta`, y el id sale de `data/campus.json` (`nodoDestino`), porque `data/lugares.json` no existe.

**Para quién:** estudiantes nuevos que no conocen el campus, y cualquiera que necesite encontrar un edificio, ver sus pisos o saber qué hay adentro.

**Objetivo:** en 10 segundos, encontrar un edificio (buscándolo o tocándolo en el plano), ver dónde está, qué pisos tiene y llegar a él sin barreras con un botón. Es la vista "explorar"; la ruta accesible se planifica en Inicio y se ve en `/mapa`.

**Requiere:** el sistema del Lote 0 (`../lote-0-sistema/`: tokens, componentes, íconos) sin cambios, y el plano vectorial de `web/src/plano/` (`CapaPlano`, `plano.js`, `casa-central.geo.json`).

**Diseño:** canvas de Claude Design "Campus sin barreras", página "Lote 10: plano" (https://claude.ai/artifact/21mk7dxCVYazEQbPXgbisx). Los tableros son interactivos: se puede buscar, elegir edificios en la lista o en el plano, cambiar de piso, prender y apagar capas y hacer zoom.

## Archivos

| Archivo | Qué es |
|---|---|
| `README.md` | Esta especificación |
| `datos-ejemplo.json` | Todos los textos de la vista, los 25 edificios con su título, subtítulo, pisos y servicios, el interior del C, los servicios, los nombres de calles, los supuestos, ejemplos de búsqueda y los colores del plano por tema |
| `referencia/*.html` y `*.png` | Cada pantalla, en escritorio 1440 px y móvil 390 px |

### Referencias

| Pantalla | Archivo |
|---|---|
| Escritorio sin selección | `01-escritorio-sin-seleccion` |
| Escritorio con el C elegido, piso 2 | `02-escritorio-edificio-c-piso-2` |
| Escritorio con un edificio sin interior (T, 4 pisos) | `03-escritorio-sin-interior-edificio-t` |
| Escritorio con búsqueda sin resultados ("Edificio H") | `04-escritorio-busqueda-sin-resultados` |
| Modo oscuro, C elegido | `05-escritorio-oscuro-edificio-c` |
| Alto contraste, C elegido | `06-escritorio-alto-contraste-edificio-c` |
| Estado: C en el piso −1, con sus pasillos | `07-escritorio-edificio-c-piso-menos-1` |
| Estado: carga | `08-escritorio-carga` |
| Móvil sin selección | `09-movil-sin-seleccion` |
| Móvil con búsqueda abierta ("ca") | `10-movil-busqueda-abierta` |
| Móvil con el C elegido | `11-movil-edificio-c` |
| Hoja de componentes nuevos | `12-componentes` |

Los `.html` son HTML estático: muestran medidas, textos y colores exactos, pero no tienen la lógica. La lógica está en este README y en los tableros del canvas. En la app el dibujo es Leaflet sobre `CapaPlano`, no el SVG de los tableros.

## Datos (todo sale de `casa-central.geo.json`, nada inventado)

- **Lista de edificios:** features `tipo: "edificio"` con `campus: true`. Se agrupan por `letra` y, si no hay letra, por `nombre`; de cada grupo se queda el polígono más grande. Orden: primero los que tienen letra, con orden numérico (`localeCompare(…, 'es', { numeric: true })`, así M2 va después de M), y luego los que solo tienen nombre, en orden alfabético. En el tablero son 25: A, B, C, D, E, F, K, L, M, M2, P, Q, R, T, U y 10 con nombre.
- **Título y subtítulo:** con letra, "Edificio C". El nombre de OSM se parte en " - " o ", ": "Edificio K - CIAC" da título "Edificio K" y subtítulo "CIAC". Sin subtítulo, la fila muestra los pisos.
- **Pisos:** `pisos` de OSM cuando existe ("4 pisos", "1 piso"); si no, "Pisos por confirmar". El C es la excepción: "Pisos −1, 1 y 2". El −1 se escribe con signo menos (U+2212), no con guion.
- **Interior:** solo el C. Piso 2: salas C201 a C247 (33 con número, 2 baños y 5 espacios sin número). Piso −1: 3 pasillos. Piso 1: sin interior. Al elegir el C se abre en el piso 2.
- **Servicios dentro de un edificio:** un servicio cuyo punto cae dentro del polígono del edificio cuenta como suyo para la búsqueda (Casino en Comedores, Radio USM en A, Banco Santander en C, Sala de Estar y Ocio en B, AC3E en un edificio sin nombre).
- **Supuestos declarados:**
  - `relation/17542343` es el **Edificio B**, con el subtítulo "Edificio central, nombre por confirmar".
  - H, O, J, I, N, F2 y P2 no están en OSM: no se dibujan ni aparecen en la lista.
  - "Comerdores" se muestra "Comedores"; la Federación se muestra con título "FEUTFSM" y subtítulo "Federación de Estudiantes".
  - Edificio Costa Santa María es residencial y vecino: se dibuja como vecino y no entra a la lista. Si en el geojson tiene `campus: false`, no hay nada que hacer.
  - Accesibilidad de cada edificio: "Por levantar" hasta el levantamiento en terreno.
  - "Estás aquí" es un punto simulado en el Acceso Av. España (-33.033897, -71.595230).
- **Atribución:** "© colaboradores de OpenStreetMap", siempre visible.

## Búsqueda

- Normaliza mayúsculas, tildes y espacios (`toLowerCase()`, `normalize('NFD')` y quitar marcas).
- Si lo escrito es un código de edificio (una letra y a lo más un dígito, con o sin "Edificio" delante: "c", "M2", "Edificio H"), busca **solo por letra exacta**. Así "c" no trae a todos los que tienen una c en el nombre.
- Si no, busca el texto dentro de título y subtítulo y, si no aparece ahí, en los servicios del edificio. Cuando el resultado viene por un servicio, la fila cambia su subtítulo a "Servicio: Casino" para que se entienda por qué apareció.
- Conteo en `aria-live="polite"`: "25 edificios", "1 edificio" o "Sin resultados para «xyz»".
- Sin resultados: "Prueba con la letra del edificio o un servicio, como Casino." Si lo buscado es una de las letras que faltan en OSM, se suma: "El Edificio H todavía no está en OpenStreetMap, por eso no aparece en el plano." Botón secundario "Ver todos los edificios" que borra la búsqueda y devuelve el foco al campo.

## Escritorio (≥ 900 px)

1. **Cabecera** (Shell del Lote 0, 72 px) con "Plano" activo (`aria-current="page"`, invertido), entre Ruta y Comparar.
2. **Barra superior:** `<h1>` "Plano de Casa Central" (36 px, 800) y "Av. España 1680, Valparaíso" en `--tinta-2`. A la derecha, botón primario de 60 px "Planificar una ruta accesible" con `NavigationArrow`, que lleva a `/`.
3. **Dos columnas** con 20 px de separación, que llenan el alto disponible (la vista ocupa `100dvh` y no hace scroll; la lista sí). Los tableros miden 1440×900:
   - **Lista**: `<aside aria-label="Edificios del campus">`, 380 px, superficie con radio 20.
     - Etiqueta visible "Buscar edificio o servicio" y `input type="search"` de 60 px con `MagnifyingGlass` y botón "Borrar búsqueda" (48 px) cuando hay texto. Con texto, el borde pasa a Pacífico y el texto a 800, igual que `CampoLugar`.
     - Conteo bajo el campo.
     - `<ul>` con scroll propio y botones **Fila de edificio** de 56 px como mínimo (ver Componentes).
   - **Plano**: el resto del ancho, radio 20. Contenedor con `role="region"`, `aria-roledescription="plano"`, `tabindex="0"`, `aria-describedby` hacia la ayuda de teclado y un `aria-label` que cambia: "Plano de Casa Central." o "Plano de Casa Central. Edificio C elegido, piso 2."
     - **Capas** arriba a la izquierda (288 px).
     - **Zoom** arriba a la derecha: tres botones de 48 px en fila (Acercar, Alejar, "Ver todo el campus"), en un `role="group"` "Zoom del plano". Van en fila para que la ficha quepa debajo.
     - **Norte, escala y atribución** abajo a la izquierda, en una sola píldora: flecha del norte con la letra N, barra de escala métrica (10, 20, 50, 100 o 200 m, la que mida al menos 56 px) y "© colaboradores de OpenStreetMap".
     - **Ficha del edificio** abajo a la derecha, 360 px, solo con un edificio elegido.
   - **Plano angosto** (menos de 760 px de ancho, o sea pantallas de 900 a 1200 px): la ficha baja y ocupa todo el ancho del plano, con alto máximo de la mitad y scroll propio; la píldora de escala y atribución sube sobre ella; Capas parte plegado (si la persona lo abre o lo cierra, se respeta su elección). El encuadre usa el tamaño real del plano y se recalcula al cambiar el tamaño de la ventana.

### El dibujo del plano

Orden de capas, de abajo hacia arriba: fondo, vecinos, contorno del campus, Patio Central, calles (borde y relleno), senderos, escaleras, edificios sin nombre, edificios del campus, edificio elegido, interior del C, textos (Patio Central, calles, letras, números de sala), baños, servicios, placa del elegido y "Estás aquí".

| Elemento | Cómo se dibuja |
|---|---|
| Edificio del campus | Relleno `edif`, borde `edifBorde` de 1,25 px (2 px en alto contraste). Se puede tocar; hover con `hover` |
| Edificio sin nombre | Relleno `edifSuave` y borde fino: se ve que no es del mismo tipo y no se puede tocar |
| Edificio elegido | Relleno Cobalto tinte y borde Cobalto de 3 px (4 px en alto contraste), más una placa Cobalto con su letra. Sin interior a la vista, la placa va en el centro; con interior, se omite para no tapar las salas |
| Letras de edificio | 15 px (14 en móvil), 800, con halo de 4 px del color `halo` |
| Senderos | Línea de 1,6 px a trazos (4 y 3 px), color `sendero` |
| Escaleras | Línea de 5 px con trazos cortos (1,4 y 1,8 px), que se lee como peldaños, color `escalera` |
| Calles | Borde `calleBorde` y relleno `calle`, en metros (8,5 y 6 unidades), así crecen con el zoom |
| Nombres de calles | 13 px, 700, `rotulo` con halo, girados según la calle: Av. España, San Luis, General Bari, Valdés, Av. Los Placeres y Av. Matta |
| Servicio | Círculo de 28 px, blanco con borde Pacífico de 2 px y la letra en 800 (P, C, B, S, R, $, I). `<title>` con "Tipo: nombre". Si dos chocan en pantalla, el segundo se corre 30 px a la derecha |
| Estás aquí | Punto Cobalto de 18 px con borde blanco de 3 px y halo de 44 px al 18 %. Etiqueta en píldora Pacífico "Estás aquí, Acceso", a la izquierda del punto; si no cabe, a la derecha; si tampoco, encima |
| Sala (C, piso 2) | Relleno `sala`, borde fino `salaBorde` (0,75 px). Número en 11 px, 700, solo si cabe en la sala y no choca con otro número ni con un baño |
| Baño (C, piso 2) | Relleno `bano`, borde Paso de 1,5 px y el ícono `Toilet` en un círculo Paso de 22 px. Forma e ícono, no solo color |
| Pasillo (C, piso −1) | Línea de 2,4 m con borde de 3,4 m, más el texto "Pasillos del piso −1" |
| Carga | Solo el contorno del campus, a trazos, y la píldora "Dibujando el plano de Casa Central" con `role="status"` |

Los colores de cada tema están en `datos-ejemplo.json`, en `tokensDelPlano` (claro, oscuro y alto contraste). Salen de los tokens del Lote 0; los que no existen allí (por ejemplo `edifSuave` o `vecino`) son tonos del plano y conviene declararlos en `CapaPlano` o como variables `--plano-*`, sin tocar los tokens existentes. Todos los pares cumplen AA: texto 4,5:1 y bordes o íconos 3:1, en los 3 temas.

### Cámara

- **Al cargar y con "Ver todo el campus":** encuadra todo el contorno del campus en la zona libre del plano (a la derecha del panel de Capas y sobre la píldora de escala).
- **Al elegir un edificio:** encuadra el edificio en la zona libre a la izquierda de la ficha. Zoom máximo 3 para un edificio cualquiera, para que se vea su entorno, y 3,6 para el C, para que se lean las salas. En el piso −1 del C el encuadre incluye los pasillos, que siguen hacia el Edificio P. En Leaflet: `flyToBounds(bounds, { paddingTopLeft, paddingBottomRight, maxZoom })`, con el padding derecho igual al ancho de la ficha más 32 px.
- **Teclado del plano:** con el foco en la región, las flechas lo mueven 60 px, + y − acercan y alejan, y Escape cierra la ficha.
- `prefers-reduced-motion`: `flyToBounds` pasa a `fitBounds` sin animación.

### Ficha del edificio

- Insignia grande (56 px), `<h2>` con el título (26 px, 800), el subtítulo si existe (17 px, 700) y los pisos en `--tinta-2`. Botón "Cerrar ficha" de 48 px (×).
- **Piso:** grupo de chips de 48 px (`role="radiogroup"`, etiquetado por el texto "Piso"). Solo el chip elegido tiene `tabIndex=0`; flechas izquierda y derecha (y arriba y abajo) eligen el anterior o el siguiente, Inicio y Fin el primero y el último. Si no se conocen los pisos, **el grupo no aparece**: no se inventa un "piso 1".
- **Nota** (15 px, `--tinta-2`, con ícono):
  - Con interior, piso 2: "Plano interior del piso 2 según OpenStreetMap. Las salas marcadas con el ícono de baño son baños." (ícono `Check`).
  - Con interior, piso −1: "Plano interior del piso −1 según OpenStreetMap: sus 3 pasillos."
  - Con pisos conocidos y sin interior (también el piso 1 del C): "Plano interior pendiente: se agrega con el levantamiento en terreno." (ícono `Info`).
  - Sin pisos conocidos: "Número de pisos y plano interior por confirmar en terreno."
- **Accesibilidad:** `<h3>` y un `<dl>` con Entrada sin escalones, Ascensor y Baño accesible; cada valor es "Por levantar" con el ícono `Question`.
- **"Cómo llegar sin barreras"**: botón primario de ancho completo. Lleva a `/?destino=<id>` si ese edificio existe en `data/lugares.json`; si no, a `/`.
- Se anuncia con un `aria-live="polite"` aparte que dice solo el título ("Edificio C").
- **Cerrar** (o Escape en el plano) deselecciona, vuelve el plano a su encuadre y devuelve el foco a la fila de ese edificio en la lista.

### Elegir un edificio

Tocarlo en el plano o en la lista hace lo mismo: resalta el polígono, encuadra, abre la ficha en el piso inicial (2 para el C, 1 si se conocen los pisos, ninguno si no), invierte la fila de la lista y la deja visible con scroll si estaba fuera de vista. **El foco no se mueve**: si elegiste desde la lista, sigue en la lista. El panel de Capas se pliega para dejar ver el plano, y se vuelve a abrir con su botón.

## Móvil (< 900 px)

1. Cabecera de 64 px (wordmark y "Accesibilidad") y barra inferior de 76 px con "Más" activo (`aria-label="Más, estás en Plano"`), porque Plano vive dentro del panel "Más". La página tiene un `<h1>` "Plano de Casa Central" oculto a la vista.
2. **Plano a pantalla completa** entre la cabecera y la barra inferior, sin escala. La capa de **nombres de calles parte apagada**.
3. **Capas:** el mismo panel del escritorio, plegado a la izquierda bajo la búsqueda (solo el botón "Capas" de 48 px). Al abrirlo se ven las 4 casillas, con Nombres de calles sin marcar, y la leyenda de servicios, que también declara "Estás aquí, punto simulado".
4. **Búsqueda flotante** arriba (12 px de margen, 52 px de alto, radio 12, sombra). La etiqueta "Buscar edificio o servicio" va visible, en 13 px, dentro del campo, sobre el texto. Al escribir se abre debajo un panel con el conteo y **6 resultados como máximo** (filas de 56 px); si hay más: "Se ven 6 de 20. Sigue escribiendo para acotar." Elegir un resultado cierra el panel y borra el texto.
5. **Zoom** a la derecha, bajo la búsqueda: Acercar, Alejar y Ver todo (48 px, en columna).
6. **Atribución** en una píldora sobre la hoja, abajo a la derecha.
7. **Hoja inferior** (radio superior 20, asa decorativa de 44×5 px):
   - Sin selección (150 px): "Toca un edificio o búscalo" y accesos rápidos de 48 px a C, A, U (con el texto "Biblioteca") y M, con nombre accesible completo ("Edificio U, Biblioteca").
   - Con selección (380 px con pisos, 312 sin pisos): insignia de 48 px, `<h2>` con el título, subtítulo y pisos en una línea, chips de piso, la nota, la fila "Accesibilidad: por levantar" con `Question`, y dos botones de 60 px: "Otro edificio" (secundario: deselecciona y pone el foco en la búsqueda) y "Cómo llegar" (primario).
   - Al elegir, el plano encuadra el edificio en la parte visible: bajo la búsqueda, sobre la hoja y a la izquierda del zoom (padding inferior igual al alto de la hoja, como `alturaHoja` en `MapaRuta`). Zoom máximo 2,4 para el C y 3 para los demás.

## Componentes nuevos

Todos se arman con piezas del Lote 0 y aparecen con sus estados en `referencia/12-componentes.png`.

| Componente | Anatomía y estados |
|---|---|
| **FilaEdificio** | `<button aria-pressed>` de 56 px mín., radio 12, padding 8/12/8/8. Insignia de 40 px, título 18 px 800, subtítulo 15 px `--tinta-2`. Normal: transparente. Hover: fondo `#E9EEEE` (oscuro `#1A3446`). Foco: `--foco`. Elegida: fondo Pacífico, texto claro, insignia invertida y `Check` a la derecha |
| **InsigniaLetra** | Radio 12. Chica 40 px (letra 20 px; dos caracteres, 17 px) en Cobalto tinte con texto `--sobre-tinte`; grande 56 px (30 px) en Cobalto con texto blanco. Sin letra: fondo `--niebla` y el ícono `Buildings`. Siempre `aria-hidden` |
| **FichaEdificio** | Ver arriba. Variantes: con interior, sin interior, sin pisos conocidos |
| **ChipPiso** | Píldora de 48 px, mín. 56 de ancho, borde 2 px. Normal: superficie y borde `--borde-control`. Elegido: Pacífico con `Check`. Foco: `--foco` |
| **PanelCapas** | Tarjeta de 288 px, radio 20. Título como botón de 48 px con `Stack` y flecha (`aria-expanded`). Dentro, un `<fieldset>` con `<legend>` oculta "Capas del plano" y 4 casillas reales de 22 px (filas de 44 px) con una muestra de la línea a la derecha. Debajo, "Servicios": leyenda en 2 columnas con el círculo de cada letra, y "Estás aquí, punto simulado" |
| **MarcadorAqui** y **MarcadorServicio** | Ver la tabla del dibujo. Tamaño fijo en pantalla; los servicios no entran al Tab |

## Accesibilidad

- **El plano no es la única vía:** todo lo que se hace tocando el mapa se hace desde la lista, con teclado y lector de pantalla. Los polígonos no entran al Tab.
- Orden de Tab en escritorio: saltar a la lista, cabecera, botón de ruta, búsqueda, filas, región del plano, Capas, zoom, ficha.
- `aria-live`: conteo de la búsqueda y título de la ficha. La región del plano actualiza su `aria-label`.
- El resaltado se distingue por borde grueso y placa con letra; los baños por el ícono; los servicios por la letra; "Estás aquí" por el halo y la etiqueta. Nada depende solo del color.
- Foco doble del Lote 0 en todo lo enfocable, también en los 3 temas (en oscuro el anillo interior es claro). Ningún contenedor con `overflow: hidden` debe recortar el anillo: el panel de Capas no lleva `overflow`, la lista deja 8 px arriba, y en móvil el plano, que llena la pantalla, dibuja el anillo hacia adentro (`inset`).
- "Saltar a la lista de edificios" (escritorio) y "Saltar a la búsqueda de edificios" (móvil) son el primer elemento enfocable y se ven al recibir el foco, como `.saltar` del Lote 0.
- Zoom al 200 %: desde 1440 px se pasa a 720 px de ancho y aplica el diseño móvil, sin scroll horizontal.

## Criterios de aceptación

- [ ] `/plano` carga con el campus completo encuadrado, la atribución OSM y "Estás aquí" con su etiqueta.
- [ ] La lista muestra 25 edificios en el orden indicado (M2 después de M) y sin H, O, J, I, N, F2 ni P2.
- [ ] Elegir desde la lista o desde el plano da el mismo estado en ambos lados, encuadra, abre la ficha y deja el foco donde estaba.
- [ ] El C abre en el piso 2 con sus salas y los 2 baños con ícono; el −1 muestra los 3 pasillos; el 1 muestra la nota de sin interior.
- [ ] Un edificio sin pisos conocidos no muestra chips de piso.
- [ ] "c" encuentra solo el C; "casino" encuentra Comedores con "Servicio: Casino"; "Edificio H" explica que no está en OSM.
- [ ] Las 4 capas se prenden y apagan, también en móvil, donde Nombres de calles parte apagada.
- [ ] Entre 900 y 1200 px la ficha baja bajo el plano y el edificio elegido queda a la vista.
- [ ] "Cerrar ficha" y Escape devuelven el foco a la fila del edificio.
- [ ] Teclado completo, lector de pantalla, 200 %, 390 px y 1440 px, claro, oscuro y alto contraste.
- [ ] `/mapa` y `/comparar` se ven igual que antes: los props nuevos de `CapaPlano` son opcionales.

Prototipo estudiantil. No es un servicio oficial de la USM.

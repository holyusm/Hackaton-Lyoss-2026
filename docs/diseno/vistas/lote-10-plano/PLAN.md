# Plan del Lote 10 v2 (`/plano`)

Implementa @holyusm (issue #220). Rama `220-plano-v2` desde `main` fresco. Commits chicos, stageando solo tus archivos.

`/plano` ya existe con el diseño anterior. Este plan lista **solo lo que falta** para llegar al [README](README.md) nuevo. Se mantiene la ruta de salas de #189 (`TuRuta`, `CapaRuta`, salas en la ficha y en la búsqueda).

## Quién toca qué

| Archivo | Dueño hoy | Para este lote |
|---|---|---|
| `web/src/views/Plano.jsx`, `Plano.css`, `web/src/views/plano/*` | @juaquo15 | Traspaso a @holyusm (anunciado en el tablero) |
| `web/src/plano/edificios-lib.js`, `edificios.js`, `CapaPlano.jsx`, `plano.js`, `plano.css` | @holyusm (traspasado a @juaquo15) | Vuelven a @holyusm. En `CapaPlano` solo se agregan props **opcionales** |
| `web/src/lib/edificios.test.js` | @juaquo15 | Se actualiza junto con `edificios-lib.js` |
| `web/src/components/Shell.jsx` | @Gxppe | Pedir traspaso de 3 cambios (fase 6) |
| `MapaRuta.jsx`, `MapaComparar.jsx`, `Inicio.jsx` | @Gxppe | **No se tocan.** `/mapa`, `/comparar` e Inicio tienen que verse igual |

**Regla clave:** `CapaPlano` y `plano.css` también los usan `/mapa`, `/comparar` e Inicio. Todo el estilo nuevo del dibujo va detrás de un prop opcional `variante="plano"` (que pone una clase raíz, por ejemplo `.plano-v2`), nunca cambiando los estilos que ya existen.

## Fase 1: datos y búsqueda (`edificios-lib.js` y pruebas)

Va primero porque se prueba con `npm test`, sin navegador.

- **Costa Santa María:** en el geojson trae `campus: true` (`way/1082210883`). Hay que excluirlo de la lista (por ejemplo, en `EXTRA`) y dibujarlo como vecino (`plano.js`, `estilo`). La lista queda en **25**.
- **Título y subtítulo:** partir el nombre en `" - "` **o** `", "`, para que quede FEUTFSM / Federación de Estudiantes. Sin subtítulo, la fila muestra los pisos; se quita el relleno "Edificio del campus".
- **`textoPisos(e)`** (nuevo): "Pisos −1, 1 y 2" para el C, "4 pisos", "1 piso" o "Pisos por confirmar". El menos es U+2212.
- **`pisosDe`** devuelve `[]` si no se conocen los pisos, y **`pisoInicial`** devuelve `null`. No se inventa un piso 1.
- **Búsqueda (`filtrarEdificios`):**
  - Modo código (`/^(edificio\s+)?[a-z]\d?$/` sobre el texto normalizado): busca solo por la letra exacta.
  - Si no es un código, busca en título y subtítulo y, si no hay coincidencia, en `e.servicios`: los servicios cuyo punto cae dentro del polígono, calculados una vez al crear la lista. En ese caso devuelve `motivo: 'Servicio: Casino'`.
  - Los resultados salen **en el orden de la lista**, sin ordenar por prioridad.
  - Exportar `norm` y `FALTAN_EN_OSM = ['H','O','J','I','N','F2','P2']`.
  - Quitar `ALIAS` si "casino" y "biblioteca" ya funcionan sin él.
- **Pruebas** (`edificios.test.js`): 25 edificios; "c" da solo el C; "ca" da 5; "casino" da Comedores con su motivo; "Edificio H" está en `FALTAN_EN_OSM`; un edificio sin pisos da `[]`. Reescribir la prueba de prioridad (líneas 84 a 114).

## Fase 2: lista y ficha en escritorio (`Plano.jsx` y `Plano.css`)

- **FilaEdificio:**
  - Elegida: fondo Pacífico, texto claro, insignia invertida y `Check` a la derecha.
  - Hover: `--plano-hover-fila`.
  - Si el resultado viene por un servicio, el subtítulo dice "Servicio: X".
- **InsigniaLetra:**
  - Chica: 40 px, Cobalto tinte con `--sobre-tinte`, letra de 20 px (17 px si son dos caracteres).
  - Sin letra: fondo `--plano-niebla` y el ícono `Buildings`. Hoy pone la inicial del título, lo que confunde.
  - Grande: 56 px. Siempre `aria-hidden`.
- **Búsqueda:**
  - Botón "Borrar búsqueda" de 48 px cuando hay texto.
  - Sin resultados: el texto de ayuda, la línea extra si la letra está en `FALTAN_EN_OSM`, y el botón "Ver todos los edificios", que limpia la búsqueda y devuelve el foco al campo.
- **Ficha:**
  - Título de 26 px. El subtítulo va en su propia línea (17 px, 700), y los pisos en otra, en `--tinta-2`.
  - Chips de piso: mínimo 56 px de ancho, `Check` en el elegido, `aria-labelledby` hacia el texto "Piso". Sin pisos, el grupo no aparece.
  - Nota: 15 px, con ícono `Check` o `Info`. El piso −1 tiene su propio texto ("…sus 3 pasillos.").
  - Accesibilidad: `<h3>` y `<dl>`.
  - CTA **primario**, que lleva a `/?hasta=<id>`.
  - El `aria-live` dice solo el título.
- **Cerrar ficha / Escape:** el foco vuelve siempre a la fila del edificio.
- **Al elegir un edificio:** se pliega Capas y la fila queda visible con `scrollIntoView({ block: 'nearest' })`.
- **#189:**
  - `TuRuta` deja de ir sobre la búsqueda. Se muestra solo cuando hay `hastaId` o una ruta, bajo el conteo y plegable.
  - Las salas y los botones "Salir desde aquí" / "Ir aquí" van en la ficha, después de la nota, en una sección "Salas de este piso".

## Fase 3: controles y cámara

- **PanelCapas** (nuevo, `web/src/views/plano/PanelCapas.jsx`):
  - Tarjeta de 288 px. El título es un botón de 48 px con `Stack` y una flecha (`aria-expanded`).
  - Dentro: un fieldset con la leyenda oculta "Capas del plano" y 4 casillas, cada una con una muestra de su línea.
  - Debajo: la leyenda de servicios en 2 columnas y "Estás aquí, punto simulado".
  - Sin `overflow`, para no recortar el anillo de foco.
- **Zoom:** en fila, dentro de `role="group"` "Zoom del plano".
- **Píldora abajo a la izquierda:** la N, la escala (10, 20, 50, 100 o 200 m, la que mida al menos 56 px) y "© colaboradores de OpenStreetMap".
  - En el `MapContainer`, `attributionControl={false}`.
  - Se quita la píldora `NOTA_DATOS`, porque el aviso ya está en Capas y en Acerca.
- **Región del plano:** `tabIndex={0}`, `aria-roledescription="plano"`, `aria-describedby` hacia la ayuda de teclado y `keyboardPanDelta={60}`.
- **Cámara:**
  - Padding asimétrico: a la izquierda, el ancho de Capas si está abierto; a la derecha, el ancho de la ficha + 32; abajo, el alto de la píldora. Reutilizar `web/src/lib/paddingMapa.js`.
  - En el piso −1 del C, el encuadre incluye los pasillos.
  - `CapaRuta` solo reencuadra cuando cambia la ruta, para no pelear con `Encuadre`.
- **Plano angosto** (menos de 760 px, medido con `ResizeObserver` en el contenedor):
  - La ficha ocupa todo el ancho, con alto máximo del 50 % y scroll propio.
  - La píldora sube sobre la ficha.
  - Capas parte plegado.
  - Se vuelve a encuadrar al cambiar de tamaño.

## Fase 4: dibujo del plano (`plano.css` y `CapaPlano.jsx` con `variante="plano"`)

- **Colores:** variables `--plano-*` en `plano.css` para los 3 temas, con los mismos selectores que `tokens.css` (`prefers-color-scheme`, `[data-tema="oscuro"]`, `[data-tema="contraste"]`). Los valores salen de `datos-ejemplo.json` → `tokensDelPlano`.
  - Las que ya existen como token se mapean a él: `edifBorde`, `salaBorde` y `rotulo` → `--tinta-2`; `sel` → `--cobalto-tinte`; `selBorde` y `aqui` → `--cobalto`; `banoBorde` → `--paso`.
  - Hay que crear: `calle`, `calleBorde`, `edifSuave`, `hover`, `sendero`, `pasillo`, `bano`, `aquiHalo`, `hoverFila` y `niebla`, más los anchos `bwEdif` y `bwSel` (2 y 4 px en alto contraste).
- **Una fila de la tabla "El dibujo del plano" del README a la vez:**
  - Edificios sin nombre en `edifSuave`.
  - Placa Cobalto con la letra en el edificio elegido, cuando no hay interior a la vista.
  - Letras de los edificios en 15 px (14 en móvil), con halo.
  - Senderos de 1,6 px, con trazos de 4 y 3.
  - Escaleras de 5 px, con trazos de 1,4 y 1,8.
  - Calles en dos capas, cuyo grosor crece con el zoom.
  - "Estás aquí": punto de 18 px, halo de 44 px y etiqueta Pacífico a la izquierda.
  - Salas con relleno; su número (11 px) se muestra solo si cabe.
  - Baños con el ícono en un círculo Paso de 22 px.
  - Pasillos gruesos, con el rótulo "Pasillos del piso −1".
  - Rótulo "Patio Central".
  - Servicios con `<title>` "Tipo: nombre"; si dos chocan, el segundo se corre 30 px.
- **Estado de carga:** opcional, porque el geojson viene en el bundle. Va al final.

## Fase 5: móvil (< 900 px)

- **Búsqueda:**
  - Campo de 52 px y radio 12, con la etiqueta visible en 13 px dentro del campo.
  - Elegir un resultado cierra el panel y borra el texto.
  - Con más de 6 resultados: "Se ven 6 de N. Sigue escribiendo para acotar."
- **Capas:** el mismo `PanelCapas`, plegado a la izquierda bajo la búsqueda. Nombres de calles parte apagada.
- **Hoja sin selección** (150 px): accesos rápidos a C, A, U ("Biblioteca") y M, con su nombre accesible completo.
- **Hoja con selección** (380 px con pisos, 312 sin pisos):
  - Insignia de 48 px, `<h2>`, y el subtítulo y los pisos en una sola línea.
  - Chips de piso, la nota y la fila "Accesibilidad: por levantar".
  - Dos botones de 60 px: "Otro edificio" (secundario; deselecciona y pone el foco en la búsqueda) y "Cómo llegar" (primario).
- **Encuadre:** el padding inferior es el alto real de la hoja. El zoom máximo es 2,4 para el C y 3 para los demás; son valores de la escala del tablero y hay que traducirlos a niveles de Leaflet.
- **Sin escala.** La atribución va en una píldora sobre la hoja, abajo a la derecha.
- **Foco:** el plano dibuja su anillo hacia adentro (`inset`).

## Fase 6: Shell (pedir traspaso a @Gxppe, al empezar)

- Saltos propios de `/plano`: "Saltar a la lista de edificios" en escritorio y "Saltar a la búsqueda de edificios" en móvil.
- En móvil, el botón "Más" lleva `aria-label="Más, estás en Plano"` cuando la ruta está en `EN_MAS`.
- Que `.pie-legal` no agregue scroll en `/plano` (`Shell.jsx:113`).

## Si falta tiempo

Hacer primero las fases 1 y 2, después la 5 (es lo que más se ve en la demo y en el celular) y al final la 3 y la 4. La fase 6 se pide al empezar, porque depende de otra persona.

## Aceptación

- Las casillas de "Criterios de aceptación" del [README](README.md).
- La ruta de salas de #189 sigue funcionando: elegir una sala del C como llegada y ver la ruta.
- `/mapa`, `/comparar` e Inicio se ven igual que antes.
- `npm test` y `npm run build` pasan.
- El PR (`Closes #220`) lleva capturas de escritorio y de móvil, y una del C en el piso 2 en tema oscuro.

## Fuera de alcance

- Dibujar los edificios que faltan (H, O, J, I, N, F2, P2) o el interior de otros pisos: eso depende del levantamiento en terreno (#12).

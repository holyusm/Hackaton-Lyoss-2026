Carpeta de data: ver AGENTS.md §4 y docs/contratos.md

## Supuestos de distancias y tiempos

Distancias del recorrido de cada tramo (ver "Trazado de los tramos"), medidas con haversine sobre las coordenadas del plano (OpenStreetMap) y redondeadas a 5 m. Tiempos a 1,2 m/s más 2 s por escalón; el ascensor incluye la espera. Son aproximados.


## Supuesto: acceso sin escalones de la entrada principal (simulado)

El nodo `entrada-principal` está anclado en el "Acceso Av. España (escalas frente al Edificio A)" de `web/src/plano/README.md`, que es una escalera con escalones. Aun así, el tramo `t1` (a Patio central) y el punto QR `p1` indican una rampa sin escalones. Eso es un dato de ejemplo (simulado) y no está verificado en terreno. OSM no etiqueta ninguna rampa en el campus.

Mientras no se verifique, `t1.notas` lo declara y `p1` lo dice en la voz y en la indicación al Patio central. No se cambió ninguna `lat`/`lng`. Pendiente: confirmar en terreno un acceso con rampa o sin escalones y mover ahí el anclaje (propuesta para `@holyusm`, dueño del plano). Cuando esté verificado, se quita la advertencia.


## Trazado de los tramos

Cada tramo a pie lleva `trazado`: la lista de puntos `[lat, lng]` intermedios entre `desde` y `hasta` (sin incluirlos). `metros` es el largo de la línea `desde`, trazado, `hasta` (`node motor/recalcular-metros.js`). El mapa dibuja esa línea y los pasos numerados van a la mitad de su largo. Los tramos con ascensor no llevan trazado.

Cómo se generó (supuesto, sin levantamiento en terreno): una búsqueda del camino más corto que prefiere los senderos de `web/src/plano/casa-central.geo.json` y, donde el mapa de OSM no los tiene, cruza terreno abierto con un recargo de 1,6. No cruza edificios del plano; solo entra al edificio donde empieza o termina el tramo. Los senderos de OSM están partidos en varios trozos, por eso a veces el recorrido da vueltas (p. ej. `t1`, de 130 m en línea recta a unos 270 m). Las escaleras de OSM solo se usan en tramos con escalones (`t6`): ningún recorrido sin escalones baja por las escalas de Av. España. Las líneas dentro de un edificio (ascensor, salas, pasarela) son rectas y supuestas.

Los nodos que caían justo en el centro de un edificio (donde el plano dibuja su letra) se corrieron unos 10 m dentro del mismo edificio, para que los marcadores no tapen la letra: `ascensor-a`, `edificio-a-p2`, `sala-a201`, `biblioteca` y `bano-b`.

`motor/trazado.test.js` valida que `metros` calce con el largo del trazado, que ninguna línea cruce un edificio y que no haya vueltas absurdas.


## Cómo agregar una sala

Las salas y los baños interiores viven en `data/levantamiento/salas.csv` y los edificios que las contienen en `data/levantamiento/edificios.csv`. Se editan a mano (en una hoja de cálculo o en un editor) a medida que se levanta cada edificio:

1. **Edificio nuevo:** una fila en `edificios.csv`: `letra,entrada_lat,entrada_lng,conecta_a,ascensor,pisos`. `conecta_a` es el id de un nodo que ya existe en `campus.json` (p. ej. `edificio-b` o `patio-central`); `ascensor` es `si`, `no` o `por_levantar`; `pisos` es una lista con `;` (p. ej. `1;2;3`).
2. **Sala o baño:** una fila en `salas.csv`: `id,nombre,tipo,edificio,piso,departamento,lat,lng,notas`. `tipo` es `sala` o `bano` (un laboratorio o una oficina va como `sala` y se distingue por el `nombre`). `departamento` es texto libre y opcional: sale en la ficha y se puede buscar. `lat` y `lng` son opcionales; sin ellas la sala se pone cerca del pasillo de su piso.
3. **Generar:** `node data/levantamiento/salas.js` valida y muestra el resumen; con `--escribir` actualiza `data/campus.json`. Es idempotente: lo que genera lleva `"generado": "salas"` y se recrea en cada corrida; lo escrito a mano no se toca. `motor/salas.test.js` falla si `campus.json` no está al día con los CSV.
4. **Comprobar:** `npm test`. La sala ya aparece en el buscador de Inicio y se puede rutear.

Qué crea el generador por cada edificio: un nodo `edificio-<x>` (la puerta) si no existe, un pasillo oculto `<x>-p<n>` por piso, una escalera entre pisos consecutivos (20 escalones por piso), el ascensor `ascensor-<x>` si `ascensor=si` (con `no` o `por_levantar` no hay ascensor y la silla de ruedas no llega a los pisos altos: eso es justamente la barrera), un tramo de cada sala a su pasillo y un tramo de acceso desde `conecta_a`.

## Supuesto: interior simulado

Solo el Edificio C, piso 2, tiene salas en OpenStreetMap: las 28 salas y los 2 baños de la semilla salen de ahí (`node data/levantamiento/semilla-salas-c.mjs`, que se corrió una sola vez). Todo lo demás del interior es **simulado y está por levantar**: la puerta del edificio (`edificio-c`, en `edificios.csv`), el pasillo de cada piso (en el centro de las salas), las escaleras (20 escalones por piso), el **ascensor del C** (`ascensor-c`: no hay dato real de que exista), y los recorridos recto entre pasillo y sala. El acceso del C va por el Edificio B (`conecta_a=edificio-b`, 45 m en línea recta). Las 5 salas sin nombre en OSM no están: se agregan a mano cuando se identifiquen.

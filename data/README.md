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

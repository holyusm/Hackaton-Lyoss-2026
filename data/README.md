Carpeta de data: ver AGENTS.md §4 y docs/contratos.md

## Supuestos de distancias y tiempos

Distancias en línea recta entre los puntos del plano (OpenStreetMap), redondeadas a 5 m. Tiempos a 1,2 m/s más 2 s por escalón; el ascensor incluye la espera. Son aproximados.


## Supuesto: acceso sin escalones de la entrada principal (simulado)

El nodo `entrada-principal` está anclado en el "Acceso Av. España (escalas frente al Edificio A)" de `web/src/plano/README.md`, que es una escalera con escalones. Aun así, el tramo `t1` (a Patio central) y el punto QR `p1` indican una rampa sin escalones. Eso es un dato de ejemplo (simulado) y no está verificado en terreno. OSM no etiqueta ninguna rampa en el campus.

Mientras no se verifique, `t1.notas` lo declara y `p1` lo dice en la voz y en la indicación al Patio central. No se cambió ninguna `lat`/`lng`. Pendiente: confirmar en terreno un acceso con rampa o sin escalones y mover ahí el anclaje (propuesta para `@holyusm`, dueño del plano). Cuando esté verificado, se quita la advertencia.

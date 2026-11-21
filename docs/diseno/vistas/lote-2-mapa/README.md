# Lote 2: Ruta paso a paso y recálculo en vivo (`/mapa`)

Es el corazón de la demo: la ruta que sirve a tu perfil y cómo cambia en vivo cuando alguien reporta una barrera.

**Requiere** la carpeta [`../lote-0-sistema/`](../lote-0-sistema/) (`tokens.css`, `componentes.css`, `componentes.md`, `iconos.md`). Esta carpeta trae solo lo propio de la vista. Los componentes que se repiten (Botón, AvisoBarrera, ListaPasos, MetricasRuta, PerfilRecorrido, BandaEnVivo, MarcadorMapa, Shell) ya están especificados allá.

> Ajuste respecto del paquete anterior: el enlace del Wordmark (logo que lleva al inicio) debe medir al menos 48 px de alto (`min-height: 48px`). Ya está aplicado en `componentes.css` (`.wordmark`).

**Plan de implementación:** [PLAN.md](PLAN.md). El mapa usa el plano generado desde OpenStreetMap (`web/src/plano/`), sin teselas.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-movil-hoja-resumen` | Pantalla principal: mapa con la ruta y hoja en resumen |
| `02-movil-hoja-completa` | Hoja completa: pasos, advertencias, perfil del recorrido, acciones |
| `03-recalculo-1-antes` | Recálculo, momento 1: ruta normal, banda En vivo |
| `04-recalculo-2-aviso` | Recálculo, momento 2: aviso amarillo, ruta anterior punteada en gris, ruta nueva en azul, Ascensor A en rojo |
| `05-recalculo-3-ruta-nueva` | Recálculo, momento 3: ruta nueva con hoja media y la nota "Ruta actualizada" |
| `06-movil-sin-ruta` | No hay ruta: mapa atenuado, panel rojo con el motivo y alternativas |
| `07-movil-vista-lista` | "Ver como lista": la ruta entera en texto, sin mapa |
| `08-movil-oscuro-hoja-media` | Tema oscuro con hoja media |
| `09-escritorio-con-aviso` | 1440 px: mapa 8/12, panel 4/12, aviso de recálculo arriba del panel |
| `10-componente-plano` | El plano solo, con la ruta (390×704) |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen. Los `.png` usan una fuente de reemplazo y sirven para ver la composición.

## Estructura en móvil (390×844)

De arriba hacia abajo, con el mapa ocupando todo el espacio entre la cabecera y la navegación:

1. **Cabecera de 64 px:** botón "Volver a elegir destino" (48 px, `CaretLeft`), Wordmark y botón "Accesibilidad".
2. **Mapa** (Leaflet), de la cabecera a la navegación inferior. Encima flotan:
   - Arriba a la izquierda: el botón "**Ver como lista**" (píldora de 44 px, ícono `ListBullets`, `aria-pressed`) y debajo la **banda En vivo** ("En vivo. Hace 3 s").
   - Arriba a la derecha, solo con la hoja en resumen: **Centrar la ruta, Acercar, Alejar** (48 px, radio 12 px, con `aria-label`).
3. **Hoja inferior** (`section#ruta`, radio de 28 px arriba, sombra de hoja) apoyada sobre la navegación. Tiene tres alturas:
   - **Resumen (304 px):** barra para cambiar la altura, "Hacia Sala A-201" (26 px, 800), chip de perfil invertido "Silla de ruedas" con un caret (`aria-label="Perfil: silla de ruedas. Cambiar perfil"`), "Desde Entrada principal", métricas compactas de 40 px (75 metros, 2,3 minutos, 0 escalones en verde) y el botón secundario "Ver pasos".
   - **Media (496 px):** lo anterior más los 2 primeros pasos y el enlace "Ver los 4 pasos y advertencias".
   - **Completa (696 px, tapa el mapa):** todos los pasos como línea de metro, "Ten en cuenta" (advertencias con ícono), "Perfil del recorrido" (solo cuando la ruta tiene ascensor; ver datos), "Leer ruta en voz alta" (secundario, 56 px), "Reportar un problema en esta ruta" (enlace con `Flag`) y el pie legal.
   - **Barra para cambiar la altura:** botón de 44 px de alto, ancho completo, con una barrita de 44×5 px. Al tocarla pasa de resumen a media, a completa y vuelve a resumen. Su `aria-label` dice dónde está y a dónde pasa ("Hoja en vista resumen. Cambiar a media"). También se puede arrastrar (con ajuste a las 3 alturas), pero el botón y "Ver pasos" son la vía accesible.
4. **Navegación inferior** de 76 px con Ruta activa.

### El plano y la ruta (Leaflet)
- **Teselas** CARTO Positron con la atribución visible.
- **Línea de ruta:** dos `Polyline` superpuestas, una de 12 px en `--superficie` (borde) y encima una de 6 px en `--cobalto`, con `lineCap` y `lineJoin` redondeados. Al cargar se ajusta a la ruta con `fitBounds` y padding inferior igual a la altura de la hoja.
- **Ruta anterior** (solo durante el recálculo): `Polyline` de 6 px en `#55606A` (oscuro: `#8A9DA8`) con `dashArray: '2 12'`, sin borde. La diferencia con la ruta nueva está en el trazo, no solo en el color.
- **Números de paso:** `divIcon` circulares de 32 px en `--cobalto` con borde de 3 px del color de fondo, puestos sobre la línea. El número del último tramo se omite si choca con el pin de destino (el pin ya marca ese paso).
- **Origen:** círculo hueco (blanco con borde Cobalto de 5 px). **Destino:** pin Cobalto con la etiqueta Pacífico "Sala A-201, piso 2" encima; en "sin ruta" el pin pasa a `--tinta-2`.
- **Marcadores** (`MarcadorMapa`): la escalera de 12 escalones que la ruta evita (cuadrado blanco y etiqueta a la izquierda), "Piso mojado" (barrera amarilla, sin etiqueta para no tapar la ruta; tiene `aria-label`) y el ascensor cuando falla (cuadrado rojo con `Prohibit` y etiqueta roja debajo).
- Junto al tramo del ascensor en la ruta normal va una etiqueta suelta "Ascensor A".
- **Accesibilidad del mapa:** el contenedor lleva `role="img"` y un `aria-label` que describe la ruta en una frase (ver la lista de abajo). El mapa no es la única forma de leer la ruta: la hoja y la vista lista tienen todo.

Descripciones del mapa por escena:
- Normal: "Plano de Casa Central con tu ruta: rampa hasta el Patio central, cruce del patio, Ascensor A al piso 2 y Sala A-201."
- Aviso: "Plano con la ruta recalculada: el Ascensor A está fuera de servicio. La ruta anterior se muestra punteada y la nueva sube por la rampa del Edificio B y cruza la pasarela."
- Recalculada: "Plano con la ruta nueva: rampa hasta el patio, rampa del Edificio B al piso 2, pasarela techada y Sala A-201."
- Sin ruta: "Plano sin ruta disponible: el Ascensor A y la pasarela del Edificio B están cerrados."

## El recálculo en vivo (el momento clave)

1. **Consulta:** cada 5 s se piden `/api/reportes` y `/api/ruta?…`. Si la ruta nueva tiene otro `id` porque una barrera nueva afecta la actual, se pasa al momento 2.
2. **Aviso** (`04-recalculo-2-aviso`):
   - Aparece arriba del mapa un aviso amarillo con domos (`role="status"`, `aria-live="polite"`) con el título "Ascensor A fuera de servicio", el texto "Recalculamos tu ruta por la rampa del Edificio B: 40 m y 1 min más.", el botón "Ver nueva ruta" (`.boton--sobre-aviso`) y el enlace "Detalles", que abre la hoja completa.
   - En el mapa: la ruta anterior en gris punteado, la nueva en azul y el ascensor en rojo. El mapa baja unos 60 px para que el aviso no tape la zona del cambio, y se ocultan la banda y los controles flotantes.
   - En la hoja: las métricas nuevas con la diferencia en la etiqueta ("metros, +40", "minutos, +1").
   - **No se mueve el foco:** el anuncio llega por `aria-live`.
3. **Ruta nueva** (`05-recalculo-3-ruta-nueva`): se pasa aquí con "Ver nueva ruta" o, si nadie toca, solo a los 8 s. El aviso desaparece, se borra la ruta anterior y la hoja muestra la nota (`role="status"`, ícono `Check` en verde): "**Ruta actualizada a las 11:42.** El Ascensor A está fuera de servicio."
- **Movimiento:** el dibujo de la ruta nueva puede animarse con `stroke-dashoffset` en 200 ms. Con `prefers-reduced-motion` aparece de una vez.
- Si la barrera nueva deja sin ruta, se va directo a **Sin ruta**.

## Sin ruta (`06-movil-sin-ruta`)
- El mapa se atenúa con un velo del color de fondo al 62 % y el pin de destino pasa a gris.
- La hoja (506 px, sin barra de altura) lleva:
  - un panel rojo `.aviso--bloqueo` con `role="alert"`, el título "No encontramos una ruta sin escalones hacia Sala A-201 en este momento." y el motivo con hora;
  - "Qué puedes hacer": "Probar con otro destino" (secundario, vuelve a `/`), "Ir al Baño accesible B" (secundario, calcula esa ruta) y el enlace "Avisar a Dirección de Asuntos Estudiantiles" con la nota "Enlace simulado: en la demo no envía nada.".
- El prompt original pedía una franja roja a la izquierda; se reemplazó por el panel rojo completo para no repetir ese recurso.

## Ver como lista (`07-movil-vista-lista`)
- Es una parte central del diseño, no un extra escondido. El botón "Ver como lista" está siempre visible sobre el mapa.
- En lista desaparece el mapa y la hoja pasa a ser el contenido de la página: título de 36 px, métricas de 56 px, todos los pasos, advertencias, perfil del recorrido y acciones. Arriba a la derecha queda el botón "Ver mapa" (invertido, `aria-pressed="true"`).
- La preferencia se guarda en `localStorage['parejo:vista']`. Para lector de pantalla y baja visión es la vista recomendada.

## Escritorio (≥ 900 px, `09-escritorio-con-aviso`)
- Cabecera de 72 px. Debajo, una fila con el **mapa** (`flex: 8 1 560px`) y el **panel** (`flex: 4 1 400px`, fondo `--superficie`, borde izquierdo y scroll propio).
- Mapa: "Ver como lista" y la banda arriba a la izquierda, los controles arriba a la derecha, la leyenda abajo a la izquierda (Tu ruta, Ruta anterior solo durante el recálculo, Barrera activa, Bloqueado; cada una con su trazo o forma) y la atribución abajo a la derecha.
- Panel: **el aviso de recálculo va arriba del panel**. Después vienen el `<h1>` "Hacia Sala A-201" (40 px), el chip de perfil con "Desde", las métricas de 52 px, los pasos, "Ten en cuenta", las acciones y el pie.

## Voz
"Leer ruta en voz alta" usa `speechSynthesis` con `lang="es-CL"` y solo arranca después de un toque. Lee: "Hacia Sala A-201, en silla de ruedas. 75 metros, 2,3 minutos, sin escalones. Paso 1: …". Mientras lee, el botón cambia a "Pausar" con `aria-pressed`. Si hay una advertencia, se lee después de los pasos.

## Navegación de entrada y salida
- **Entra** desde `/` con `?desde=&hasta=&perfil=`. Sin parámetros válidos, vuelve a `/`.
- El chip de perfil abre el cambio de perfil (pueden ser los 4 `ChipPerfil` en una hoja pequeña) y recalcula sin salir.
- "Reportar un problema en esta ruta" lleva a `/reportar?ruta=<id>`.
- El botón de volver lleva a `/` y conserva lo elegido.

## Textos exactos

| Lugar | Texto |
|---|---|
| Volver (aria-label) | Volver a elegir destino |
| Saltar al contenido | Saltar a los pasos de la ruta |
| Botón de vista | Ver como lista / Ver mapa |
| Banda | **En vivo.** Hace 3 s |
| Controles (aria-label) | Centrar la ruta / Acercar / Alejar |
| Título | Hacia Sala A-201 |
| Perfil (aria-label) | Perfil: silla de ruedas. Cambiar perfil |
| Origen | Desde Entrada principal |
| Métricas | metros / minutos / escalones (durante el aviso: "metros, +40", "minutos, +1") |
| Resumen | Ver pasos |
| Media | Ver los 4 pasos y advertencias |
| Secciones | Pasos / Ten en cuenta / Perfil del recorrido |
| Paso oculto | Paso 1 de 4 |
| Acciones | Leer ruta en voz alta / Reportar un problema en esta ruta |
| Aviso | **Ascensor A fuera de servicio** / Recalculamos tu ruta por la rampa del Edificio B: 40 m y 1 min más. / Ver nueva ruta / Detalles |
| Estado | **Ruta actualizada a las 11:42.** El Ascensor A está fuera de servicio. |
| Sin ruta | Ver `escenas.sinRuta` en `datos-ejemplo.json` |
| Pie | Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo. |

Los pasos y advertencias de cada escena están en `datos-ejemplo.json`.

## Archivos sugeridos

```
web/src/views/Mapa.jsx
web/src/components/MapaRuta.jsx        (react-leaflet: ruta con borde, ruta anterior, números, marcadores, fitBounds)
web/src/components/HojaRuta.jsx        (3 alturas, barra de altura, arrastre con ajuste)
web/src/components/ResumenRuta.jsx     (título, chip de perfil, métricas)
web/src/components/AvisoRecalculo.jsx
web/src/components/SinRuta.jsx
web/src/hooks/useRuta.js               (consulta cada 5 s, detecta cambio de id y pasa por aviso y ruta nueva)
web/src/hooks/useVoz.js                (speechSynthesis es-CL)
```

## Datos reales para el grafo

El plano de referencia es un esquema. La memoria de titulación USM "Propuestas para lograr una USM accesible, Casa Central" (https://repositorio.usm.cl/bitstreams/59dc6463-f5ea-4e75-8a8e-e0bebf0c4d97/download) trae un diagnóstico que sirve para el levantamiento:
- **Ascensores:** solo los edificios P, A y E y la Biblioteca (Edificio U) tienen ascensor, y ninguno es accesible. El resto no tiene.
- **Edificio C:** tiene una oruga salvaescaleras que requiere personal.
- **Porterías evaluadas:** España, Placeres, Valdés y Portales. Ninguna tiene rampa.
- **Otros edificios con nombre:** K (CIAC), T (Auditorio), D (Comedor), R (Relaciones Estudiantiles).

Es el diagnóstico de cuando se hizo la memoria, así que hay que confirmarlo en terreno antes de usarlo. La pasarela entre los edificios B y A de la escena de recálculo **es inventada** para la demo.

## Criterios de aceptación

- [ ] Las pantallas se ven como las referencias en móvil (390 px) y escritorio (1440 px), en claro y oscuro.
- [ ] Con solo teclado: saltar a los pasos, cambiar la altura de la hoja con la barra, abrir la lista, activar "Ver nueva ruta" y leer en voz alta. Todo con foco visible.
- [ ] El lector de pantalla anuncia el aviso de recálculo y la ruta actualizada sin mover el foco. El mapa tiene una descripción en texto.
- [ ] La ruta anterior y la nueva se distinguen sin ver colores: punteada y continua.
- [ ] Todo lo que se toca mide 44 px o más (barra de la hoja incluida).
- [ ] La vista lista contiene toda la información del mapa y la hoja.
- [ ] Con A++ y zoom al 200 % la hoja y la lista no tienen scroll horizontal.
- [ ] Con `prefers-reduced-motion` no hay animación de dibujo ni de la hoja.
- [ ] Ningún texto usa guion largo, semiguion ni "·" como separador.

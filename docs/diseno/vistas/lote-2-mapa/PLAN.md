# Plan de implementación: Lote 2 (`/mapa`)

**Implementa:** @juaquo15. **Diseño:** [README.md](README.md), [datos-ejemplo.json](datos-ejemplo.json) y `referencia/` (abre los `.html` en el navegador para medir; los `.png` solo muestran la composición).

**Mapa:** no se usan teselas. El mapa es el **plano vectorial de Casa Central generado desde OpenStreetMap** (`web/src/plano/`, de José), con el CRS normal de Leaflet y coordenadas reales. Cada nodo del grafo usa su `lat`/`lng` real (ver `docs/contratos.md` §1 y la tabla de anclajes de `web/src/plano/README.md`).

**Dependencias de otros:**
- José: `web/src/plano/` (`CapaPlano.jsx`, `plano.js` con `LIMITES`, `LIMITES_VISTA`, `ZOOM`) y la tabla de anclajes `lat`/`lng` en `web/src/plano/README.md`.
- @Gxppe: ajuste del Shell para `/mapa` (botón Volver, texto del salto, pie legal dentro de la hoja, `main` sin padding). Avisa en el tablero cuando esté.


## Reglas
- Ids del contrato: `silla_ruedas`, `sala-a201`, `bano-b`… Los textos de `datos-ejemplo.json` son ejemplos, y las coordenadas `plano` de ese archivo no se usan.
- Clases de `componentes.css`, colores de `tokens.css` y estados con atributos ARIA. No se copian los estilos en línea ni los hex de las referencias. Los únicos colores fijos permitidos son los de la ruta anterior (`#55606A` y `#8A9DA8`), y van como variables en `Mapa.css`.
- Textos exactos, sin guion largo, sin "·" y sin "→".
- **Dueños:** los archivos nuevos que crees para este lote son tuyos. Para cambiar uno existente de @Gxppe (`Shell`, `AvisoBarrera`, `GrupoPerfiles`, hooks) se pide traspaso en el tablero. `web/src/plano/` es de José.
- **Reutiliza:**
  - `useBarreras()` (barreras con `nivel`);
  - `usePreferencias()` (perfil, voz);
  - `useLugares()` (nombres);
  - `AvisoBarrera` (variantes alerta y bloqueo, con `role` configurable);
  - `PERFILES` de `GrupoPerfiles.jsx` (nombre, ícono y textoBoton);
  - las clases `.pasos`, `.paso*`, `.metricas--compactas`, `.metrica--buena`, `.banda-vivo*`, `.marcador--*`, `.chip-perfil`, `.hoja` y `.aviso*`.

## PR A: ruta visible (lo mínimo de la demo). Meta: ~13:15

| # | Archivo | Qué hace | Hecho cuando |
|---|---|---|---|
| A1 | `motor/ruta.js` | Las advertencias dejan de usar "→": "Usa el Ascensor A hasta el Edificio A, piso 2". | `npm test` pasa |
| A2 | `data/campus.json` | Agrega el escenario del recálculo: nodos `edificio-b`, `rampa-b` y `pasarela-b-a`, y tramos con `nombre` ("la rampa del Edificio B", "la pasarela techada"), con 0 escalones. Así, al bloquear `ascensor-a`, la ruta de silla de ruedas sale por B con unos 40 m y 1 min más, y al bloquear también la pasarela queda `ok:false`. Mantiene `"simulado": true`. Ubica cada nodo con `lat`/`lng` reales de la tabla de anclajes de `web/src/plano/README.md`. Un test en `motor/ruta.test.js` cubre los tres casos. | El test de los 3 escenarios pasa |
| A3 | `web/src/lib/pasos.js` (+ `pasos.test.js`) | Función pura `armarRuta(grafo, resultado)` → `{id, pasos, coordenadas}`. El `id` es `tramos.join('-')`. Cada paso es `{instruccion, detalle, tramo, icono, metros, nodo}`. Plantillas: con rampa, "Avanza {m} m por {nombre o 'la rampa'} hasta {destino}."; con ascensor, "Sube al piso {piso}." o "Baja…"; con techado, "Cruza {m} m por {nombre o 'el pasillo techado'} hasta {destino}."; el último, "{Destino} está a {m} m.". El detalle sale de pendiente, superficie y techado ("Rampa suave, piso liso, al aire libre"). Los íconos están en `iconos.md` (TrendUp, Umbrella, Elevator, Door, PersonSimpleWalk). Las coordenadas son `[lat, lng]` de cada nodo, directo. | Tests con la ruta de silla de ruedas del grafo |
| A4 | `web/src/hooks/useRuta.js` | Lee `desde`, `hasta` y `perfil` de la URL. Si falta alguno, hace `navigate('/')`. Pide `/api/ruta` y, si falla, calcula localmente con `calcularRuta` importado de `motor/ruta.js`, más `campus.json`, `perfiles.json` y los bloqueos de `useBarreras`. Devuelve `{estado: 'cargando'|'ok'|'sinRuta', ruta, anterior, ...}`. En el PR A todavía no consulta cada 5 s. | `/mapa?desde=entrada-principal&hasta=sala-a201&perfil=silla_ruedas` muestra la ruta |
| A5 | `components/MapaRuta.jsx` + `.css` | react-leaflet con el CRS normal (sin `CRS.Simple` ni `TileLayer`), `<CapaPlano/>` de `web/src/plano/` como fondo, `className="mapa-plano"`, `maxBounds={LIMITES_VISTA}` y zoom entre 17 y 20 (`ZOOM` de `plano.js`). La ruta son dos `Polyline`: 12 px `--superficie` y 6 px `--cobalto`, ambas redondeadas. Números de paso como `divIcon` de 32 px. Origen hueco, pin de destino con `.marcador-destino__etiqueta`. Marcadores de `useBarreras` en su nodo (con `.marcador--barrera` o `.marcador--bloqueo`). `fitBounds` con padding inferior igual a la altura de la hoja. Controles propios Centrar la ruta, Acercar y Alejar (48 px, `aria-label`). El contenedor lleva `role="img"` y un `aria-label` con la ruta en una frase, armada desde los pasos. Los marcadores quedan fuera del Tab (`keyboard: false`, `interactive: false`). Importa `leaflet/dist/leaflet.css`. | Se ve como la referencia `10` sobre el plano |
| A6 | `components/HojaRuta.jsx` + `ResumenRuta.jsx` | `section#ruta` con 3 alturas: resumen 304, media 496 y completa 696 px. El botón barra (44 px, ancho completo) lleva el `aria-label` "Hoja en vista resumen. Cambiar a media" y rota entre las tres. El resumen muestra el h2 "Hacia {nombre}", el `.chip-perfil` invertido con el `aria-label` "Perfil: {nombre}. Cambiar perfil" (en el PR A todavía sin acción), "Desde {nombre}", `<dl className="metricas metricas--compactas">` y el botón secundario "Ver pasos" (pasa a completa). La media agrega 2 pasos y "Ver los {n} pasos y advertencias". La completa muestra `<ol className="pasos">` con "Paso i de n" en `.sr-only`, "Ten en cuenta" con las advertencias, "Reportar un problema en esta ruta" (enlace a `/reportar?ruta={id}`) y el pie legal. | Se ve como `01` y `02` y funciona con teclado |
| A7 | `components/VistaLista.jsx` + el botón "Ver como lista" | Píldora de 44 px con `aria-pressed`. Guarda `parejo:vista` (`mapa` o `lista`) con try/catch. En lista no hay mapa: va el h1 de 36 px, métricas de 56 px, todos los pasos, las advertencias y las acciones. El botón cambia a "Ver mapa". | Se ve como `07` |
| A8 | `views/Mapa.jsx` + `Mapa.css` | Compone todo. En móvil, el mapa ocupa el alto entre la cabecera y la nav, con la hoja encima. En escritorio (≥900), fila `flex: 8 1 560px` para el mapa y `4 1 400px` para el panel, con scroll propio (la hoja pasa a ser el panel, sin barra de altura). | Se ve como `01` en 390 px y como `09` sin el aviso en 1440 px |

## PR B: recálculo en vivo y sin ruta (el momento clave). Meta: ~14:30

- **B1. `useRuta`:**
  - Consulta `/api/ruta` cada 5 s y limpia el intervalo al desmontar.
  - **Aviso:** si el `id` nuevo es distinto al actual, pasa a `aviso` con `anterior` = la ruta actual, `diferencia = {metros, minutos}` y `causa` = el reporte de `useBarreras` cuyo `nodo_id` o `tramo_id` estaba en la ruta anterior.
  - **Recalculada:** a los 8 s, o con `verNueva()`, pasa a `recalculada` y guarda la hora.
  - **Sin ruta:** si la respuesta trae `ok:false`, pasa a `sinRuta`.
  - **Rutas sin cambios:** si el `id` es igual, no hace nada.
- **B2. `components/AvisoRecalculo.jsx`:**
  - Usa `AvisoBarrera variante="alerta"` dentro de un contenedor `role="status" aria-live="polite"` siempre montado, sin mover el foco.
  - El título sale de la causa: si es `ascensor_fuera_servicio`, "{nombre del nodo} fuera de servicio"; si es `rampa_bloqueada`, "{nombre} bloqueada"; si es `piso_mojado`, "Piso mojado en {nombre}"; en otro caso, "Barrera en {nombre}".
  - Texto: "Recalculamos tu ruta por {nombre del primer tramo nuevo}: {m} m y {min} min más."
  - Botones: "Ver nueva ruta" (`.boton--sobre-aviso`) y el enlace "Detalles" (abre la hoja completa).
  - En móvil va arriba del mapa; en escritorio, arriba del panel.
- **B3. MapaRuta durante el aviso:**
  - La ruta anterior va como `Polyline` de 6 px, color `var(--ruta-anterior)` (definida en `Mapa.css`: `#55606A` en claro y `#8A9DA8` en oscuro) y `dashArray: '2 12'`, sin borde.
  - La causa aparece como `.marcador--bloqueo` con su etiqueta.
  - Se ocultan la banda y los controles.
  - La leyenda de escritorio agrega "Ruta anterior".
  - Si `prefers-reduced-motion` no está activo, la ruta nueva se anima con `stroke-dashoffset` en 200 ms.
- **B4. Métricas durante el aviso:** etiquetas "metros, +40" y "minutos, +1". En recalculada, nota `role="status"` con `Check` en `--paso`: "**Ruta actualizada a las {hh:mm}.** {causa}.".
- **B5. `components/SinRuta.jsx`:**
  - Velo del color de fondo al 62 % sobre el mapa, y el pin de destino en `--tinta-2`.
  - Hoja de 506 px sin barra, con `AvisoBarrera variante="bloqueo" role="alert"`. Título: "No encontramos una ruta {sin escalones si el perfil es silla_ruedas} hacia {nombre} en este momento."; luego el motivo con la hora.
  - "Qué puedes hacer":
    - "Probar con otro destino" → `/`;
    - "Ir al Baño accesible B" → misma URL con `hasta=bano-b`;
    - el enlace simulado "Avisar a Dirección de Asuntos Estudiantiles" con su nota.
- **B6. `components/BandaEnVivo.jsx`:** `.banda-vivo` con `role="status"`: "**En vivo.** Hace {s} s", que se actualiza cada segundo desde `actualizado`. Si la API falla, cambia a `.banda-vivo--sin-conexion`: "**Sin conexión.** Mostrando la última ruta conocida, de las {hh:mm}."
- **Prueba de la demo:**
  1. Con la ruta abierta, correr `curl -X POST /api/reportes -d '{"tipo":"ascensor_fuera_servicio","nodo_id":"ascensor-a","descripcion":"Ascensor A fuera de servicio","duracion_min":60}'`.
  2. En 5 s o menos aparece el aviso; a los 8 s, la ruta nueva.
  3. Bloquear después la pasarela lleva a Sin ruta.

## PR C: si alcanza el tiempo. Meta: ~15:30

- **C1. `hooks/useVoz.js`:**
  - Usa `speechSynthesis` con `lang="es-CL"` y arranca solo con un toque.
  - El botón secundario "Leer ruta en voz alta" (56 px) cambia a "Pausar" con `aria-pressed`.
  - Lee: "Hacia {X}, {textoBoton}. {m} metros, {min} minutos, sin escalones. Paso 1: …", y las advertencias al final.
  - Si el navegador no soporta la voz, el botón se oculta.
- **C2. Cambio de perfil:** el chip abre una `.hoja` pequeña con los 4 `.chip-perfil` (`role="radiogroup"`). Al elegir se actualizan la URL y `setPerfil`, y se recalcula.
- **C3.** Arrastre de la hoja con ajuste a las 3 alturas (pointer events). El botón sigue siendo la vía accesible.
- **C4.** "Perfil del recorrido" (SVG de `componentes.md`), solo si la ruta tiene ascensor.

## Aceptación (de `README.md`, más la demo)
- [ ] Móvil 390 px y escritorio 1440 px se ven como las referencias, en claro y oscuro.
- [ ] Solo con teclado: saltar a los pasos, cambiar la altura de la hoja, abrir la lista, "Ver nueva ruta" y leer en voz alta.
- [ ] El aviso y la ruta actualizada se anuncian sin mover el foco, y el mapa tiene una descripción en texto.
- [ ] La ruta anterior va punteada y la nueva continua.
- [ ] Todo lo que se toca mide 44 px o más.
- [ ] La lista trae toda la información.
- [ ] Con A++ y zoom al 200 % no hay scroll horizontal.
- [ ] Con `prefers-reduced-motion` no hay animación.
- [ ] El recálculo de la demo funciona de punta a punta en `npm run dev` y en Render.
- [ ] `npm run build` y `npm test` pasan.

## Decide tú (y avisa en el tablero)
Las medidas que falten, las plantillas de texto de los pasos y qué hacer si un texto no cabe.


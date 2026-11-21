# Plan del Lote 10 (`/plano`)

Implementa @juaquo15. Rama `<issue>-plano-interactivo` desde `main` fresco. Hagan commits chicos, stageando solo sus archivos.

## Quién toca qué

| Archivo | Dueño | Para este lote |
|---|---|---|
| `web/src/plano/CapaPlano.jsx`, `plano.js`, `plano.css` | @holyusm | **Traspaso a @juaquo15** mientras dure este lote. Solo cambios **compatibles**: props nuevos opcionales, con los valores por defecto de hoy. |
| `web/src/plano/edificios.js` (nuevo) | @juaquo15 | Lista de edificios agrupados (paso 1) |
| `web/src/views/Plano.jsx`, `Plano.css` (nuevos) | @juaquo15 | La vista |
| `web/src/main.jsx` (ruta) y `web/src/components/Shell.jsx` (navegación) | @Gxppe | Pedir en el tablero: una línea `<Route path="/plano" element={<Plano />} />` y el ítem "Plano" (ícono `MapPin` o `Buildings`) entre Ruta y Comparar. O bien que @Gxppe autorice a @juaquo15 a hacerlo. |
| `MapaRuta.jsx`, `MapaComparar.jsx` | @Gxppe | **No se tocan.** Tienen que seguir viéndose igual. |

`casa-central.geo.json` no se regenera ni se edita a mano.

## Pasos

1. **`web/src/plano/edificios.js`**: exporta `EDIFICIOS`, calculado una vez del `geojson`. Cada elemento tiene la forma `{ clave, letra, titulo, sub, pisos, osm, feature, bounds, centro }`.
   - Se agrupa por `letra` y, si no hay, por `nombre`. De cada grupo se queda el polígono más grande.
   - Incluye `EXTRA = { 'relation/17542343': { letra: 'B', sub: 'Edificio central · nombre por confirmar' } }` y `limpiar()` (ver la lógica en `referencia/01-escritorio.dc.html`).
   - Exporta también `pisosDe(edificio)`: el C da `[-1, 1, 2]`; si se conocen los pisos, da `1..pisos` (máximo 8); si no, `[1]`.
   - Exporta `interior(letra, piso)`: devuelve las features `sala` y `pasillo` de ese edificio con ese `nivel`. Hoy solo el C tiene.
   - Exporta `nodoDestino(letra)`: el `id` del nodo de `data/campus.json` con `edificio === letra` y `tipo === 'edificio'`, o `null`. Se usa en el CTA.
2. **`CapaPlano`**: agregar estos props opcionales sin cambiar nada cuando no se pasan.
   - `seleccion` (clave o `osm` del edificio elegido): ese polígono recibe además la clase `plano-edificio--elegido` (en `plano.css`: relleno `--cobalto-tinte`, borde `--cobalto`, 3 px).
   - `onElegir(feature)`: si existe, los polígonos del campus son interactivos (cursor pointer, clic). Ojo: Leaflet solo lee `className` al crear la capa, así que para el resaltado conviene una segunda `<GeoJSON key={seleccion}>` encima con solo el edificio elegido. No mutar estilos.
   - `capas = { senderos: true, escaleras: true, servicios: false, calles: false }`: filtran por `tipo`. Servicios y calles quedan apagados por defecto, como hoy.
   - `interior` (lista de features): dibuja salas y pasillos en un pane encima de los edificios. Los baños llevan la clase `plano-sala--bano`.
3. **`Plano.jsx`**: estado `{ q, seleccion, piso, capas }`. En escritorio, la lista va a la izquierda y el mapa a la derecha. En móvil va el mapa completo con la búsqueda flotante y la hoja inferior (ver README). Los componentes internos van en el mismo archivo o en `web/src/views/plano/` (de @juaquo15):
   - `Encuadre`: usa `useMap`. Hace `flyToBounds` del edificio elegido, o `fitBounds` si hay `prefers-reduced-motion`.
   - `ControlesPlano`: Acercar, Alejar y Ver todo.
   - `Escala`: `L.control.scale({ imperial: false, position: 'bottomleft' })` en un `useEffect`.
   - `EstasAqui`: un `Marker` con divIcon, no interactivo.
   - Las etiquetas de las salas son `divIcon` en el centroide, visibles desde zoom 19 (`useMapEvents('zoomend')`).
   - Las de calles van en el centro del tramo más largo de cada calle con ese `nombre`, giradas según su rumbo.
4. **Ficha**: tarjeta flotante en escritorio y hoja en móvil. El grupo de pisos usa `role="radiogroup"` y flechas, con tabindex roving. Esc cierra la ficha y devuelve el foco al botón de la lista que la abrió.
5. **Teclado del mapa**: `keyboard` de Leaflet activo en esta vista. Los marcadores no entran al Tab. Regla general: **la lista es la vía accesible y el mapa es el apoyo visual.**
6. **CTA "Cómo llegar sin barreras"**: si `nodoDestino(letra)` existe, lleva a `/?hasta=<id>` (Inicio ya lee `?hasta=`). Si no, lleva a `/`.
7. **Pruebas manuales**:
   - `/plano`, `/mapa` y `/comparar` a 390 px y 1440 px, con zoom al 200 % y en los 3 temas.
   - Lector de pantalla (NVDA o VoiceOver): lista, conteo, ficha y pisos.
   - Que `npm run build` pase sin advertencias nuevas.

## Aceptación

Las casillas de "Criterios de aceptación" del [README](README.md). Al abrir el PR (`Closes #<issue>`), adjunten capturas de escritorio y móvil, y una del C en el piso 2 en tema oscuro.

## Fuera de alcance

- Dibujar los edificios que faltan (H, O, J, I, N, F2, P2) o plantas de otros pisos: eso depende del levantamiento (#12).
- Rutas en esta vista: se planifican en `/` y se ven en `/mapa`.

# Lote 10: Plano de Casa Central (`/plano`)

**Objetivo:** que cualquier estudiante entienda el campus de un vistazo: dónde está, qué edificio es cuál, qué pisos tiene y por dónde llegar sin barreras. Es la vista "explorar". `/mapa` sigue siendo la vista "ruta".

**Requiere** [`../lote-0-sistema/`](../lote-0-sistema/) (tokens, componentes, íconos) y el plano vectorial de [`web/src/plano/`](../../../../web/src/plano/README.md) (`CapaPlano`, `plano.js`, `casa-central.geo.json`).

**Diseño:** canvas de Claude Design "Plano Casa Central" (https://claude.ai/artifact/4FdrDofnTYbdU57ZPRZYic), con dos tableros interactivos: escritorio 1440×900 y móvil 390×844. Abajo, en `referencia/`, está el código de esos tableros.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-escritorio.dc.html` | Tablero de escritorio: lista de edificios, plano, capas, ficha del edificio |
| `02-movil.dc.html` | Tablero de móvil: plano a pantalla completa con hoja inferior |

Son plantillas de Claude Design y no se abren solas en el navegador. **Léanlas como especificación**: medidas, textos, colores (en las paletas `CLARO` y `OSCURO`) y la lógica del `<script>` (`EXTRA`, `limpiar`, `edificiosAgrupados`, `pisosDe`, `elegir`). En la app, el dibujo es Leaflet sobre `CapaPlano`, no el SVG del tablero.

## Datos (todo sale de `casa-central.geo.json`, nada inventado)

- **Edificios del campus:** features con `tipo: "edificio"` y `campus: true`. Se agrupan por `letra` y, si no hay letra, por `nombre`. De cada grupo se queda el polígono más grande. Orden: primero los que tienen letra (A, B, C… con orden numérico, así M2 va después de M) y luego los que solo tienen nombre.
- **Supuestos declarados** (van también en "Acerca de los datos" de la vista):
  - `relation/17542343` es el **Edificio B** ("Edificio central · nombre por confirmar"). En OSM no tiene nombre.
  - H, O, J, I, N, F2 y P2 no están en OSM. No se dibujan, y la lista no los muestra.
  - Pisos: se usa `pisos` de OSM cuando existe. Si no existe, se muestra "Pisos por confirmar". La accesibilidad de cada edificio dice **"Por levantar"** hasta que exista el levantamiento en terreno (#12, `data/`).
- **Interior:** solo el Edificio C tiene interior en OSM: salas C201 a C247 en el piso 2 (`tipo: "sala"`, `nivel: "2"`, con 2 baños) y 3 pasillos en el piso -1. Los pisos del C son −1, 1 y 2, y al elegirlo se abre en el piso 2.
- **Arreglos de texto:** "Comerdores" se muestra como "Comedores". El nombre largo de la Federación se acorta a "FEUTFSM · Federación de Estudiantes" (función `limpiar` del tablero).
- **Atribución:** "© colaboradores de OpenStreetMap" visible siempre (ya la trae `CapaPlano`).

## Escritorio (≥ 900 px)

1. **Cabecera** de la app (Shell), con "Plano" activo en la navegación.
2. **Barra superior:** `<h1>` "Plano de Casa Central" y, debajo, "Av. España 1680, Valparaíso" en `--tinta-2`. A la derecha, el botón primario "Planificar una ruta accesible" (ícono `NavigationArrow`), que lleva a `/`.
3. **Dos columnas:**
   - **Lista** (`<aside aria-label="Edificios del campus">`, 380 px, tarjeta con radio de 16 px):
     - Campo `type="search"` con `<label>` visible "Buscar edificio o servicio" y placeholder "Ej.: Biblioteca, C, Casino". Filtra por letra, título, subtítulo y servicios.
     - Debajo, el conteo en un `aria-live="polite"`: "12 edificios" o "Sin resultados para «xyz»".
     - `<ul>` de botones de al menos 56 px, cada uno con `aria-pressed`. Llevan la insignia de la letra (40 px, radio de 10 px), el título ("Edificio C" o el nombre) y el subtítulo (`--tinta-2`). El elegido usa fondo `--cobalto-tinte`, y la insignia va invertida.
   - **Plano** (resto del ancho, radio de 16 px). `MapContainer` con `className="mapa-plano"` y `<CapaPlano>`, más lo siguiente:
     - **Edificios clicables:** al hacer clic en un polígono del campus se elige ese edificio (lo mismo que tocarlo en la lista).
     - **Resaltado:** el edificio elegido lleva relleno `--cobalto-tinte` y borde `--cobalto` de 3 px. Los demás quedan igual.
     - **Al elegir:** `flyToBounds` del edificio, con padding y `maxZoom` 19. Para el C se usa 19.5, para que se lean las salas.
     - **Interior del C:** cuando el C está elegido y el piso es 2, se dibujan sus salas (borde fino) con la `ref` (C201…) como etiqueta pequeña desde zoom 19. Los **baños** van en `--paso`, con su ícono `Toilet` y no solo el color. En el piso −1 se dibujan los pasillos. En el piso 1 no hay interior, y la ficha lo dice.
     - **"Estás aquí":** un punto Cobalto con halo en el Acceso Av. España (-33.033897, -71.595230) y la etiqueta "Estás aquí · Acceso". Es simulado y está declarado.
     - **Capas** (tarjeta flotante arriba a la izquierda, `<fieldset>` con `<legend>` "Capas"): casillas reales para Senderos, Escaleras, Servicios y Nombres de calles, todas marcadas al inicio.
     - **Controles** (arriba a la derecha, botones de 48 px): Acercar, Alejar y "Ver todo el campus" (`fitBounds(LIMITES)`).
     - **Abajo a la izquierda:** flecha del norte (decorativa, con texto "N") y escala métrica (`L.control.scale({ imperial: false })`, con estilo de tokens).
     - **Servicios:** un círculo de 28 px con una letra (P estacionamiento, C casino, B bicicletas, S centro estudiantil, R estudio, $ cajero, I investigación). Va con `<title>` o `aria-label` con el nombre, y no entra al Tab.
     - **Nombres de calles:** texto en `--tinta-2` con halo, girado según la calle. Son Av. España, San Luis, General Bari, Valdés, Av. Los Placeres y Av. Matta.
   - **Ficha del edificio** (tarjeta flotante abajo a la derecha, 360 px; solo aparece si hay uno elegido):
     - Insignia grande con la letra, `<h2>` con el título y el subtítulo (por ejemplo "4 pisos" o "Pisos por confirmar").
     - **Piso:** un grupo de chips de 48 px (`role="radiogroup"`, `aria-label="Piso"`, cada chip con `role="radio"` y `aria-checked`; flechas izquierda y derecha para moverse). El −1 se escribe "−1".
     - **Nota** (`--tinta-2`, 14 px): con interior, "Plano interior del piso 2 según OpenStreetMap. Las salas marcadas con el ícono de baño son baños.". Con pisos conocidos y sin interior, "Plano interior pendiente: se agrega con el levantamiento en terreno.". Sin pisos conocidos, "Número de pisos y plano interior por confirmar en terreno.".
     - **Accesibilidad:** filas Entrada sin escalones, Ascensor y Baño accesible, cada una con el valor "Por levantar" (ícono `Question`, no solo color).
     - **CTA** "Cómo llegar sin barreras" (botón primario de ancho completo): lleva a `/?destino=<id>` si ese destino existe en `data/lugares.json`. Si no existe, lleva a `/` (ver PLAN, paso 6).
     - Botón Cerrar (×, `aria-label="Cerrar ficha"`) que deselecciona y devuelve el foco a la lista.

## Móvil (< 900 px)

1. Cabecera de 64 px y navegación inferior, con "Plano" activo.
2. **Plano a pantalla completa** entre la cabecera y la navegación.
3. **Búsqueda flotante** arriba (52 px, radio de 14 px). Al escribir, despliega bajo ella la misma lista filtrada (máximo 6 resultados, botones de 56 px).
4. **Controles** a la derecha: Acercar, Alejar y Ver todo (48 px). La capa de calles va apagada por defecto en móvil.
5. **Hoja inferior** (radio superior de 20 px, con asa decorativa):
   - Sin selección: "Toca un edificio o búscalo", más una fila de accesos rápidos a C, A, U y M.
   - Con selección: insignia y título, chips de piso, nota, la fila "Accesibilidad: por levantar" y dos botones: "Otro edificio" (vuelve a la búsqueda con el foco en el campo) y "Cómo llegar" (primario).
   - Al elegir, el plano encaja el edificio en la parte visible sobre la hoja (padding inferior igual a la altura de la hoja; el mismo truco que `alturaHoja` en `MapaRuta`).

## Accesibilidad y temas

- El plano no es la única vía: **todo lo que se hace tocando el mapa se puede hacer desde la lista** con teclado y lector. El contenedor del mapa lleva `role="region"` y un `aria-label` que se actualiza: "Plano de Casa Central. Edificio C elegido, piso 2." Las flechas mueven el mapa y + y − hacen zoom (Leaflet `keyboard` activo en esta vista).
- Al elegir desde la lista, el foco se queda en la lista (no salta al mapa). La ficha se anuncia con `aria-live="polite"` (solo el título).
- Colores **solo de tokens**: claro, oscuro y alto contraste. El resaltado y los baños se distinguen por forma o ícono, además del color.
- Revisen a 390 px y 1440 px, con zoom al 200 % (sin scroll horizontal) y en los 3 temas.
- `prefers-reduced-motion`: `flyToBounds` pasa a `fitBounds` sin animación.

## Criterios de aceptación

- [ ] `/plano` carga con el campus completo encuadrado, la atribución OSM y "Estás aquí".
- [ ] Elegir un edificio desde la lista o desde el mapa lo resalta, encuadra el mapa y abre la ficha, con el mismo estado en ambos lados.
- [ ] El C muestra el piso 2 con C201 a C247 y los baños, el −1 con sus pasillos y el 1 con la nota de "sin interior".
- [ ] Las 4 capas se encienden y apagan.
- [ ] El CTA lleva a la búsqueda de ruta.
- [ ] `/mapa` y `/comparar` se ven igual que antes, porque los props nuevos de `CapaPlano` son opcionales.
- [ ] Teclado completo (Tab, flechas en los chips, Esc cierra la ficha), lector de pantalla, 200 %, 390 px y 1440 px, 3 temas.

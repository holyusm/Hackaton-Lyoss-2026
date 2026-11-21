# Lote 3: Comparar perfiles (`/comparar`)

**Objetivo:** que el jurado entienda en 5 segundos que el mismo trayecto no es el mismo para todos. La frase resumen es la que se lee en el pitch.

**Requiere** [`../lote-0-sistema/`](../lote-0-sistema/) (tokens, componentes, íconos). Esta carpeta trae solo lo propio de la vista.

## Ajustes a lotes anteriores (aplíquenlos también allá)

- **Cabecera de escritorio:** la navegación (`nav`) y el grupo de accesibilidad llevan `flex-wrap: wrap`, para que a 390 px (o con zoom al 200 %) pasen a otra línea en vez de producir scroll horizontal. Afecta a Inicio y Mapa en escritorio.
- **Wordmark:** el enlace mide al menos 48 px de alto (ya avisado en el paquete del Lote 2).

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-escritorio-proyector` | 1440 px: mapa y tabla lado a lado, Silla de ruedas elegida |
| `02-escritorio-perfil-sin-ruta` | Silla de ruedas sin ruta: fila "Sin ruta accesible", ascensor bloqueado en el mapa, frase distinta |
| `03-movil` | 390 px: mapa arriba, filas apiladas, Silla de ruedas expandida |
| `04-escritorio-zoom-200.png` | La misma página a 720 px (equivale a zoom al 200 %): todo en una columna, la tabla se desplaza en su caja |
| `05-componente-plano-4-rutas` | El plano solo, con las 4 rutas sin selección |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen. Los `.png` usan una fuente de reemplazo.

## Escritorio y proyector (≥ 900 px)

Todo va **un paso más grande** que en el resto de la app, para leerse a 5 m: cuerpo de 20 px, cifras de 32 px y frase de 38 px.

1. **Cabecera** de 72 px con Comparar activo.
2. **Barra superior:** `<h1>` "Comparar perfiles" (32 px, 800) a la izquierda. A la derecha, el **trayecto compacto y editable**: dos botones de 48 px, "Desde **Entrada principal**" (ícono `MapPin`, `aria-label="Desde: Entrada principal. Cambiar"`) y "Hasta **Sala A-201**" (ícono `Door`), unidos por una flecha decorativa (`ArrowRight`, `aria-hidden`). Al tocarlos se abre el `CampoLugar` del Lote 1.
3. **Dos columnas** (`flex-wrap`; con zoom al 200 % quedan una sobre otra):
   - **Mapa** (`flex: 5 1 440px`): tarjeta de 520 px de alto, radio de 20 px, con las 4 rutas superpuestas. Debajo, la **leyenda** en rejilla de 2 columnas: muestra del trazo, ícono del perfil y "**Silla de ruedas**, línea gruesa continua". Así se entiende sin ver colores.
   - **Tabla** (`flex: 7 1 640px`):
     - Arriba, la **frase resumen** como `<h2>` de 38 px, 800, máximo 26 caracteres por línea, `text-wrap: balance`.
     - Debajo, una `<table>` real con `<caption>`: "Mismo trayecto para cada perfil. Elige una fila para resaltar su ruta en el mapa. Datos de ejemplo."
     - Columnas: Perfil, Metros, Minutos, Escalones, Pasa por, Advertencias. Encabezados `scope="col"`, perfil `scope="row"`.
     - La tabla tiene `min-width: 820px` dentro de una caja con `overflow-x: auto`.
4. Pie: "Las diferencias se calculan frente al perfil Estándar. Prototipo estudiantil. No es un servicio oficial de la USM."

### Celdas
- **Perfil:** un botón píldora de 48 px dentro del `<th>`, con el ícono en un círculo y el nombre. Lleva `aria-pressed`. Elegido: invertido (fondo Pacífico) y la fila entera con fondo `--cobalto-tinte`.
- **Metros, Minutos, Escalones:** cifra de 32 px, 800, tabular, alineada a la derecha. Debajo, la diferencia en texto de 15 px y `--tinta-2`: "+35 m", "+1,4 min", "evita 12", "igual" o "Base" en la fila Estándar. **Sin barras ni gráficos.** Cero escalones va en `--paso`.
- **Sin ruta:** una sola celda con `colspan="5"`: ícono `Prohibit` y "**Sin ruta accesible**" en `--alto` (20 px), con el motivo debajo.

### Selección
- Al activar el botón de una fila (clic, Enter o Espacio), esa ruta queda arriba con trazo 2 px más grueso y opacidad 1. Las demás bajan a opacidad 0,2. Al activarla de nuevo se vuelve a ver todas (`seleccion = "todas"`).
- **Selección inicial:** Silla de ruedas. Si ese perfil no tiene ruta, todas.
- El mapa actualiza su `aria-label`: "Plano de Casa Central desde la Entrada principal hasta la Sala A-201, resaltando la ruta en silla de ruedas." Si hay perfil sin ruta, agrega "El Ascensor A está fuera de servicio y no hay ruta en silla de ruedas."

## Móvil (< 900 px)

1. Cabecera de 64 px.
2. **Mapa** arriba, 372 px de alto (cerca del 44 % de la pantalla), con la selección aplicada.
3. **Leyenda** compacta en 2 columnas (muestra del trazo y nombre, 15 px).
4. `<h1>` "Comparar perfiles" (30 px) y el trayecto en un botón de ancho completo: "**Entrada principal** hasta **Sala A-201**" más "Cambiar" (`aria-label="Trayecto: desde Entrada principal hasta Sala A-201. Cambiar"`).
5. **Frase resumen** como `<h2>` de 26 px.
6. **Filas apiladas** (`<ul>`), una tarjeta por perfil (radio de 20 px, borde de 2 px):
   - Botón de ancho completo con `aria-expanded`. Arriba: ícono en círculo, nombre (19 px, 800) y un caret que gira al abrir. Debajo: las tres cifras de 28 px en rejilla de 3, cada una con su etiqueta y diferencia ("metros, +35", "min, +1,4", "escalones").
   - Al abrir, se resalta su ruta en el mapa y aparece el panel con "Pasa por", "Advertencias" y la nota "Su ruta está resaltada en el mapa.". `aria-controls` apunta al panel solo mientras está abierto.
   - Una sola fila abierta a la vez. Al tocar la abierta se cierra y se ven todas las rutas.
7. Pie y navegación inferior con Comparar activo.

## Frase resumen

Se arma con los datos, nunca a mano (plantillas en `datos-ejemplo.json`, `frasesResumen`). El perfil que se compara en la frase es Silla de ruedas, porque es el que cuenta la historia del pitch:
- Con ruta: "En silla de ruedas este trayecto es 35 m más largo y evita 12 escalones."
- Sin ruta: "En silla de ruedas hoy no hay ruta hacia la Sala A-201. El resto debe subir al menos 20 escalones."

## Mapa (Leaflet)
- Las mismas teselas y el mismo origen que en el Lote 2. El pin de destino va en `--tinta` (neutro) porque hay varias rutas.
- Cada ruta es una `Polyline`, con borde para Silla y Movilidad. Los estilos exactos y el orden de dibujo están en `datos-ejemplo.json`, `estilosDeRuta`.
- Las rutas que comparten tramo van desplazadas unos 6 a 8 px en paralelo, como en un mapa de metro, para que no se tapen (ver las coordenadas del plano).
- Marcadores: la escalera de 12 escalones y, sin ruta, el ascensor bloqueado (con etiqueta debajo) y la escalera interior (solo ícono, con `aria-label`).

## Textos exactos

| Lugar | Texto |
|---|---|
| Título | Comparar perfiles |
| Trayecto (aria-label) | Desde: Entrada principal. Cambiar / Hasta: Sala A-201. Cambiar / Trayecto: desde Entrada principal hasta Sala A-201. Cambiar |
| Caption | Mismo trayecto para cada perfil. Elige una fila para resaltar su ruta en el mapa. Datos de ejemplo. |
| Columnas | Perfil / Metros / Minutos / Escalones / Pasa por / Advertencias |
| Diferencias | Base / +35 m / +1,4 min / evita 12 / igual |
| Sin ruta | Sin ruta accesible + motivo |
| Leyenda | Estándar, línea fina / Silla de ruedas, línea gruesa continua / Movilidad reducida, línea discontinua / Baja visión, línea de puntos (sin ruta: "sin ruta hoy", sin muestra de trazo) |
| Fila abierta (móvil) | Pasa por / Advertencias / Su ruta está resaltada en el mapa. |
| Pie | Las diferencias se calculan frente al perfil Estándar. Prototipo estudiantil. No es un servicio oficial de la USM. |

## Archivos sugeridos

```
web/src/views/Comparar.jsx
web/src/components/MapaComparar.jsx     (4 Polyline con estilo por perfil, selección, aria-label dinámico)
web/src/components/TablaComparar.jsx    (tabla accesible con botón por fila)
web/src/components/FilaPerfilMovil.jsx  (tarjeta expandible)
web/src/components/LeyendaRutas.jsx
web/src/utils/fraseResumen.js           (arma la frase desde los datos)
```

## Criterios de aceptación

- [ ] Se ve como las referencias en escritorio (1440 px) y en móvil (390 px).
- [ ] A 720 px (zoom al 200 %) y a 390 px no hay scroll horizontal en la página. Solo la tabla puede desplazarse dentro de su caja.
- [ ] Las 4 rutas se distinguen en escala de grises (trazo, ancho y puntos), y la leyenda lo dice en texto.
- [ ] La tabla se lee bien con lector de pantalla: caption, encabezados de columna y de fila, y el botón de la fila con su estado (`aria-pressed`).
- [ ] Elegir una fila con teclado resalta la ruta y actualiza el `aria-label` del mapa.
- [ ] La frase resumen sale de los datos y cambia sola si un perfil queda sin ruta.
- [ ] Las diferencias van en texto. No hay barras ni rieles grises.
- [ ] Ningún texto usa guion largo, semiguion ni "·" como separador.

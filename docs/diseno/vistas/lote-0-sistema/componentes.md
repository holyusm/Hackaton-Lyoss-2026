# Componentes

Cada componente tiene su clase en `componentes.css` y aparece dibujado en `referencia/sistema-claro.html` (y en oscuro y alto contraste). Los nombres React son una sugerencia para `web/src/components/`.

Convención: los estados se marcan con atributos ARIA y el CSS los lee. No inventen clases como `.activo` o `.seleccionado`.

---

## Wordmark
Símbolo más el nombre como texto real.
```jsx
<a href="/" className="wordmark" aria-label="Parejo, inicio">
  <SimboloParejo size={32} aria-hidden="true" />   {/* marca/simbolo.svg inline */}
  <span aria-hidden="true">parejo</span>
</a>
```
- Móvil: símbolo de 32 px (sin ventanas bajo 48 px: usar la versión simplificada), texto de 26 px.
- Escritorio: símbolo de 40 px, texto de 30 px.
- En alto contraste el símbolo pasa a negro y blanco (`--marca-*` ya cambian en `tokens.css`).

## Boton
| Variante | Clase | Uso |
|---|---|---|
| Primario | `.boton.boton--primario` | Una acción principal por pantalla ("Ver mi ruta") |
| Secundario | `.boton.boton--secundario` | "Escuchar ruta", "Ver en el mapa" |
| Enlace | `.boton.boton--enlace` | "Ver barreras", "Estoy en un punto QR" |
| Peligro | `.boton.boton--peligro` | Solo "Marcar como resuelto" y acciones que bloquean |
| Dentro de aviso | `.boton--sobre-aviso`, `.boton--sobre-bloqueo` | Acciones dentro de avisos amarillos o rojos |

- Alto 60 px (`.boton--chico`: 48 px). Radio 12 px. Texto 18 px, 800.
- Estados: normal, hover (fondo más hondo), presionado (baja 3 px, sin escalón), foco (`--foco`), deshabilitado.
- **Deshabilitado:** usar `aria-disabled="true"` en vez de `disabled`, para que siga enfocable y el lector lea el motivo. Siempre con un `<span class="motivo" id="…">` debajo y `aria-describedby` apuntando a él. El click no hace nada mientras esté `aria-disabled`.
- Con texto muy grande el texto del botón puede pasar a dos líneas: no fijar `height`, solo `min-height`.

## TarjetaPerfil y ChipPerfil (grupo de radio)
- `TarjetaPerfil`: tarjeta de la rejilla 2×2 del inicio (alto mín. 120 px, radio 20 px).
- `ChipPerfil`: píldora de 60 px para el cambio rápido de perfil en otras vistas.
- Anatomía: ícono en círculo (40 px; crece con la escala), nombre (18 px, 800), descripción corta (16 px), check si está elegido, o la píldora "Sugerido" en Estándar cuando no hay ninguno elegido.
- Elegido: `aria-checked="true"`, se invierte a fondo Pacífico, ícono en círculo claro y check visible.
- Contenedor: `role="radiogroup"` con `aria-labelledby` apuntando al texto "¿Cómo te mueves?". Cada tarjeta es un `<button role="radio">`.
- **Teclado (roving tabindex):** solo la tarjeta elegida, o la primera si no hay ninguna, tiene `tabIndex=0`; las demás `-1`. Flechas ←↑ / →↓ mueven el foco y eligen. Inicio y Fin van a la primera y la última.
- Con `data-texto="muy-grande"` la rejilla pasa a una columna (ya está en el CSS).

| id | Nombre | Descripción corta (visible) | Ícono Phosphor |
|---|---|---|---|
| `estandar` | Estándar | El camino más corto | `Person` |
| `silla` | Silla de ruedas | Sin escalones ni adoquín | `Wheelchair` |
| `movilidad` | Movilidad reducida | Lesión o bastón: pocos escalones | `PersonSimpleWalk` |
| `vision` | Baja visión | Guía podotáctil y piso liso | `Eye` |

## CampoLugar (selector de lugar)
- Etiqueta arriba (20 px, 800), input de 60 px con ícono a la izquierda (`MapPin` en Desde, `MagnifyingGlass` en Hasta) y botón "Borrar destino" de 48 px a la derecha cuando hay valor.
- Con valor: el texto va en 800 y el borde en Pacífico. Vacío: placeholder "Busca una sala, un baño o un edificio".
- Patrón ARIA combobox: `role="combobox"`, `aria-expanded`, `aria-controls` hacia la lista, `aria-activedescendant` para la opción resaltada.
- Lista `.lista-lugares` (`role="listbox"`), agrupada por tipo (Salas, Servicios, Edificios), con ícono por tipo, la meta en una segunda línea ("Edificio A, piso 2") y la opción final "Estoy en un punto QR".
- Error: `aria-invalid="true"` en el input, `aria-describedby` hacia `.campo__error` (ícono `Warning` y texto en `--alto-texto`, 800).

## ChipLugar y fila de frecuentes
- Píldoras de 48 px con ícono y nombre. `aria-pressed="true"` cuando ese lugar es el destino actual (se invierte).
- Móvil: `.frecuentes`, una sola fila con scroll horizontal y snap, que llega hasta los bordes de la pantalla. Escritorio: `.frecuentes.frecuentes--envolver`.
- Contenedor con `role="group"` y `aria-label="Lugares frecuentes"`.

## AvisoBarrera
| Variante | Clase | Ícono | Uso |
|---|---|---|---|
| Alerta | `.aviso` | `Warning` en círculo Pacífico | Barrera activa, recálculo |
| Bloqueo | `.aviso.aviso--bloqueo` | `Prohibit` en círculo blanco | Sin ruta, fuera de servicio que bloquea |
| Compacto | `.aviso.aviso--compacto` | `Warning` suelto | Resumen en el inicio ("2 barreras activas…") |

- El amarillo lleva la textura de domos de la baldosa podotáctil **en toda la superficie**, no en una franja lateral. En alto contraste no hay textura y se suma un borde negro de 2 px.
- Título 22 px, 800. Cuerpo 18 px. Acciones: `.boton--sobre-aviso` más un enlace subrayado.
- Si aparece por un cambio en vivo: `role="status"`; si bloquea la tarea: `role="alert"`.

## ListaPasos y PasoRuta
- Se dibuja como **línea de metro**: una línea Cobalto de 6 px (la misma de la ruta en el mapa) une círculos numerados de 40 px con borde del color de fondo.
- Fila: número (con texto oculto "Paso 1 de 4"), instrucción (20 px, 800), detalle (16 px, `--tinta-2`; p. ej. "Piso liso, al aire libre") e ícono del tramo de 30 px con `role="img"` y `aria-label` (Rampa, Tramo techado, Ascensor, Sala).
- `<ol class="pasos">` con `<li class="paso">`. La línea sale de `::before`: empieza en el centro del primer número y termina en el del último.

## MetricasRuta
- `<dl class="metricas">`: tres cifras de 64 px (800, tabulares) con la etiqueta debajo (metros, minutos, escalones), separadas por líneas verticales finas. Sin tarjetas.
- La cifra va antes que la etiqueta en el DOM (`flex-direction: column-reverse` las ordena visualmente).
- `0 escalones` usa `.metrica--buena` (color Paso), porque es la buena noticia.
- Variante `.metricas--compactas` (40 px) para la hoja de ruta.

## PerfilRecorrido (lo usa el Lote 2)
SVG de 520×230 que muestra dónde sube y baja el camino. El terreno va relleno con `--terreno`, la ruta en Cobalto de 6 px con borde de 12 px en `--superficie`, y el tramo de ascensor punteado (`stroke-dasharray="0.1 12"`, extremos redondeados) porque no se camina. El origen es un círculo hueco y el destino uno lleno. Las etiquetas de tramo van en 15 px y `--tinta-2`, y el destino en 800. Lleva `role="img"` y un `aria-label` que describe el recorrido completo. Las coordenadas exactas están en `referencia/sistema-claro.html`, sección "Perfil del recorrido".

## BandaEnVivo
- Píldora de 36 px bajo la cabecera, con `role="status"` y `aria-live="polite"`.
- En vivo: ícono `Broadcast` en Paso, más "**En vivo.** Actualizado hace 3 s". La app consulta cada 5 s.
- Sin conexión (`.banda-vivo--sin-conexion`): borde de 2 px, ícono `WifiSlash`, más "**Sin conexión.** Mostrando la última ruta conocida, de las 11:42."

## Shell
- **Cabecera:** 64 px en móvil y 72 px en escritorio (≥900 px). Wordmark a la izquierda.
- **Escritorio:** navegación en píldoras (Ruta, Comparar, Reportar, Acerca; la activa con `aria-current="page"` se invierte) y barra de accesibilidad: segmentado A / A+ / A++ (`aria-pressed`), "Alto contraste" y "Voz" como `.boton-pastilla` con `aria-pressed`.
- **Móvil:** botón "Accesibilidad" (ícono `PersonArmsSpread`) que abre la hoja `PanelAccesibilidad`, y barra inferior `.nav-movil` de 76 px con 4 ítems (ícono y texto; el activo se invierte). Las etiquetas de la barra no escalan con A++.
- **PanelAccesibilidad** (`referencia/shell-movil-panel-accesibilidad.png`): hoja inferior con `role="dialog"` y `aria-modal`, título "Accesibilidad", botón cerrar de 48 px, "Tamaño del texto" (tres píldoras de 60 px), interruptores (`role="switch"`) "Alto contraste" y "Leer en voz alta" con su estado en texto, la nota "Recordamos tu preferencia en este dispositivo." y el botón primario "Listo". Atrapa el foco y se cierra con Escape.
- **Saltar al contenido:** `.saltar`, primer elemento del `<body>`, visible solo con foco.
- **Pie legal** (`.pie-legal`, en todas las vistas): "Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo."

## MarcadorMapa (Leaflet `divIcon`)
| Tipo | Clase | Forma |
|---|---|---|
| Servicio (ascensor, baño) | `.marcador--servicio` | Círculo blanco con borde Pacífico |
| Escalera | `.marcador--escalera` | Cuadrado redondeado blanco |
| Barrera activa | `.marcador--barrera` | Cuadrado amarillo con domos más `Warning` |
| Bloqueado | `.marcador--bloqueo` | Cuadrado rojo más `Prohibit` blanco |
| Destino | `.marcador-destino__etiqueta` más pin Cobalto | Etiqueta Pacífico sobre el pin |
| Origen | | Círculo hueco: blanco con borde Cobalto de 5 px |

Cada marcador de 44 px lleva al lado su `.marcador__etiqueta` en píldora. La forma cambia según el tipo, no solo el color, para que se distingan sin ver colores.

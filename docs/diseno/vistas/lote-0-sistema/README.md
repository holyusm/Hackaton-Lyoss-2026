# Parejo: diseño general

Sistema de diseño de **Parejo** (Campus sin barreras, Hackathon USM 2026). Todo lo que necesitan las vistas para verse igual al diseño: marca, tokens, componentes, íconos y referencias visuales.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `tokens.css` | Variables CSS de color, tipografía, forma, espacio y movimiento. Incluye tema oscuro, alto contraste y tamaños de texto A / A+ / A++. Se importa primero. |
| `tokens.json` | Los mismos tokens en JSON, por si se necesitan en JS (p. ej. colores de Leaflet). |
| `componentes.css` | Clases listas para cada componente del sistema. Requiere `tokens.css`. |
| `componentes.md` | Anatomía, estados, medidas y ARIA de cada componente, con el componente React sugerido. |
| `iconos.md` | Qué ícono de Phosphor va en cada lugar. |
| `marca/` | Símbolo y logo en SVG, más el favicon. |
| `referencia/` | Cómo debe verse: HTML estático y PNG del sistema en claro, oscuro y alto contraste, la marca y el shell móvil. |

Para abrir las referencias: los `.html` se abren directo en el navegador y cargan la tipografía real desde Google Fonts, así que muestran las medidas exactas (inspeccionar con DevTools). Los `.png` se generaron sin conexión, con una fuente de reemplazo: sirven para ver la composición, pero el ancho de los textos puede variar un poco.

## La idea

En Valparaíso los ascensores existen para que el cerro no decida por dónde puedes ir. Parejo hace lo mismo dentro de Casa Central: te muestra el camino que sí puedes recorrer según cómo te muevas. **Parejo** significa piso sin desniveles y también "igual para todos".

La app se siente como **señalética de campus o de metro**, no como un dashboard. La jerarquía la dan el tamaño y el peso de la letra, con poco borde y poca caja.

## Marca

- **Nombre:** `parejo`, siempre en minúscula, Atkinson Hyperlegible Next 800, interletraje -4 %. Bajada: "Campus sin barreras en Casa Central, USM".
- **Símbolo:** una cabina de ascensor de cerro sobre su riel, hecha de tres trazos: el riel (la pendiente del cerro), la cabina (en calamina rosada, con dos ventanas) y el piso (una línea horizontal, siempre pareja).
- **Versiones:** `simbolo.svg` (ícono con fondo Cobalto), `simbolo-sin-fondo.svg` (para fondos Cobalto o Pacífico), `simbolo-blanco-y-negro.svg` (alto contraste), `favicon.svg` (bajo 32 px, sin ventanas ni piso).
- **Reglas:** área de respeto del ancho de una ventana; tamaño mínimo 24 px; no se rota ni se deforma; nunca se combina con el escudo ni el logotipo de la USM.
- **En la web:** el wordmark es el SVG del símbolo más el texto "parejo" en HTML, no el SVG de texto. Ver `Wordmark` en `componentes.md`.

## Color: "colores de cerro"

| Token | Hex claro | Uso |
|---|---|---|
| `--fondo` (Niebla) | #EFF2F1 | Fondo de la app |
| `--superficie` | #FCFDFD | Paneles, hojas, inputs |
| `--tinta` (Pacífico) | #0D2B3E | Todo el texto. También el estado activo, que se invierte |
| `--tinta-2` | #3E5566 | Texto secundario |
| `--cobalto` | #2443D0 | Botones, enlaces, línea de ruta. **El único acento de interfaz** |
| `--marca-calamina` | #F4B6C2 | **Solo marca**, nunca en controles ni estados |
| `--podotactil` | #FFC72C | Solo barreras y recálculo, siempre con su textura de domos |
| `--alto` | #C4122F | Bloqueado, fuera de servicio, sin ruta |
| `--paso` | #0E7A57 | Accesible, disponible, resuelto (p. ej. "0 escalones") |

Reglas que no se rompen:
1. El estado nunca se comunica solo con color: siempre va ícono más texto ("Fuera de servicio").
2. Lo elegido se **invierte** (fondo Pacífico, texto claro, check). Se distingue por forma, no por color.
3. Nunca texto amarillo, nunca texto sobre la línea, nunca texto Pacífico sobre Alto.
4. Todos los valores de oscuro y alto contraste están en `tokens.css`, y sus contrastes en `referencia/sistema-*.html` (tabla "Contraste validado"). Todo texto pasa AA y la mayoría llega a AAA.

## Tipografía

Una sola familia: **Atkinson Hyperlegible Next** (Braille Institute, diseñada para baja visión), pesos 400 a 800. La jerarquía se arma con tamaño, peso e interletraje, no con otra fuente.

| Rol | Tamaño | Peso | Notas |
|---|---|---|---|
| Cifra de ruta | 64 px | 800 | tabular, -3 % |
| Display | 56 px | 800 | -2,5 % |
| Título de inicio en móvil | 44 px | 800 | -3 %, interlineado 1 |
| Título | 32 px | 700 | -1 % |
| Subtítulo | 24 px | 700 | |
| Etiqueta de campo | 20 px | 800 | |
| Cuerpo | 18 px | 400 / 700 | interlineado 1.5, máx. 65 caracteres |
| Detalle | 16 px | 400 | |
| Mini | 14 px | 400 | solo pie legal y atribución del mapa |

Todo va en `rem` sobre una raíz de 18 px × `--escala`. A+ y A++ cambian `data-texto` en `<html>` y la app entera crece.

## Forma

- Radios: 12 px en controles, 20 px en paneles y tarjetas, 28 px en hojas inferiores, píldora en chips y navegación.
- **Botones con escalón:** borde inferior de 4 px más oscuro. Al presionar baja 3 px y el escalón desaparece.
- Áreas táctiles de 48 px como mínimo; botón primario e inputs de 60 px.
- Sombras solo en paneles flotantes y hojas. Nada de gradientes, blur ni glow.

## Accesibilidad (no negociable)

- WCAG 2.2 AA en todo. Foco propio: anillo doble, Pacífico por dentro y Podotáctil por fuera (`--foco`).
- Todo funciona solo con teclado, en orden lógico, con enlace "Saltar al contenido".
- Cada ícono lleva texto visible o `aria-label`. Los íconos decorativos van con `aria-hidden="true"`.
- Aguanta zoom y texto al 200 % sin scroll horizontal. Con A++ la rejilla de perfiles pasa a una columna.
- Las regiones que cambian en vivo usan `aria-live="polite"`.
- Movimiento solo para comunicar un cambio de estado (150 a 200 ms), desactivado con `prefers-reduced-motion`.
- Las preferencias de tema y tamaño se guardan en `localStorage` (`parejo:tema`, `parejo:texto`, `parejo:voz`).

## Tono

Español de Chile, tuteo, frases cortas, tono de señalética: "Gira a la derecha en el patio central". "Ascensor A fuera de servicio. Te llevamos por la rampa del edificio B." Sin tecnicismos, sin marketing, sin emojis. **Nunca guion largo (—) ni semiguion (–).** Tampoco se juntan datos con "·": usar comas o frases.

## Prohibido

Gradientes, glow, glassmorphism, tarjetas iguales en fila por decorar, tarjetas dentro de tarjetas, etiquetas en mayúsculas sobre los títulos, números de sección ("01 /"), puntitos de color decorativos, ilustraciones genéricas, mockups de celular, emojis, cifras inventadas que parezcan precisas, franjas de color al costado de las tarjetas, "→" al final de botones o enlaces.

## Dependencias para implementar

```bash
npm i @phosphor-icons/react @fontsource-variable/atkinson-hyperlegible-next
```

```js
// web/src/main.jsx
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/componentes.css';
```

Con el paquete variable, la familia se llama `'Atkinson Hyperlegible Next Variable'`: agréguenla al inicio de `--fuente` en `tokens.css`. Si el paquete no existe en npm, usen el `<link>` de Google Fonts que aparece en cualquier `referencia/*.html`. Sin Tailwind ni librerías de animación.

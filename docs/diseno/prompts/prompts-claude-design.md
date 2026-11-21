# Prompts para Claude Design: vistas de "Campus sin barreras"

> **Ojo: estos prompts ya se usaron.** El diseño final se llama **parejo** y cambió la paleta y la tipografía: ahora son los "colores de cerro" y Atkinson Hyperlegible Next. Para implementar manda `docs/diseno/vistas/` (empieza por `lote-0-sistema/README.md`), no los colores ni las fuentes de este archivo. Lo que sigue sirve como historial y para diseñar los lotes que faltan.

Prompt maestro y prompts por lote para diseñar las vistas en Claude Design, con la paleta digital y la tipografía del Manual de Normas Gráficas USM 2023 (https://usm.cl/wp-content/uploads/2023/11/Manual-de-Normas-USM.pdf). No usamos el escudo ni el logotipo de la USM: el manual exige aprobación de la Dirección General de Comunicaciones.

Datos de marca extraídos del manual: azul #004B85, rojo #D60019, verde #008452, amarillo #F7AE00, negro #000000, gris de submarcas #9A999E; tipografía digital Roboto Condensed. Contrastes calculados sobre #FAFAF7 (WCAG): azul 8,56, rojo 5,18, verde 4,54 (para texto usar #006B43, 6,31), amarillo 1,82 (solo como fondo con texto tinta, 9,46), gris 2,70 (solo decorativo).

Diales de diseño (taste-skill): variance 4, motion 3, density 4.

## Cómo se trabaja (flujo por lote)

1. En Claude Design se crea un proyecto "Campus sin barreras". Primero se pega el **Prompt maestro** y luego el **Lote 0**: así queda fijo el sistema de diseño.
2. Después se pega cada lote **en el mismo proyecto**, en orden. Se itera dentro del lote ("más aire", "sube el contraste") hasta que guste.
3. Cada lote terminado se exporta (handoff a Claude Code / descarga) y se implementa en `web/src/` en una rama `<issue>-vista-<nombre>`. Cada vista se revisa con teclado, lector de pantalla y contraste antes del merge.
4. Orden según el valor para la demo: **0 → 1 → 2 → 3 → 4 → 5 → 6 (opcional) → 7**. Si no alcanza el tiempo, los lotes 1, 2 y 4 por sí solos ya cuentan la historia completa.

| Lote | Vista / ruta | Qué demuestra en el pitch | Prioridad |
|---|---|---|---|
| 0 | Sistema de diseño + shell (cabecera, barra de accesibilidad) | Coherencia y accesibilidad de base | Imprescindible |
| 1 | `/` Inicio: perfil + destino | Quién se beneficia | Imprescindible |
| 2 | `/mapa` Ruta paso a paso + recálculo en vivo | Cómo ayuda (momento "wow") | Imprescindible |
| 3 | `/comparar` Comparación por perfil | La dificultad hecha visible | Alta |
| 4 | `/reportar` Reportar y ver barreras | Barreras que cambian en vivo | Imprescindible |
| 5 | `/punto/:id` Punto QR con voz | Baja visión, sin depender del mapa | Alta |
| 6 | `/acerca` Problema, usuarios y supuestos | Impacto y supuestos declarados | Opcional |
| 7 | Estados (carga, vacío, error, sin conexión) + pulido final | Ejecución y UX | Alta |

---

## PROMPT MAESTRO (pegar primero, una sola vez)

```
Vas a diseñar la interfaz de "Campus sin barreras", una web app (mobile-first, también usable en notebook y en proyector) para la Hackathon USM 2026. Desafío oficial: "Campus sin barreras: movilidad y orientación para todos", en la Casa Central de la Universidad Técnica Federico Santa María (Valparaíso, Chile).

PROBLEMA QUE RESOLVEMOS
En la Casa Central el camino accesible es desconocido o cambia durante el día: un ascensor fuera de servicio, una rampa bloqueada, piso mojado, escaleras en los patios, adoquín irregular. Un estudiante en silla de ruedas, con una lesión temporal, con baja visión o recién llegado no sabe qué ruta le sirve a él. Los mapas generales le dan el camino más corto, no el que puede recorrer.

QUÉ HACE LA APP
1. La persona elige su perfil (Estándar, Silla de ruedas, Movilidad reducida, Baja visión) y a dónde quiere ir.
2. La app calcula la ruta que le sirve a ese perfil: evita escalones, pendientes altas o adoquín según el caso, y la muestra en un mapa con pasos claros, metros, minutos, escalones y advertencias.
3. Cualquiera puede reportar una barrera (p. ej. "Ascensor A detenido"). La ruta se recalcula en vivo para todos (la app consulta cada 5 s).
4. Hay puntos QR en el campus: al escanearlos se abre una página que lee en voz alta dónde estás y cómo llegar a los lugares cercanos.
5. Una vista compara la misma ruta para cada perfil y deja ver la diferencia (el estándar sube 12 escalones; en silla de ruedas hay que dar la vuelta por el ascensor).

USUARIOS (diseña para ellos, en este orden)
- Camila, 2º año, usa silla de ruedas: necesita saber antes de salir si el ascensor funciona y por dónde no hay escalones.
- Tomás, lesión de tobillo por 6 semanas, con muletas: puede subir escaleras pero le cuesta mucho; quiere la ruta con menos escalones.
- Valentina, baja visión: usa lector de pantalla y zoom al 200%; necesita textos grandes, alto contraste e indicaciones habladas.
- Estudiante mechón: no conoce el campus y busca su sala.
Además, el jurado ve la app en un proyector: tiene que leerse a 5 metros.

IDIOMA Y TONO
Todo en español de Chile, tuteo, frases cortas y concretas, tono de señalética: "Gira a la derecha en el patio central", "Ascensor A fuera de servicio. Te llevamos por la rampa del edificio B". Sin tecnicismos, sin marketing, sin emojis. Nunca uses el guion largo (—) ni el semiguion (–); usa punto, coma o dos puntos.

CONCEPTO VISUAL: SEÑALÉTICA DE CAMPUS
La app debe sentirse como una buena señalética física de un campus o de una red de metro, no como un dashboard SaaS ni una landing de startup. Lo que eso implica:
- Jerarquía por tamaño y peso tipográfico, no por cajas. Pocas tarjetas; agrupar con espacio y líneas finas.
- Pictogramas claros (ascensor, rampa, escalera, baño accesible, guía podotáctil) de una sola familia de íconos: Phosphor Icons, peso "bold" o "regular" consistente. Nada de íconos dibujados a mano.
- Elemento distintivo: el patrón podotáctil. Una textura de puntos redondeados en amarillo USM, como la baldosa de alerta para personas ciegas, usada SOLO en avisos de barrera/alerta y en el indicador de recálculo. Es la firma visual de la app y tiene sentido: amarillo = alerta en el piso real.
- La línea de ruta en el mapa es azul USM gruesa (6 px) con borde blanco, con números de paso en círculos sobre la línea. Las rutas alternativas usan trazos discontinuos o punteados distintos (no solo otro color) para que se distingan sin ver colores.

MARCA: MANUAL DE NORMAS GRÁFICAS USM 2023
Usa la paleta digital oficial de la USM. NO uses el escudo ni el logotipo de la universidad (requieren aprobación de la Dirección General de Comunicaciones). La marca propia es el wordmark "Campus sin barreras" en Roboto Condensed Bold. En el pie de página va: "Prototipo estudiantil. No es un servicio oficial de la USM."

Tokens de color (modo claro):
- --usm-azul: #004B85  → color principal: marca, botones primarios, línea de ruta, enlaces, estado seleccionado. Es EL acento único.
- --usm-azul-oscuro: #00335C → hover/pressed del primario, texto de títulos sobre fondo azul claro.
- --usm-azul-tinte: #E6EEF5 → fondo de elementos seleccionados.
- --usm-amarillo: #F7AE00 → SOLO alertas/barreras y el patrón podotáctil. Siempre con texto tinta encima (#0F1720, contraste 9.5:1). Nunca texto amarillo sobre blanco.
- --usm-rojo: #D60019 → SOLO "bloqueado / fuera de servicio / sin ruta". Texto rojo permitido sobre fondo claro (5.2:1); sobre fondo rojo, texto blanco.
- --usm-verde: #008452 para íconos y bordes "accesible / ruta disponible"; para texto verde usar #006B43.
- --tinta: #0F1720 (texto principal), --tinta-2: #3D4651 (texto secundario, ≥7:1), --linea: #D5D9DE, --fondo: #FAFAF7, --superficie: #FFFFFF.
- El gris oficial #9A999E solo como decoración (no pasa contraste para texto sobre blanco).
Modo oscuro (respeta prefers-color-scheme): fondo #0E1318, superficie #161C23, texto #EEF1F4, el azul se aclara a #6CA6E0 para texto y línea de ruta, el amarillo se mantiene como fondo con texto tinta (9.5:1) y el rojo como fondo con texto blanco (5.4:1); nunca texto tinta sobre rojo (3.3:1, no pasa). Comprueba 4.5:1 en todo texto de ambos modos.
Modo alto contraste (toggle propio de la app): fondo #FFFFFF, texto #000000, bordes de 2 px negros, azul #00335C, sin texturas ni sombras.
Los colores de estado son semánticos, no decorativos: el único acento de la interfaz es el azul.

TIPOGRAFÍA
- Títulos, etiquetas de señalética, números grandes (metros, minutos): Roboto Condensed (tipografía digital oficial de la USM), pesos 600 y 700.
- Texto e interfaz: Atkinson Hyperlegible (diseñada por el Braille Institute para baja visión), 400 y 700. Elegirla es parte del mensaje de la app.
- Tamaño base 18 px en móvil y en escritorio, interlineado 1.5, ancho máximo de párrafo 65 caracteres. Los números de la ruta van grandes (de 32 a 48 px), en Roboto Condensed con cifras tabulares.
- No uses Inter ni ninguna serif. El énfasis se hace con el peso de la misma familia.

FORMA Y ESPACIO
- Una sola escala de radios: 12 px en paneles y hojas, 10 px en botones e inputs, círculo completo solo para chips de perfil y números de paso.
- Áreas táctiles de 48×48 px como mínimo. Botón primario de 56 px de alto en móvil.
- Sombras casi nulas, teñidas de azul (rgba(0,51,92,0.08)). Nada de glassmorphism, blur ni gradientes.
- Rejilla de 4/8 px. Margen lateral de 16 px en móvil, contenedor máximo de 1200 px en escritorio.

ACCESIBILIDAD (no negociable, es parte de la nota)
- WCAG 2.2 AA en todo. Foco visible propio: anillo doble, 3 px tinta por dentro y 3 px amarillo USM por fuera, que se ve sobre cualquier fondo.
- Todo se puede usar solo con teclado, en un orden lógico. Hay un enlace "Saltar al contenido" al inicio.
- Cada ícono lleva texto visible o una etiqueta para lectores de pantalla. El estado nunca se comunica solo con color: va con ícono más texto ("Fuera de servicio").
- El layout aguanta zoom al 200% y texto al 200% sin cortar contenido ni hacer scroll horizontal.
- Sin animaciones decorativas. Transiciones de 150 a 200 ms solo para comunicar un cambio de estado, y se desactivan con prefers-reduced-motion.
- Barra de accesibilidad siempre a mano: Texto grande (A/A+/A++), Alto contraste, Leer en voz alta. La preferencia se recuerda.
- Las regiones que cambian en vivo (recálculo de ruta, reporte enviado) se anuncian con aria-live="polite".

PROHIBIDO (delata "hecho por IA")
Gradientes morados o azules, glow, glassmorphism, hero centrado sobre fondo oscuro, tres tarjetas iguales en fila, etiquetas pequeñas en mayúsculas sobre cada título, números de sección ("01 / Perfil"), puntitos de color decorativos, ilustraciones 3D o de personas genéricas, mockups de celular, emojis, cifras inventadas con aspecto preciso ("98% más accesible"), palabras como "potencia", "revoluciona", "experiencia fluida", tarjetas dentro de tarjetas, barras de progreso con riel gris para comparar, guion largo.

DATOS DE EJEMPLO (son simulados: márcalos como "Datos de ejemplo" donde corresponda)
Lugares: Entrada principal (Av. España), Patio central, Ascensor A, Edificio A piso 2, Sala A-201, Biblioteca, Baño accesible B, Casino.
Perfiles: Estándar ("Camino más corto, sin restricciones"), Silla de ruedas ("Sin escalones ni pendientes altas; evita adoquín"), Movilidad reducida ("Lesión temporal o bastón: escalones posibles pero muy costosos"), Baja visión ("Prefiere guía podotáctil y piso liso").
Ruta ejemplo Entrada principal → Sala A-201, perfil Silla de ruedas: 75 m, 2,3 min, 0 escalones, pasos: 1) Avanza 40 m por la rampa hasta el Patio central. 2) Cruza el patio techado 25 m hasta el Ascensor A. 3) Sube al piso 2. 4) La Sala A-201 está a 10 m a tu izquierda.
Tipos de reporte: Ascensor fuera de servicio, Obstáculo, Rampa bloqueada, Piso mojado, Otro.

TÉCNICA DE DESTINO
Se implementará en React 18 + Vite + react-router + Leaflet (OpenStreetMap con teselas claras desaturadas, estilo CARTO Positron, con la atribución visible). Diseña componentes que se puedan construir con CSS plano y variables CSS (sin Tailwind). Rutas: / · /mapa · /comparar · /reportar · /punto/:id · /acerca.

Antes de diseñar, confírmame en 5 líneas cómo entendiste el concepto visual. Después espera el Lote 0.
```

---

## LOTE 0: sistema de diseño y shell

```
Lote 0: sistema de diseño y shell de la app. Todavía no diseñes las vistas.

Entrega una página de sistema de diseño (en claro, oscuro y alto contraste, lado a lado) con:
1. Paleta con los tokens del prompt maestro. Cada muestra lleva su nombre, el hex, su uso y la combinación de texto que pasa contraste.
2. Escala tipográfica: Display 40/44 Roboto Condensed 700 · H1 32/38 · H2 24/30 · Cuerpo 18/27 Atkinson · Pequeño 16/24 · Número de ruta 48 Roboto Condensed tabular. Muéstrala con textos reales de la app, nada de lorem ipsum.
3. Botones: primario (azul, texto blanco), secundario (borde azul 2 px), terciario/enlace, peligro (solo "Marcar como resuelto"/"Bloqueado"). Estados: normal, hover, presionado (baja 1 px), foco (anillo tinta+amarillo), deshabilitado (con motivo en texto).
4. Chip de perfil: círculo completo, ícono Phosphor (Person para Estándar, Wheelchair para Silla de ruedas, PersonSimpleWalk para Movilidad reducida, Eye para Baja visión), nombre y estado seleccionado con check, no solo con color.
5. Selector de lugar: input grande con etiqueta arriba, lista de sugerencias agrupada por tipo (Salas, Servicios, Edificios) con ícono por tipo, y la opción "Estoy en un punto QR".
6. Fila de paso de ruta: número en círculo azul, instrucción en Cuerpo 700, detalle (metros · superficie · techado) en Pequeño, ícono de lo que hay en el tramo (rampa, ascensor, escalera).
7. Aviso de barrera: fondo amarillo USM con el patrón podotáctil sutil en una franja izquierda de 12 px, ícono Warning, título tinta 700 y acción. Variante bloqueante en rojo con ícono Prohibit.
8. Métricas de ruta: tres cifras grandes (metros, minutos, escalones) con su etiqueta debajo, separadas por líneas finas verticales. Sin tarjetas.
9. Shell: cabecera de 64 px con el wordmark "Campus sin barreras", la navegación (Ruta, Comparar, Reportar, Acerca) y la barra de accesibilidad (A/A+/A++, Alto contraste, Voz). En móvil la navegación pasa a una barra inferior de 4 ítems con ícono y texto, y la barra de accesibilidad a un botón "Accesibilidad" que abre un panel. Enlace "Saltar al contenido" visible al recibir foco. Pie con "Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo."
10. Banda "En vivo": pequeña, discreta, muestra "Actualizado hace 3 s" y cambia a "Sin conexión. Mostrando la última ruta conocida" cuando corresponde.

Valida y anota en la página el contraste de cada combinación. Todavía no diseñes las vistas.
```

## LOTE 1: `/` Inicio (perfil y destino)

```
Lote 1: vista de inicio, ruta "/". Usa solo componentes del Lote 0.

Objetivo: que en menos de 15 segundos Camila (silla de ruedas) elija su perfil y su destino y llegue a su ruta. Es la primera pantalla que ve el jurado.

Estructura en móvil (390×844), de arriba hacia abajo:
1. Título H1 a la izquierda: "¿A dónde vas hoy?". Debajo, una línea de Cuerpo: "Te mostramos el camino que sí puedes recorrer en Casa Central." Nada de imagen hero ni ilustración.
2. "¿Cómo te mueves?": los 4 chips de perfil en una rejilla 2×2 (no en fila), cada uno con ícono, nombre y una descripción de una línea. Es un radiogroup accesible que se recorre con flechas. Se recuerda el último perfil elegido.
3. "Desde": selector de lugar, por defecto "Entrada principal", con la opción "Estoy en un punto QR".
4. "Hasta": selector de lugar con búsqueda y lugares frecuentes como atajos (Biblioteca, Baño accesible B, Casino), en scroll horizontal con snap.
5. Si hay barreras activas: aviso amarillo compacto, "2 barreras activas en el campus. Tu ruta ya las evita." con el enlace "Ver barreras".
6. Botón primario fijo abajo, ancho completo, 56 px: "Ver mi ruta". Deshabilitado mientras falte el destino, con el motivo escrito debajo.

Escritorio (1440×900): dos columnas asimétricas. A la izquierda (5/12) el formulario completo. A la derecha (7/12) el mapa del campus en reposo, con los lugares marcados con pictogramas y las barreras activas con su marca amarilla/roja. El mapa es contexto, el formulario es la acción.

Estados: perfil sin elegir (se sugiere "Estándar", sin preselección oculta), destino igual al origen (error en línea: "Elige un destino distinto al punto de partida").
Entrega: móvil claro, móvil oscuro, móvil alto contraste con texto A++, y escritorio claro.
```

## LOTE 2: `/mapa` Ruta paso a paso y recálculo en vivo

```
Lote 2: vista de ruta, "/mapa". Es el corazón de la demo.

Móvil:
- El mapa ocupa la pantalla. Línea de ruta azul de 6 px con borde blanco y números de paso sobre ella; origen como círculo hueco y destino como marcador lleno con el nombre en etiqueta. Barreras activas cercanas como pictograma en un cuadrado amarillo (o rojo si bloquea). Botones flotantes de 48 px a la derecha: centrar ruta, acercar/alejar.
- Hoja inferior arrastrable con tres alturas (resumen, media, completa). También se maneja con teclado, con el botón "Ver pasos".
  - Resumen: "Hacia Sala A-201 · Silla de ruedas" (con chip para cambiar perfil), y las métricas 75 m · 2,3 min · 0 escalones en cifras grandes.
  - Media/completa: lista ordenada de pasos (componente de paso del Lote 0), advertencias del tramo ("Tramo de adoquín de 8 m en el patio") en texto con ícono, y las acciones "Leer ruta en voz alta" (secundario, ícono SpeakerHigh) y "Reportar un problema en esta ruta".
- Panel de recálculo en vivo (el momento clave): cuando llega un reporte nuevo que afecta la ruta, aparece arriba un aviso amarillo con el patrón podotáctil: "Ascensor A fuera de servicio. Recalculamos tu ruta por la rampa del edificio B (+40 m, +1 min)." con los botones "Ver nueva ruta" y "Detalles". La ruta anterior queda unos segundos en gris discontinuo mientras la nueva se dibuja en azul. Se anuncia por aria-live. Diseña los 3 momentos: antes, aviso, ruta nueva.
- Estado sin ruta: el mapa atenuado y una hoja con fondo blanco y borde rojo a la izquierda: "No encontramos una ruta sin escalones hacia Sala A-201 en este momento." con el motivo ("El Ascensor A está fuera de servicio desde las 11:05") y alternativas: "Probar con otro destino", "Ir al Baño accesible B", "Avisar a Dirección de Asuntos Estudiantiles" (enlace simulado).
- Alternativa de texto: un interruptor "Ver como lista" muestra la ruta sin mapa, toda en texto, para quien use lector de pantalla o tenga baja visión. Es parte central del diseño, no algo escondido.

Escritorio: el mapa a la izquierda (8/12) y un panel lateral fijo a la derecha (4/12) con resumen, pasos y acciones. El aviso de recálculo aparece arriba del panel.
Entrega: móvil resumen, móvil completa, secuencia de recálculo (3 pantallas), sin ruta, vista lista, escritorio. Muestra el modo oscuro de la vista principal.
```

## LOTE 3: `/comparar` Comparación por perfil

```
Lote 3: "/comparar". Es la vista que el jurado tiene que entender en 5 segundos: el mismo trayecto no es el mismo para todos.

Contenido: origen y destino arriba (editables, compactos). Luego un mapa con las 4 rutas superpuestas, cada perfil con su propio patrón de trazo (Estándar: línea fina tinta; Silla de ruedas: azul gruesa continua; Movilidad reducida: azul discontinua; Baja visión: verde punteada) y la leyenda con ícono y patrón, no solo color.

Debajo, una tabla comparativa real (tabla HTML accesible con encabezados de fila y columna), no tarjetas: filas = perfiles, columnas = Metros, Minutos, Escalones, Pasa por, Advertencias. Las cifras van en Roboto Condensed tabular. La diferencia frente al Estándar se muestra como texto ("+35 m", "+1,4 min"), sin barras.
Si un perfil no tiene ruta, su fila dice "Sin ruta accesible" en rojo con ícono Prohibit y el motivo.

Encima de la tabla, una frase-resumen generada a partir de los datos, en H2: "En silla de ruedas este trayecto es 35 m más largo y evita 12 escalones." Es la frase que se lee en el pitch.
Seleccionar una fila resalta esa ruta en el mapa y atenúa las demás; también funciona con teclado.

Móvil: el mapa arriba (40% de la altura) y la tabla convertida en lista de filas apiladas por perfil (ícono + nombre + tres cifras), cada fila expandible para ver advertencias.
Proyector/escritorio: el mapa y la tabla lado a lado, con la tipografía un paso más grande.
Entrega: escritorio, móvil y escritorio con un perfil sin ruta.
```

## LOTE 4: `/reportar` Reportar y ver barreras

```
Lote 4: "/reportar". Dos tareas en la misma vista: reportar una barrera y ver las activas.

Formulario "Reportar una barrera" (etiquetas arriba, ayudas debajo, errores debajo en rojo con ícono):
1. "¿Qué pasa?": 5 opciones grandes como radio con pictograma (Ascensor fuera de servicio, Obstáculo, Rampa bloqueada, Piso mojado, Otro).
2. "¿Dónde?": selector de lugar o de tramo, con un minimapa donde se puede tocar el punto. También se puede elegir sin mapa.
3. "Detalle (opcional)": textarea con contador de 140 caracteres.
4. "¿Cuánto crees que dura?": segmentado 30 min / 1 h / 2 h / 4 h (máximo permitido: 240 min).
5. Botón "Enviar reporte".
Confirmación: un aviso verde en línea (no un toast que desaparece): "Reporte enviado. Las rutas que pasaban por Ascensor A ya se recalcularon." con "Ver en el mapa". Se anuncia por aria-live.

Lista "Barreras activas" (al lado en escritorio, debajo en móvil): cada barrera es una fila con pictograma en cuadrado amarillo o rojo, título ("Ascensor A detenido"), lugar, "Reportado hace 12 min · vence 13:05", y la acción secundaria "Ya está resuelto". Al resolverla se confirma con un diálogo accesible. Estado vacío: "No hay barreras reportadas ahora. Si ves una, avísanos: ayudas a todo el campus." (sin ilustración genérica; usa el patrón podotáctil muy suave como fondo del bloque vacío).

Límite de envíos: el servidor acepta 10 reportes por conexión (IP) cada 10 minutos; en una red Wi-Fi compartida el cupo se reparte entre todos. Diseña el estado de error 429 en línea, en rojo con ícono: "Se enviaron muchos reportes desde esta red. Espera unos minutos y vuelve a intentar." (el formulario conserva lo escrito).

Pensado para usarlo de pie y con una mano: botón de envío al alcance del pulgar y formulario que se completa en 3 toques más el lugar.
Entrega: móvil formulario, móvil con errores (incluido el límite de envíos), móvil confirmación, escritorio formulario + lista, lista vacía.
```

## LOTE 5: `/punto/:id` Punto QR con voz

```
Lote 5: "/punto/:id". Se abre al escanear un QR pegado en el campus. Usuaria principal: Valentina (baja visión, lector de pantalla). Es la vista más accesible de toda la app.

Por defecto: alto contraste, texto A+, sin mapa.
1. Arriba, en H1 enorme (40 px): "Estás en: Entrada principal". Debajo, en Cuerpo: "Portón de Av. España. Frente a ti está el Patio central."
2. Botón gigante, ancho completo, 72 px: "Escuchar indicaciones" (ícono SpeakerHigh). El navegador exige un toque antes de hablar, así que diseña el estado "Reproduciendo… · Pausar · Repetir" y una barra de velocidad Lenta/Normal/Rápida.
3. "Desde aquí puedes ir a:": lista de destinos cercanos. Cada uno es un botón-fila grande con el nombre, la indicación hablable completa ("Ascensor A: avanza 40 metros de frente por la rampa, sin escalones") y la acción "Llévame" que abre /mapa con este punto como origen.
4. Si hay una barrera en este punto: aviso amarillo arriba del todo, leído primero por la voz.
5. Pie: "Este punto QR es parte de un prototipo estudiantil." y el enlace "Cambiar perfil".

Reglas: todo el texto es real (sin abreviaturas), con orden de lectura idéntico al visual, y si se pierde la conexión el texto ya cargado sigue visible y se puede volver a escuchar.
Entrega: móvil alto contraste (principal), móvil reproduciendo, móvil modo claro normal, móvil con barrera en el punto.
```

## LOTE 6 (opcional): `/acerca` Problema, usuarios y supuestos

```
Lote 6: "/acerca". Página breve para el jurado y el README: deja clara la dificultad, a quién beneficia, cómo ayuda y qué supuestos declaramos.

Secciones, cada una con un layout distinto (no repitas la composición):
1. Dificultad: una frase grande a la izquierda ("En Casa Central, el camino accesible cambia durante el día y nadie lo avisa.") y a la derecha una foto real del campus (placeholder marcado "Foto propia del levantamiento, 1600×1000").
2. A quién ayuda: los 4 perfiles en una rejilla 2×2 con su necesidad concreta en una línea. Sin avatares ni nombres inventados de personas reales.
3. Cómo funciona: 3 acciones con verbo (Elige tu perfil · Sigue tu ruta · Reporta barreras) en una línea horizontal con pictogramas, sin "Paso 1/2/3".
4. Supuestos y límites: lista honesta (datos del grafo levantados por el equipo el 21-11-2026 o simulados, sin ubicación GPS en interiores, reportes sin moderación, voz con la del sistema). Va como texto, no escondido.
5. ODS 10, 11 y 4: una línea por cada uno, ligada a una función concreta de la app.
Sin cifras inventadas: donde vaya un número de impacto deja el espacio marcado "Cifra con fuente pendiente".
Entrega: escritorio y móvil.
```

## LOTE 7: estados del sistema y pulido final

```
Lote 7: estados y pulido sobre todas las vistas ya diseñadas.

1. Carga: esqueletos con la forma real (líneas de paso, cifras) en lugar de spinners; el mapa muestra su contorno mientras cargan las teselas.
2. Error de servidor: un mensaje en línea en la vista afectada, en lenguaje humano, con "Reintentar". Nunca un error técnico.
3. Sin conexión: la banda "En vivo" pasa a "Sin conexión" y se muestra la última ruta conocida con su hora.
4. Revisión cruzada: misma escala de radios, el azul como único acento, ninguna etiqueta en mayúsculas sobre los títulos, ningún guion largo, todos los íconos de Phosphor con el mismo peso, todos los textos con contraste AA en claro, oscuro y alto contraste.
5. Modo proyector (ya sea un toggle o ?presentacion=1): tipografía +20%, controles secundarios ocultos y la línea de ruta más gruesa, para leerse a 5 m.
6. Lista de comprobación final en la página: teclado, orden de foco, etiquetas de lectores de pantalla, zoom 200%, reduced motion.
Entrega: una página "Estados" con cada estado en cada vista principal, más la checklist marcada.
```

---

## Implementación en código (después de cada lote, en `web/`)

- **Estructura:** `web/src/styles/tokens.css` (variables de color, tipografía, radios y temas `[data-theme=dark|contraste]` + `prefers-color-scheme`), `web/src/components/` (Shell, ChipPerfil, SelectorLugar, PasoRuta, AvisoBarrera, MetricasRuta, BandaEnVivo), `web/src/views/` (Inicio, Mapa, Comparar, Reportar, Punto, Acerca), router en [web/src/main.jsx](web/src/main.jsx) con `react-router-dom` (ya está en [package.json](package.json)).
- **Dependencias nuevas** (José es dueño de `package.json`): `@phosphor-icons/react`, `@fontsource/atkinson-hyperlegible`, `@fontsource/roboto-condensed`. Nada de Tailwind ni de librerías de animación: CSS plano con transiciones cortas y `prefers-reduced-motion`.
- **Datos:** consumir `/api/grafo`, `/api/perfiles`, `/api/ruta`, `/api/comparar`, `/api/reportes` (polling 5 s), `/api/puntos/:id` según [docs/contratos.md](docs/contratos.md) §4. Si un endpoint aún no existe, usar `data/*.json` como respaldo.
- **Mapa:** `react-leaflet` con teselas claras (CARTO Positron) y su atribución; línea de ruta `Polyline` con borde (dos polilíneas superpuestas) y `dashArray` por perfil.
- **Voz:** `speechSynthesis` con `lang="es-CL"`, solo después de un toque del usuario.
- Skills al implementar: `taste-skill` (pre-flight §14) al construir cada vista; `web-design-guidelines` como auditoría antes de cada merge; `redesign-skill` en el pulido final (14:00 a 15:45).

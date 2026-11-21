# Lote 6: Acerca (`/acerca`)

- **Ruta:** `/acerca`
- **Prompt:** el Lote 6 en [../../prompts/prompts-lotes-faltantes.md](../../prompts/prompts-lotes-faltantes.md)
- **Implementa:** @holyusm
- **Estado:** diseño listo. Cómo se construye: [PLAN.md](PLAN.md)

Explica en una sola página qué problema resuelve Parejo, para quién y con qué supuestos. Es la página que se muestra al jurado junto al mapa.

**Requiere** el sistema del [Lote 0](../lote-0-sistema/) (tokens, componentes, íconos, marca). Esta carpeta trae solo lo propio de la vista. Los textos exactos están en `datos-ejemplo.json`.

> **Ojo con los perfiles:** los números de `perfiles.lista` en `datos-ejemplo.json` son de ejemplo. En la app, las cuatro tarjetas se calculan con el motor (igual que `/comparar`), así que pueden no coincidir con las capturas.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-escritorio` | Escritorio a 1440 px: **una sola vista continua hacia abajo**, sin pestañas ni secciones separadas |
| `02-movil` | Móvil a 390 px: la misma página en una columna, con scroll y la navegación inferior de la app |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen. Los `.png` usan una fuente de reemplazo.

## Estructura (de arriba hacia abajo)

1. **Cabecera** de la app (la del Lote 0). En escritorio, "Acerca" queda activa en la navegación. En móvil, cabecera de 64 px con "Accesibilidad" y barra inferior con "Acerca" activa.
2. **Portada** (fondo Cobalto `#2443D0`, texto blanco):
   - `<h1>` "El camino accesible cambia durante el día." (72 px en escritorio, 44 px en móvil, 800, interletraje -4 %, máximo 12ch).
   - Bajada en `--cobalto-tinte` `#E3E8FB`, máximo 30ch.
   - Dos botones de 52 px: "Ver mi ruta" (blanco con texto Cobalto hondo y escalón de 4 px Pacífico) va a `/mapa`; "Comparar perfiles" (borde blanco de 2 px) va a `/comparar`.
   - Ilustración: escalera translúcida con su contorno punteado, el riel blanco, la cabina Calamina y la etiqueta "Piso parejo" apuntando al piso de la cabina. En escritorio va a la derecha (máximo 520 px); en móvil, debajo de los botones a todo el ancho. Lleva `role="img"` y descripción.
3. **"Lo que cambia sin aviso"**: tres tarjetas de color (radio 24 px, 104 px de alto mínimo), cada una con un círculo de 64 px con ícono:
   - Ascensor detenido: fondo Alto `#C4122F`, círculo blanco.
   - Piso mojado: fondo Podotáctil con domos, círculo Pacífico con ícono amarillo.
   - Escalones sin rampa: fondo Pacífico, círculo Calamina.
   - Debajo: espacio para la **foto propia del levantamiento** (1600×1000, borde punteado mientras no exista) y la nota con el dato real de la memoria USM y el chip "cifra con fuente pendiente". En escritorio van lado a lado (7/5); en móvil, apilados.
4. **"Una ruta para cada forma de moverse"** (banda Calamina `#F4B6C2`):
   - Encabezado: el `<h2>`, el trayecto como dos píldoras ("Entrada principal" blanca con anillo, flecha, "Sala A-201" Pacífico con punto Calamina) y a la derecha la frase resumen en 800.
   - Cuatro tarjetas blancas (radio 24 px), una por perfil. Arriba, un **mini mapa** de 176 px con la ruta real del perfil dibujada con **su mismo trazo del Lote 3** (fina, gruesa, discontinua o de puntos) sobre un fondo tintado del color del perfil, con origen y destino. Sobre el mapa, el ícono del perfil en un círculo (abajo a la izquierda) y un chip con la diferencia frente a Estándar ("Base", "+35 m", "+25 m", "+15 m").
   - Abajo: nombre (`<h3>`), "Pasa por ..." y una lista de definiciones `<dl>` con metros, minutos y escalones en 28 px. Los escalones van en Alto si son 12 en Estándar y en Paso si son 0.
   - El mini mapa lleva `role="img"` y una descripción corta de la ruta. Escritorio 4 columnas; móvil 1.
5. **"Cómo funciona"**: tres tarjetas numeradas (es una secuencia real): Elige cómo te mueves (tinte Cobalto), Sigue tu ruta (Cobalto), Reporta lo que ves (Podotáctil). Usar `<ol>`.
6. **"La letra chica"** (fondo Pacífico): lista de supuestos con el tema en negrita.
7. **ODS**: franja con los cuadros de color oficiales de los ODS 10, 11 y 4, nombre y una frase. El número va con texto oculto "ODS 10:" para lectores de pantalla.
8. **Pie**: lockup de Parejo, aviso de prototipo estudiantil y la **firma USM**: espacio del logotipo oficial más "Universidad Técnica Federico Santa María, Casa Central, Valparaíso".

## Escritorio frente a móvil
- **Escritorio:** una única página continua con scroll natural del navegador. No dividir en pestañas, anclas con saltos ni secciones a pantalla completa.
- **Móvil:** igual, una sola columna con scroll, más la barra inferior fija de la app.
- Ancho máximo del contenido 1200 px, centrado; las bandas de color van a todo el ancho.
- Columnas por ancho de pantalla:
  - Perfiles: 4 columnas desde 1100 px, 2 entre 560 y 1099 px, 1 debajo. Nunca 3 más 1 suelta.
  - Tarjetas de "Lo que cambia sin aviso" y "Cómo funciona": 3 columnas desde 900 px, 1 debajo.
  - Foto y nota: lado a lado desde 760 px, apiladas debajo.
- Títulos fluidos: `h1` con `clamp(44px, 6vw, 72px)` y `h2` con `clamp(32px, 4vw, 44px)`.

## Reglas de contenido
- **Sin cifras inventadas.** El único dato duro es el de la memoria USM, con su fuente. La cantidad de estudiantes con discapacidad queda como "cifra con fuente pendiente" hasta tener fuente.
- **Logotipo USM:** no recrearlo ni descargarlo de internet. El espacio queda punteado hasta tener el archivo oficial y la aprobación de la Dirección General de Comunicaciones.
- Sin guiones largos ni "·" en la interfaz.

## Accesibilidad
- Un solo `<h1>`; cada sección es `<section aria-labelledby>` con su `<h2>`.
- Todos los enlaces y botones miden 48 px o más.
- La información de color (tipo de barrera, perfil) siempre va acompañada de texto.
- Contraste AA verificado en todas las combinaciones de la página.
- En alto contraste y modo oscuro se aplican los tokens del Lote 0 (las bandas pasan a negro o `--fondo` y los bordes se refuerzan).

## Criterios de aceptación
- [ ] En escritorio y móvil la página es una sola vista continua hacia abajo.
- [ ] Sin scroll horizontal ni texto cortado a 1440, 1024, 720 y 390 px.
- [ ] Los botones de la portada llevan a `/mapa` y `/comparar`.
- [ ] Los datos de perfiles coinciden con los del Lote 3.
- [ ] El dato de la memoria USM aparece con su fuente.
- [ ] Los placeholders (foto, cifra, logotipo USM) se ven claramente como pendientes.

## Archivos sugeridos
- `web/src/views/Acerca.jsx`
- `web/src/views/Acerca.css`
- `web/src/views/acerca.json` (textos de `datos-ejemplo.json`, sin los números de perfiles)

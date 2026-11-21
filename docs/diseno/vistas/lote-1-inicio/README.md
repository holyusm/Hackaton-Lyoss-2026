# Lote 1: Inicio (`/`)

**Objetivo:** que en menos de 15 segundos Camila (silla de ruedas) elija su perfil y su destino y llegue a su ruta. Es la primera pantalla que ve el jurado.

Requiere la carpeta `../lote-0-sistema` (tokens, componentes, íconos). Esta carpeta trae solo lo propio de la vista.

**Plan de implementación:** [PLAN.md](PLAN.md) (el mapa de escritorio queda como placeholder).

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-movil-claro` | Estado listo: Silla de ruedas y Sala A-201 elegidos. 390×844, el contenido de más se ve con scroll |
| `02-movil-oscuro` | Lo mismo en tema oscuro |
| `03-movil-alto-contraste-texto-muy-grande` | Alto contraste con A++: rejilla de perfiles en una columna, botón en dos líneas. Pantalla completa |
| `04-movil-estado-sin-perfil-ni-destino` | Primera visita: nada elegido, Estándar "Sugerido", botón deshabilitado con motivo |
| `05-movil-estado-destino-igual-origen` | Error: Desde y Hasta son Sala A-201 |
| `06-escritorio-claro` | 1440 px: formulario 5/12 y mapa 7/12 |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen medidas y colores. Los `.png` usan una fuente de reemplazo y sirven para ver la composición.

## Estructura en móvil (de arriba hacia abajo)

1. **Cabecera** de 64 px: Wordmark y botón "Accesibilidad" (ver Shell en `componentes.md`).
2. **`<main id="contenido">`**, con padding de 28 px arriba y 16 px a los lados, y 32 px entre bloques:
   1. `<h1>` "¿A dónde vas hoy?" en 44 px, 800, interletraje -3 %, interlineado 1, `text-wrap: balance`. Debajo, en Cuerpo: "Te mostramos el camino que sí puedes recorrer en Casa Central." Sin imagen ni ilustración.
   2. `<fieldset>` con la leyenda "¿Cómo te mueves?" (20 px, 800) y debajo `.rejilla-perfiles` con 4 `TarjetaPerfil` en 2×2. Con A++, una columna.
   3. Campo **Desde**: valor "Entrada principal", ícono `MapPin`, y debajo `.boton--enlace` "Estoy en un punto QR" con `QrCode`.
   4. Campo **Hasta**: ícono `MagnifyingGlass`, botón "Borrar destino" si tiene valor, el error si corresponde, y la fila `.frecuentes` (Sala A-201, Biblioteca, Baño accesible B, Casino) con scroll horizontal y snap.
   5. **Aviso compacto** amarillo (solo si hay barreras activas): "**2 barreras activas en el campus.** Tu ruta ya las evita." más el enlace "Ver barreras".
   6. Pie legal.
3. **`.accion-fija`**, pegada sobre la navegación: botón primario de ancho completo, "**Ver mi ruta** en silla de ruedas" (la segunda parte en 400 y cambia según el perfil; ver `textoBoton` en `datos-ejemplo.json`). Si no se puede continuar, el botón queda con `aria-disabled` y debajo el motivo.
4. **`.nav-movil`** de 76 px con Ruta activa.

## Estructura en escritorio (≥ 900 px)

- Cabecera de 72 px con navegación y barra de accesibilidad.
- Debajo, una fila `display: flex; flex-wrap: wrap` que ocupa el alto restante:
  - **Formulario** `flex: 5 1 440px`, con padding de 32 px arriba y abajo, 56 px a la izquierda y 48 px a la derecha, y 26 px entre bloques. `<h1>` de 52 px. Las tarjetas de perfil son horizontales: ícono a la izquierda, nombre y descripción, check a la derecha; rejilla `repeat(auto-fit, minmax(min(220px, 100%), 1fr))`. "Estoy en un punto QR" va a la derecha de la etiqueta Desde. Los frecuentes se envuelven en varias líneas. El botón no es fijo: va al final del formulario.
  - **Mapa** `flex: 7 1 520px`, mínimo 560 px de alto, con borde izquierdo de 1 px `--linea`. El mapa es contexto y el formulario es la acción.
- **El aviso de barreras va sobre el mapa** (arriba a la izquierda, ancho máximo 400 px, con `--sombra-panel`), no en el formulario.

### Mapa de escritorio
- Leaflet con teselas claras CARTO Positron y la atribución visible (ver `mapa` en `datos-ejemplo.json`). El mapa de la referencia es un **esquema dibujado a mano**: sirve para ver qué se marca y cómo, no la ubicación real. Las coordenadas reales salen del levantamiento del equipo o de los planos de https://infraestructura.usm.cl/informacion-general/.
- Marcadores (`MarcadorMapa` en `componentes.md`): Ascensor A y Baño accesible B como servicio, la escalera de 12 escalones, "Piso mojado" como barrera y "Rampa lateral bloqueada" como bloqueo. Cada uno con su etiqueta en píldora.
- **Origen:** círculo hueco con la etiqueta "Entrada principal". **Destino:** pin Cobalto con la etiqueta Pacífico ("Sala A-201, piso 2"); se mueve cuando cambia el destino.
- Controles arriba a la derecha: Acercar, Alejar y Centrar, botones de 48 px con `aria-label`.
- Leyenda abajo a la izquierda: Barrera activa, Bloqueado, Servicio accesible (cada una con su forma).
- El mapa no es la única forma de elegir: todo se puede hacer desde el formulario. Al mapa le basta `aria-label="Mapa del campus Casa Central"`, y los marcadores van fuera del orden de tabulación o con nombre accesible.

## Comportamiento

Estado de la vista: `{ perfil: id | null, desde: idLugar, hasta: idLugar | null }`.

- **Perfil**
  - Se lee de `localStorage['parejo:perfil']`. Si no hay nada guardado, no se preselecciona ninguno: Estándar muestra la píldora "Sugerido" y bajo la rejilla aparece "Si no eliges, te mostramos la ruta Estándar. Puedes cambiarlo después."
  - Al elegir se guarda en `localStorage`.
  - Grupo de radio con roving tabindex y flechas (ver `componentes.md`).
- **Desde**
  - Por defecto `entrada-principal`.
  - Si la URL trae `?desde=<id>` (por ejemplo al volver desde un punto QR), se usa ese.
  - "Estoy en un punto QR" lleva a elegir un punto (en el prototipo basta con navegar a `/punto/:id`; está fuera de este lote).
- **Hasta**
  - Combobox con búsqueda que no distingue mayúsculas ni tildes, sobre `nombre` y `meta`, agrupada por `grupo` (Salas, Servicios, Edificios). Al final, la opción "Estoy en un punto QR".
  - Los chips frecuentes asignan el destino en un toque.
  - "Borrar destino" lo vacía y devuelve el foco al input.
- **Validación**
  - Si `hasta === desde`: borde rojo, `aria-invalid="true"` y el error "Elige un destino distinto al punto de partida." enlazado con `aria-describedby`.
  - El error se muestra al cambiar el campo, no al cargar la página.
- **Botón "Ver mi ruta"**
  - Habilitado solo si hay destino y no hay error.
  - Deshabilitado con `aria-disabled="true"` (sigue enfocable) y el motivo debajo: sin destino, "Elige a dónde vas para ver tu ruta."; con error, "Elige un destino distinto al punto de partida."
  - Al activarlo navega a `/mapa?desde=<id>&hasta=<id>&perfil=<id>`. Si no se eligió perfil, envía `perfil=estandar`.
- **Barreras activas**
  - Vienen de `/api/reportes` (consulta cada 5 s). Si la respuesta falla, se usa `data/*.json`.
  - El aviso solo aparece si hay al menos una, con el número real ("1 barrera activa", "2 barreras activas").
  - "Ver barreras" lleva a `/reportar#activas`.
  - Cuando el número cambia se anuncia con `role="status"`.
- **Preferencias del shell**
  - Tema y tamaño de texto se aplican con `data-tema` y `data-texto` en `<html>` y se guardan en `localStorage`.

## Textos exactos

| Lugar | Texto |
|---|---|
| Título | ¿A dónde vas hoy? |
| Bajada | Te mostramos el camino que sí puedes recorrer en Casa Central. |
| Leyenda de perfiles | ¿Cómo te mueves? |
| Píldora | Sugerido |
| Ayuda sin perfil | Si no eliges, te mostramos la ruta Estándar. Puedes cambiarlo después. |
| Etiquetas | Desde · Hasta |
| Placeholder Hasta | Busca una sala, un baño o un edificio |
| Enlace QR | Estoy en un punto QR |
| Borrar (aria-label) | Borrar destino |
| Grupo de frecuentes (aria-label) | Lugares frecuentes |
| Error | Elige un destino distinto al punto de partida. |
| Aviso | **2 barreras activas en el campus.** Tu ruta ya las evita. · Ver barreras |
| Botón | **Ver mi ruta** + texto del perfil (en silla de ruedas / con pocos escalones / para baja visión / nada en Estándar) |
| Motivo sin destino | Elige a dónde vas para ver tu ruta. |
| Pie | Prototipo estudiantil. No es un servicio oficial de la USM. Datos de ejemplo. |

(En esta tabla el "·" solo separa textos distintos; no aparece en la interfaz.)

## Archivos sugeridos

```
web/src/views/Inicio.jsx
web/src/components/TarjetaPerfil.jsx       (más GrupoPerfiles con el teclado)
web/src/components/CampoLugar.jsx          (combobox y lista de lugares)
web/src/components/ChipLugar.jsx
web/src/components/AvisoBarrera.jsx
web/src/components/MapaCampus.jsx          (react-leaflet, marcadores con divIcon)
web/src/components/Shell.jsx               (cabecera, nav, panel de accesibilidad, pie)
web/src/hooks/usePreferencias.js           (perfil, tema, texto, voz en localStorage)
web/src/hooks/useBarreras.js               (consulta cada 5 s, con respaldo en data/*.json)
```

## Criterios de aceptación

- [ ] En móvil se ve igual que `01-movil-claro`, en escritorio igual que `06-escritorio-claro`, y lo mismo en oscuro y alto contraste.
- [ ] Desde la carga hasta "Ver mi ruta" se puede llegar solo con teclado, en el orden visual. Las flechas recorren los perfiles.
- [ ] El foco se ve en todos los elementos (anillo Pacífico y amarillo).
- [ ] Con A++ y zoom al 200 % no hay scroll horizontal ni texto cortado; los perfiles quedan en una columna.
- [ ] El lector de pantalla anuncia: el grupo "¿Cómo te mueves?" con el perfil elegido, cada campo con su etiqueta, el error, el motivo del botón deshabilitado y el aviso de barreras.
- [ ] El perfil elegido se recuerda al recargar.
- [ ] Ningún estado se comunica solo con color.
- [ ] Ningún texto de la interfaz usa guion largo, semiguion ni "·".
- [ ] Contraste AA verificado en los tres temas (axe o Lighthouse sin errores de contraste).

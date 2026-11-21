# Lote 4: Reportar y ver barreras (`/reportar`)

Dos tareas en la misma vista: **reportar una barrera** y **ver las activas**. Está pensada para usarse de pie y con una mano: el botón de envío queda al alcance del pulgar y, con el lugar elegido, el reporte sale en 3 toques.

**Requiere** [../lote-0-sistema/](../lote-0-sistema/) (tokens, componentes, íconos). Esta carpeta trae solo lo propio de la vista. Los textos exactos y los datos están en `datos-ejemplo.json`.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-movil-formulario` | Pantalla de 390×844 tal como se abre, con el botón fijo abajo |
| `02-movil-formulario-completo` | El formulario entero lleno, más la lista de barreras activas |
| `03-movil-errores-validacion` | Enviar vacío: resumen de errores arriba y un error en cada campo |
| `04-movil-limite-envios-429` | El servidor rechaza por límite: mensaje junto al botón, el formulario conserva lo escrito |
| `05-movil-reporte-enviado` | Confirmación verde en la página, la barrera nueva primero con la marca "Nuevo" |
| `06-movil-dialogo-resuelto` | Diálogo para confirmar "Ya está resuelto" |
| `07-escritorio-formulario-y-lista` | 1440 px: formulario a la izquierda, lista a la derecha |
| `08-escritorio-lista-vacia` | Estado vacío de la lista, con el patrón podotáctil muy suave |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen. Los `.png` usan una fuente de reemplazo.

## Formulario "Reportar una barrera"

Etiquetas arriba, ayudas y errores debajo. Los errores van en `--alto` (800) con el ícono `Warning`.

1. **Encabezado:** `<h1>` "Reportar una barrera" (34 px en móvil, 44 px en escritorio, 800) y la bajada "Tu aviso cambia las rutas de todos en segundos." en `--tinta-2`.
2. **¿Qué pasa?:** `<fieldset role="radiogroup">` con `<legend>`. Contiene 5 tarjetas `<button role="radio">` de 92 px de alto mínimo, radio de 20 px, con el ícono en un cuadrado de 40 px y el nombre en 17 px, 800.
   - En móvil van en una rejilla de 2 columnas y "Otro" ocupa el ancho completo. En escritorio, las 5 en una fila.
   - La elegida se invierte (fondo Pacífico, check visible).
   - **Teclado:** roving tabindex. Solo la elegida (o la primera) tiene `tabIndex=0`; las flechas mueven la selección y el foco; Espacio elige. En el prototipo todas son tabulables; en código, apliquen el patrón completo.
3. **¿Dónde?:** `CampoLugar` del Lote 1 (ícono `MapPin`, 60 px) con la ayuda "Elige de la lista o toca el punto en el plano.".
   - Debajo va un **plano chico**: un `<button>` que contiene el plano (el SVG va con `aria-hidden`). Su `aria-label` dice dónde está el punto y que se puede mover. Al tocarlo se pone o mueve el pin, que llena el campo con el lugar más cercano del grafo. Abajo a la derecha lleva la pastilla "Toca para mover el punto" ("Haz clic…" en escritorio).
   - El plano es un extra: **todo se puede hacer sin él**, desde el campo.
4. **Detalle (opcional):** `<textarea>` de 3 filas con `maxlength="140"` y contador "31 de 140" a la derecha. El contador va con `aria-live="polite"` y está enlazado al campo con `aria-describedby`.
5. **¿Cuánto crees que dura?:** `<fieldset role="radiogroup">` con 4 segmentos de 56 px en una píldora (30 min, 1 h, 2 h, 4 h; por defecto 2 h) y la ayuda "Después de ese tiempo el aviso se borra solo. Máximo 4 horas.". El máximo de 240 min lo controla el servidor.
6. **Enviar reporte:** botón primario de 60 px con el ícono `Flag`.
   - En móvil va en una barra fija sobre la navegación inferior.
   - En escritorio va al final del formulario, junto a la nota "Puedes enviar hasta 10 reportes cada 10 minutos.".

### Validación al enviar
- Si falta el tipo o el lugar:
  - arriba aparece un **resumen** (`role="alert"`, borde de 2 px `--alto`): "Faltan 2 datos para enviar el reporte:", con enlaces a cada campo;
  - cada campo muestra su error y lleva `aria-invalid="true"` y `aria-describedby` hacia el mensaje;
  - las tarjetas de "¿Qué pasa?" toman borde rojo.
  - Los errores desaparecen apenas se corrige cada campo.
- El foco va al resumen de errores.

### Límite de envíos (429)
- El servidor acepta 10 reportes por persona cada 10 minutos.
- Con un 429, el mensaje aparece **junto al botón de envío** (`role="alert"`, ícono `Prohibit`, texto en `--alto`): "**Enviaste muchos reportes seguidos.** Espera unos minutos y vuelve a intentar. Tu reporte sigue escrito."
- **El formulario conserva todo lo escrito.** Si la respuesta trae `reintentarEnSegundos`, se puede volver a habilitar el envío pasado ese tiempo.

### Confirmación
- Es **un aviso verde en la página, no un toast que desaparece**: borde de 2 px `--paso`, fondo `#E6F2EC`, check en un círculo verde, `role="status"` y `aria-live="polite"`.
- Texto: "**Reporte enviado.** Las rutas que pasaban por Ascensor A ya se recalcularon." más el enlace "Ver en el mapa", que lleva a `/mapa` con la ruta actual.
- El formulario se reemplaza por el aviso y el botón secundario "Reportar otra barrera", que deja el formulario vacío.
- La barrera nueva aparece **primera** en la lista, con borde verde y la marca "Nuevo".
- El foco va al aviso.

## Lista "Barreras activas"

Va debajo en móvil y a la derecha en escritorio, dentro de un panel blanco con radio de 28 px.

- Título `<h2>` "Barreras activas (2)". En escritorio lleva debajo la banda "En vivo. Actualizado hace 3 s"; se consulta cada 5 s.
- **Cada fila:**
  - ícono en un cuadrado de 44 px: amarillo con domos y `Warning`/`Drop` para alerta, o rojo con ícono blanco para bloqueo, con `role="img"` y `aria-label` "Barrera activa" o "Bloqueado";
  - título (18 a 19 px, 800), lugar y "Reportado hace 12 min. Vence a las 13:05." en `--tinta-2`;
  - el botón secundario de 48 px "Ya está resuelto" (`aria-label="Ya está resuelto: Piso mojado"`).
- **Ya está resuelto** abre un **diálogo** (`role="dialog"`, `aria-modal`, `aria-labelledby` y `aria-describedby`):
  - título "¿Ya se resolvió esta barrera?", el nombre y lugar en 800, y el texto "Si la marcas como resuelta, el aviso deja de aparecer y las rutas vuelven a pasar por ahí.";
  - botones "Marcar como resuelto" (peligro, rojo) y "Cancelar" (secundario).
  - Atrapa el foco, se cierra con Escape y al cerrar devuelve el foco al botón de la fila.
- **Lista vacía:** un bloque con borde fino y el patrón podotáctil muy suave de fondo (`radial-gradient(circle, rgba(255,199,44,0.32) 4px, transparent 4.6px)` en una rejilla de 18 px). Texto: "**No hay barreras reportadas ahora.** Si ves una, avísanos: ayudas a todo el campus." Sin ilustración.

## Cambios frente al prompt original
- **Sin "·":** la línea "Reportado hace 12 min · vence 13:05" quedó como "Reportado hace 12 min. Vence a las 13:05.", por la regla de no usar "·".
- **Diálogo en rojo:** "Marcar como resuelto" usa el estilo de peligro, porque quita el aviso para todos.
- **Agregados que no venían en el prompt:** el resumen de errores arriba del formulario, para lectores de pantalla, y la nota "Tu reporte sigue escrito." en el 429.

## Archivos sugeridos

```
web/src/views/Reportar.jsx
web/src/components/FormReporte.jsx       (estado, validación, envío, 201 y 429)
web/src/components/OpcionesTipo.jsx      (radiogroup con roving tabindex)
web/src/components/Segmentado.jsx        (duración, mismo patrón)
web/src/components/PlanoMarcar.jsx       (plano chico, botón que pone el punto)
web/src/components/ListaBarreras.jsx     (filas, estado vacío)
web/src/components/DialogoResolver.jsx   (focus trap, Escape, devuelve el foco)
web/src/hooks/useBarreras.js             (consulta cada 5 s; ya existe desde el Lote 1)
```

## Criterios de aceptación

- [ ] Se ve como las referencias en móvil (390 px) y escritorio (1440 px).
- [ ] Con solo teclado se puede: elegir tipo y duración con flechas, elegir lugar sin usar el plano, escribir el detalle, enviar y resolver una barrera desde el diálogo.
- [ ] Al enviar con errores, el foco va al resumen y cada enlace lleva a su campo. Cada campo anuncia su error.
- [ ] El 429 se muestra junto al botón y no se pierde nada de lo escrito.
- [ ] La confirmación queda en pantalla (no desaparece sola) y se anuncia por `aria-live`.
- [ ] La barrera nueva aparece primera con "Nuevo" y las rutas afectadas se recalculan (Lote 2).
- [ ] El diálogo atrapa el foco, se cierra con Escape y devuelve el foco.
- [ ] Todo lo que se toca mide 48 px o más. Sin scroll horizontal a 390 px ni con zoom al 200 %.
- [ ] Ningún estado se comunica solo con color. Ningún texto usa guion largo, semiguion ni "·" como separador.

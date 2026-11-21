# Lote 7: estados del sistema y pulido final

Este lote no agrega rutas. Define cómo se ve **cada vista principal cuando carga, cuando falla el servidor y cuando no hay conexión**, el **modo presentación** para la feria y la **revisión cruzada** que se aplicó a todo el diseño.

**Requiere** `diseno-general/` y los lotes 1 a 6. Los textos exactos están en `datos-ejemplo.json`.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-estados-todas-las-vistas` | Las 5 vistas (Inicio, Ruta, Comparar, Reportar, Punto QR) en los 3 estados |
| `estados/<vista>-<estado>.png` | Cada una de las 15 pantallas por separado, a tamaño real (390×844) |
| `02-modo-presentacion` | Comparar a 1920×1080 con `?presentacion=1` |
| `03-revision-y-checklist` | Reglas revisadas, contraste por tema y lista de comprobación marcada |

Los `.html` cargan la tipografía real; los `.png` usan una fuente de reemplazo.

## Regla común a los tres estados

Decir qué pasó en palabras simples, **no perder lo que la persona ya eligió** (perfil, destino, texto del reporte) y darle un paso concreto. Nunca un código de error, nunca "Algo salió mal".

## 1. Cargando

- **Esqueletos con la forma real**, nunca un spinner solo:
  - Ruta: el contorno punteado de los edificios (sin relleno) mientras cargan las teselas, el título, 3 cifras y 3 pasos con su línea de metro.
  - Comparar: el contorno del mapa y 4 filas con el trazo de cada perfil en gris.
  - Inicio: 4 tarjetas de perfil y 2 selectores.
  - Punto QR: título, descripción y 3 destinos.
  - Reportar: el formulario se ve completo porque no depende del servidor. Solo la lista "Barreras activas" es esqueleto.
- **Colores:** bloques `#DCE3E5` (principales) y `#E5EAEC` (secundarios) sobre la superficie. Radios de la escala.
- **Movimiento:** opacidad entre 1 y 0,6 en 1,2 s, en bucle. Con `prefers-reduced-motion` quedan quietos.
- **Lectores de pantalla:** el contenedor lleva `aria-busy="true"` y un texto oculto con `role="status"` ("Calculando tu ruta."). Los bloques del esqueleto llevan `aria-hidden`.
- El botón principal se ve deshabilitado (`aria-disabled="true"`, fondo `#E1E6E8`, texto `#55606A`).
- Mostrar el esqueleto solo si la respuesta tarda más de 300 ms, para no parpadear.

## 2. Error del servidor

- **Mensaje en línea en la vista afectada**, no un modal ni un toast. Tarjeta con borde de 2 px Alto `#C4122F`, radio 20 px, círculo Alto de 40 px con el ícono `Warning`, título en una frase y una línea de explicación.
- `role="alert"`. El foco no se mueve solo, salvo en Reportar, donde va al mensaje.
- Acción **"Reintentar"** con el ícono `ArrowClockwise`:
  - En Ruta y Punto QR es el botón primario (es lo único que se puede hacer).
  - En Inicio y Comparar es secundario dentro de la tarjeta.
  - En Reportar reemplaza al botón de envío: "Reintentar el envío".
- Ruta ofrece además "Cambiar destino"; Punto QR, "Abrir el mapa del campus".
- Errores 4xx con mensaje propio (por ejemplo el 429 del Lote 4) mantienen su diseño; esto es para 5xx y tiempos de espera.

## 3. Sin conexión

- La banda **"En vivo" pasa a "Sin conexión"**: borde de 2 px Pacífico, ícono `WifiSlash` y un texto según la vista (ver `datos-ejemplo.json`), siempre con la hora de los datos. `aria-live="polite"`.
- Se muestra **la última respuesta buena** guardada (cachear `/api/ruta`, `/api/comparar`, `/api/reportes`, `/api/puntos/:id` en `localStorage` o con un service worker).
- Ruta: la ruta guardada con un aviso amarillo: "Es la última ruta conocida, de las 11:42. Puede haber barreras nuevas en el camino."
- Reportar: "Enviar reporte" queda con `aria-disabled` y `aria-describedby` al motivo. **El borrador se guarda en `localStorage`** y se envía cuando la persona vuelve a tocar el botón con conexión.
- Punto QR: todo sigue visible y la voz funciona sin red.
- Detectar con `navigator.onLine` más el resultado del polling de 5 s. Al volver, la banda vuelve a "En vivo" y los datos se refrescan solos.

## 4. Modo presentación

- Se activa con `?presentacion=1` o con la tecla **P** en escritorio (fuera de campos de texto). Pone `data-presentacion` en `<html>`.
- **Texto y controles +20 %**: `html[data-presentacion] { font-size: 120%; }` (todo en `rem`).
- **Líneas de ruta ×1,6**, con el mismo trazo de cada perfil (también el `dashArray` y el borde).
- **Se ocultan** el tamaño de texto, alto contraste y voz. En su lugar: la etiqueta "Modo presentación" y el enlace "Salir".
- Pensado para Comparar en el proyector, pero aplica a cualquier vista.

## 5. Ajustes a los lotes anteriores (ya aplicados en el lienzo)

- **Escala de radios** en `tokens.css`: se agrega `--r-insignia: 6px` y `--r-hoja: 28px` se reemplaza por `--r-grande: 24px` (hojas inferiores y tarjetas grandes). Quedan 6, 12, 20, 24 y 999 px. Los cuadros de ícono que tenían 10 px y la navegación inferior con 14 px pasan a 12 px.
- **Íconos:** todos `weight="bold"` de Phosphor. En el lienzo había trazos de 18 a 28; quedaron iguales.
- **Ruta (Lote 2):** "Hacia Sala A-201" pasa de `<h2>` a `<h1>`, en la hoja y en la vista de lista. La vista no tenía título principal.
- **PlanoComparar (Lote 3):** acepta el modo presentación (grosor ×1,6).

## 6. Revisión cruzada (resultado)

| Regla | Estado |
|---|---|
| Misma escala de radios | Corregido (25 casos) |
| Azul como único acento | Cumple |
| Sin etiquetas en mayúsculas | Cumple, 0 casos |
| Sin guiones largos ni "·" | Cumple, 0 casos |
| Íconos con el mismo peso | Corregido (136 íconos) |
| Contraste AA en claro, oscuro y alto contraste | Cumple; el menor es 4,6 (deshabilitado en oscuro). Tabla completa en `datos-ejemplo.json` |
| Un h1 por vista | Corregido en Ruta |
| Controles con nombre accesible | Cumple, 0 sin nombre |
| Sin scroll horizontal a 720 y 1024 px | Cumple en todas las vistas de escritorio |

## Lista de comprobación (repetir en el navegador antes de presentar)

- [ ] **Teclado:** todo se usa sin mouse; grupos de opciones con flechas; el diálogo atrapa el foco y lo devuelve.
- [ ] **Orden de foco:** igual al visual; sin `tabindex` positivos; el anillo `--foco` siempre visible.
- [ ] **Lectores de pantalla** (VoiceOver o NVDA): nombres, un h1 por vista, cambios anunciados (banda, errores, cargas).
- [ ] **Zoom al 200 %:** sin scroll horizontal ni texto cortado.
- [ ] **Movimiento reducido:** sin animaciones; la voz nunca arranca sola.
- [ ] Probar los tres estados forzándolos: DevTools en modo sin conexión y un servidor que responda 500.

## Archivos sugeridos

- `web/src/components/Esqueleto.jsx` (bloque con `aria-hidden` y la animación)
- `web/src/components/ErrorEnLinea.jsx` (props: titulo, texto, onReintentar, accionSecundaria)
- `web/src/components/BandaEnVivo.jsx` (sumar la variante sin conexión con la hora)
- `web/src/hooks/useConexion.js` (`navigator.onLine` más el polling)
- `web/src/hooks/usePresentacion.js` (parámetro y tecla P)
- `web/src/lib/cache.js` (última respuesta buena por endpoint)

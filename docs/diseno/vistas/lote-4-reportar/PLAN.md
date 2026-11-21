# Plan de implementación: Lote 4 (`/reportar`)

**Implementa:** @juaquo15, **ahora y sin el plano chico**. El plano para marcar el punto va al final (PR C), cuando #113 esté en main. **Diseño:** [README.md](README.md), [datos-ejemplo.json](datos-ejemplo.json) y `referencia/` (abre los `.html` en el navegador para medir; los `.png` solo muestran la composición).

**Objetivo:** reportar una barrera en 3 toques y ver las activas. La barrera nueva cambia las rutas de `/mapa` y `/comparar` en 5 s o menos.

**Ya existe (no hay backend nuevo):**
- `GET /api/reportes` devuelve solo los activos.
- `POST /api/reportes` recibe `{ tipo, nodo_id, descripcion, duracion_min }` y responde 201 con el `Reporte`.
- `POST /api/reportes/:id/resolver`.
- Todo está en `server/reportes.js` y `docs/contratos.md` §3.
- El 429 llega con `{ error }`, **sin** `reintentarEnSegundos`: se muestra el mensaje y no hay temporizador.
- `descripcion` es obligatoria en el servidor (máximo 280 caracteres). Si el detalle viene vacío, se manda el título armado.

**Diferencias del diseño frente al contrato, y cómo resolverlas:**
- **Tipos:** cada id del diseño se manda con el nombre del contrato:

  | Diseño | Contrato |
  |---|---|
  | `ascensor` | `ascensor_fuera_servicio` |
  | `obstaculo` | `obstaculo` |
  | `rampa` | `rampa_bloqueada` |
  | `mojado` | `piso_mojado` |
  | `otro` | `otro` |

- **Resolver:** se usa `POST …/resolver`, no el PATCH ni el DELETE que sugiere el diseño.
- **Título y lugar de cada fila:** el `Reporte` no los trae, así que se arman en el cliente:
  - **título:** sale del `tipo` con `reglasTituloNuevo` ("Ascensor A detenido" o el nombre del tipo);
  - **lugar:** es el nombre del nodo según `useLugares().grafo`;
  - **"Reportado hace":** sale de `creado`;
  - **"Vence a las":** sale de `expira`, con `toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})`.

**Reglas:**
- Usa las clases de `componentes.css` y los colores de `tokens.css`. Sin hex, salvo `#E6F2EC` del aviso enviado: va como variable en `Reportar.css`.
- Usa los textos exactos de `datos-ejemplo.json`, sin guion largo y sin "·".
- **Dueños:**
  - los archivos nuevos son de @juaquo15;
  - `main.jsx` es de @Gxppe: José autoriza en el encargo cambiar **solo** la línea de `/reportar`;
  - `useBarreras.js` **no se toca** (su PR #86 está abierto).
- **Reutiliza:**
  - `CampoLugar` (con `error` y la ayuda en `extra`);
  - `useLugares()` y `useBarreras()`;
  - `nivelReporte` de `motor/barreras.js`;
  - `AvisoBarrera`;
  - las clases `.boton--primario`, `.boton--secundario`, `.boton--peligro`, `.accion-fija` (barra fija en móvil), `.campo__ayuda`, `.campo__error` y `.banda-vivo`.
- **No uses `.segmentado`:** sus botones tienen tamaños por posición (`nth-child`), pensados para el control de tamaño de texto. La duración lleva su propia clase.

### PR A: formulario y lista, sin mapa (meta ~13:30)

| # | Archivo | Qué hace | Hecho cuando |
|---|---|---|---|
| A1 | `web/src/lib/reportes.js` + `.test.js` | Funciones puras: `TIPOS_REPORTE` (id del diseño, tipo del contrato, nombre, ícono), `DURACIONES`, `validarReporte(form)` (devuelve `{tipo?, lugar?}` con los textos de error), `cuerpoReporte(form, grafo)` (arma el body del contrato, con `descripcion` = detalle o el título), `tituloReporte(reporte, grafo)`, `lugarReporte(reporte, grafo)`, `metaReporte(reporte, ahora)` ("Reportado hace 12 min. Vence a las 13:05.") | `npm test` pasa |
| A2 | `components/OpcionesTipo.jsx` + `.css` | `fieldset role="radiogroup"` con 5 `button role="radio"` de 92 px y roving tabindex (flechas mueven foco y selección, Espacio elige). Rejilla de 2 columnas en móvil con "Otro" a lo ancho; 5 en fila en escritorio. La elegida va invertida con check. Si hay error: borde `--alto` y `aria-invalid`. | Se maneja con teclado |
| A3 | `components/SegmentadoDuracion.jsx` | Mismo patrón de radiogroup: 4 segmentos de 56 px en una píldora (2 h por defecto), con la ayuda. | Se maneja con flechas |
| A4 | `components/FormReporte.jsx` | Estados `editando`, `enviando`, `enviado` y `limite`. Lleva el `textarea` con `maxLength=140`, el contador `aria-live` y `aria-describedby`. Al enviar con errores aparece el resumen `role="alert"` con enlaces a cada campo y el foco va al resumen; cada error se borra apenas se corrige su campo. Un 429 muestra el mensaje junto al botón y conserva todo lo escrito. Con un 201 aparece el aviso verde `role="status"` y el foco va a él; "Reportar otra barrera" deja el formulario vacío. El botón de envío va en `.accion-fija` en móvil, y en escritorio al final del formulario con la nota del límite. | Se ve como `01` a `05` |
| A5 | `components/ListaBarreras.jsx` + `DialogoResolver.jsx` | `<section id="activas">` (Inicio enlaza a `/reportar#activas`) con el h2 "Barreras activas (n)", la banda "En vivo" en escritorio, las filas con ícono `role="img"` y el botón "Ya está resuelto" con su `aria-label`, y el estado vacío con el patrón podotáctil. El diálogo usa `<dialog>` nativo con `showModal()`: así atrapa el foco y Escape lo cierra; al cerrar, el foco vuelve al botón de la fila. "Marcar como resuelto" es `.boton--peligro`. | Se ve como `06` y `08` |
| A6 | `views/Reportar.jsx` + `Reportar.css` y la línea de `main.jsx` | Compone el formulario y la lista: una columna en móvil, dos columnas desde 900 px (formulario a la izquierda, panel con radio de 28 px a la derecha). La lista viene de `useBarreras()`, que consulta cada 5 s. Dos ajustes locales, sin tocar el hook: (a) la barrera recién creada se agrega primera con la marca "Nuevo" hasta que la siguiente consulta la traiga; (b) los ids resueltos se ocultan de inmediato. "Ver en el mapa" lleva a `/mapa?desde&hasta&perfil` si vienen en la URL de `/reportar`; si no, usa la ruta de la demo (`entrada-principal` a `sala-a201`, con el perfil guardado o `silla_ruedas`). | Se ve como `01` y `07` (sin el plano) |

### PR B: pulido y enlaces (meta ~14:30)
- `HojaRuta` y `VistaLista` (son de Joaco): el enlace "Reportar un problema en esta ruta" agrega `desde`, `hasta` y `perfil`, para que "Ver en el mapa" vuelva a la misma ruta.
- Revisión completa:
  - teclado;
  - zoom al 200 %;
  - 390 y 1440 px;
  - los 3 temas;
  - todo lo que se toca mide 48 px o más;
  - nada se comunica solo con color.

### PR C: plano para marcar el punto (cuando #113 esté en main y si alcanza el tiempo)
`components/PlanoMarcar.jsx` es un `<button>` con un MapContainer chico, `<CapaPlano/>` y `LIMITES`. El plano va con `aria-hidden` y el botón con un `aria-label` que dice dónde está el punto. Al hacer clic, toma el lugar de `useLugares` más cercano a ese `[lat, lng]` y lo pasa a `CampoLugar`, con la pastilla "Toca para mover el punto". Es solo un extra.

### Prueba de la demo
1. En `/reportar`, con solo teclado: tipo Ascensor, lugar Ascensor A, 2 h, Enviar. Debe pasar todo esto:
   - aparece el aviso verde;
   - "Ascensor A detenido" queda primero con la marca "Nuevo";
   - `/mapa` y `/comparar` recalculan la ruta en 5 s o menos.
2. Envía 11 reportes seguidos: aparece el 429 junto al botón y el formulario conserva lo escrito.
3. "Ya está resuelto", y luego "Marcar como resuelto": la fila desaparece y la ruta vuelve.
4. `npm test` y `npm run build` pasan.


## Decide tú (y avisa en el tablero)
Las medidas que falten, el ícono de "Rampa bloqueada" (`Prohibit` sirve) y qué hacer si un texto no cabe.

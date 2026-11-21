# Plan de implementación: Lote 0 + Lote 1 (para @Gxppe)

Complementa el issue #54 y lo reemplaza donde no coincidan. **Cambio respecto de #54:** el mapa de escritorio queda solo como placeholder (José lo planifica aparte): en este lote no se usa Leaflet ni se crea `MapaCampus.jsx`. Las coordenadas de `data/campus.json` no se tocan; las reales llegan con el levantamiento.

Los HTML de `referencia/` usan estilos en línea y no tienen clases: este plan dice qué clase de `componentes.css` va en cada elemento.

### Reglas que valen para todo
- Los ids son los del contrato: perfiles `estandar`, `silla_ruedas`, `movilidad_reducida` y `baja_vision`. Los lugares salen de `/api/grafo`.
- Clases de `componentes.css` y colores de `tokens.css`. No se copian los estilos en línea ni los hex de las referencias.
- Los estados se marcan con atributos ARIA (`aria-checked`, `aria-pressed`, `aria-current`, `aria-invalid`, `aria-disabled`), nunca con clases `.activo`.
- Ya existen `.saltar` y `.sr-only` en `tokens.css`. El foco global (`:focus-visible`) también está resuelto: no hay que redefinirlo.
- Los textos van exactos, sin guiones largos, sin "·" y sin "→".
- Íconos de `@phosphor-icons/react` con `weight="bold"` y siempre `aria-hidden`.
- No se tocan `server/`, `motor/`, `data/`, `docs/contratos.md`, `package.json`, `tokens.css` ni `componentes.css`.

### PR A: shell, router y hooks. HECHO (PR #55, en main a las 11:18)

Gxppe ya lo entregó. Lo que dejó y que PR B tiene que usar tal cual:
- `usePreferencias()` → `{perfil, setPerfil, tema, texto, voz, altoContraste, ...}`.
- `useBarreras()` → `{barreras, error, actualizado}`, con `nivel` en cada barrera.
- `useLugares()` → `{lugares, grafo, cargando}`. **No trae `porId`**: se busca con `lugares.find(l => l.id === id)`.
- **El Shell ya pone el pie legal** después del `<Outlet/>`, dentro del `main`. Inicio no lo repite.
- La navegación usa `Link` con `aria-current`. El panel de accesibilidad usa `<dialog>` nativo, y el CSS extra va en `components/Shell.css`.
- En `main.jsx`, `/` todavía apunta a `Pendiente`: PR B la cambia a `<Inicio/>`.

La tabla de abajo queda como registro de lo que se pidió.

<details><summary>Tareas originales de PR A</summary>

| # | Archivo | Qué hace | Hecho cuando |
|---|---|---|---|
| A1 | `web/src/hooks/usePreferencias.jsx` | `PreferenciasProvider` y `usePreferencias()` exponen `{tema, texto, voz, perfil, setTema, setTexto, setVoz, setPerfil}`. Lee y escribe `parejo:*` en `localStorage` dentro de try/catch. Un efecto aplica `document.documentElement.dataset.tema` y `.texto`. Si no hay un tema guardado, usa `oscuro` cuando `matchMedia('(prefers-color-scheme: dark)')` es verdadero y `claro` en otro caso. `perfil` vale `null` si no hay nada guardado. | Al recargar se mantienen el tema, el texto y el perfil |
| A2 | `web/src/hooks/useBarreras.js` | Hace `fetch('/api/reportes')` al montar y luego cada 5 s. Devuelve `{barreras, error, actualizado}`. Si falla, pone `error=true` y mantiene la última lista buena (o `[]`). Agrega `nivel` a cada reporte: `bloqueo` si `tipo` es `ascensor_fuera_servicio` o `rampa_bloqueada`, `alerta` en otro caso. Filtra los `resuelto`. Hace `clearInterval` al desmontar. | Después de un `POST /api/reportes`, la lista crece en 5 s o menos |
| A3 | `web/src/hooks/useLugares.js` | Pide `fetch('/api/grafo')` y usa `data/campus.json` como respaldo. Devuelve `{lugares, porId}`. Cada nodo trae `{id, nombre, meta, tipo, grupo}`. El grupo sale del tipo: sala → "Salas"; bano, ascensor y servicio → "Servicios"; edificio, entrada y punto → "Edificios". Excluye las escaleras. `meta` es lo que traiga el nodo (piso o edificio); si no trae nada, queda vacío. | Funciona sin el server porque usa el respaldo |
| A4 | `web/src/components/Wordmark.jsx` | `<a className="wordmark" aria-label="Parejo, inicio">`, con el SVG de `lote-0-sistema/marca/simbolo*.svg` inline (versión simplificada en móvil) y `<span aria-hidden>parejo</span>`. Usa `Link` de react-router. | Se ve igual que en `sistema-claro.html` |
| A5 | `web/src/components/PanelAccesibilidad.jsx` | `.velo` y `.hoja` con `role="dialog"`, `aria-modal="true"` y `aria-labelledby` hacia el h2 "Accesibilidad". Lleva un botón cerrar de 48 px y "Tamaño del texto" con tres píldoras con `aria-pressed`. Los interruptores `.interruptor[role=switch][aria-checked]` son "Alto contraste" y "Leer en voz alta", cada uno con `.interruptor__estado` en texto ("Activado" o "Desactivado"). Cierra con la nota "Recordamos tu preferencia en este dispositivo." y el botón `.boton.boton--primario.boton--ancho` "Listo". Atrapa el foco (Tab y Shift+Tab dan la vuelta), se cierra con Escape y devuelve el foco al botón que lo abrió. | Se usa entero con teclado |
| A6 | `web/src/components/Shell.jsx` | En orden: `<a className="saltar" href="#contenido">Saltar al contenido</a>`; `<header className="cabecera">` con Wordmark, `<nav className="nav-escritorio" aria-label="Principal">`, `.barra-accesibilidad` y `button.boton-accesibilidad[aria-expanded]`; `<main id="contenido" tabIndex={-1}>{children}</main>`; `<nav className="nav-movil" aria-label="Principal">`. Los enlaces de ambas navegaciones son `NavLink` (que pone `aria-current="page"` solo): Ruta (`/`, `end`), Comparar, Reportar y Acerca. La barra de escritorio tiene `.segmentado` A/A+/A++, más `.boton-pastilla` "Alto contraste" (alterna entre `contraste` y el tema anterior) y "Voz", todos con `aria-pressed`. El pie legal **no** va en el Shell: cada vista lo pone dentro de su `main`, porque en móvil queda antes de `.accion-fija`. | Se ve como `shell-*.png` |
| A7 | `web/src/main.jsx` | `BrowserRouter` con `PreferenciasProvider` y `Shell`. Rutas: `/` Inicio; `/mapa` Mapa; `/comparar`, `/reportar`, `/punto/:id` y `/acerca` como `Pendiente` (un `<h1>` con el nombre más el pie legal), y `*` también como Pendiente. Conserva los imports de la fuente, `tokens.css` y `componentes.css`. | Las 7 rutas cargan sin errores en consola |
| A8 | `web/src/views/Mapa.jsx` | Placeholder con `<h1>Tu ruta</h1>` que muestra los parámetros `desde`, `hasta` y `perfil` de la URL. **Desde el merge, el archivo es de @juaquo15.** | `/mapa?desde=a&hasta=b&perfil=c` muestra los tres |

**Aceptación de A:**
- `npm run build` y `npm test` pasan.
- El tema y el texto cambian desde la barra y desde el panel, y se mantienen al recargar.
- Funciona en 390 y 1440 px.

Al terminar, se hace el merge y se avisa en el tablero a @juaquo15 y a @holyusm.

</details>

### PR B: vista Inicio (unas 2 h, en curso)

**B0.** En `web/src/main.jsx`, la ruta `/` pasa a `<Inicio/>` (`import Inicio from './views/Inicio.jsx'`).

**B1. `web/src/components/TarjetaPerfil.jsx` (incluye `GrupoPerfiles`).** Tabla local:

| id | Nombre | Descripción | Ícono | textoBoton |
|---|---|---|---|---|
| estandar | Estándar | El camino más corto | Person | (vacío) |
| silla_ruedas | Silla de ruedas | Sin escalones ni adoquín | Wheelchair | en silla de ruedas |
| movilidad_reducida | Movilidad reducida | Lesión o bastón: pocos escalones | PersonSimpleWalk | con pocos escalones |
| baja_vision | Baja visión | Guía podotáctil y piso liso | Eye | para baja visión |

Los perfiles se toman de esta tabla en este orden. `/api/perfiles` no hace falta para esta vista.

```jsx
<fieldset className="inicio__perfiles">
  <legend id="leyenda-perfil" className="inicio__leyenda">¿Cómo te mueves?</legend>
  <div className="rejilla-perfiles" role="radiogroup" aria-labelledby="leyenda-perfil">
    <button type="button" role="radio" className="tarjeta-perfil"
            aria-checked={elegido} tabIndex={rovingIndex === i ? 0 : -1}>
      <span className="perfil__cabeza">
        <span className="perfil__icono"><Wheelchair weight="bold" aria-hidden /></span>
        {elegido && <span className="perfil__check"><Check weight="bold" aria-hidden /></span>}
        {sugerido && <span className="perfil__sugerido">Sugerido</span>}
      </span>
      <span className="perfil__nombre">Silla de ruedas</span>
      <span className="perfil__desc">Sin escalones ni adoquín</span>
    </button>
  </div>
  {!perfil && <p className="campo__ayuda">Si no eliges, te mostramos la ruta Estándar. Puedes cambiarlo después.</p>}
</fieldset>
```
- **Roving tabindex:** tiene `tabIndex=0` el perfil elegido, o Estándar si no hay ninguno.
- **Teclado:** ←↑ y →↓ mueven el foco al anterior o al siguiente (dan la vuelta) y lo eligen; Inicio y Fin van a la primera y a la última. Espacio o click eligen.
- **Sugerido:** solo cuando `perfil === null`, sobre Estándar.
- Al elegir se llama a `setPerfil(id)` del contexto, que lo guarda.

**B2. `web/src/components/CampoLugar.jsx`.** Props: `{id, etiqueta, icono, valor, onCambiar, lugares, error, accionEtiqueta, borrable, placeholder}`.

```jsx
<div className="campo">
  <div className="campo__cabeza">
    <label className="campo__etiqueta" htmlFor="hasta">Hasta</label>
    {accionEtiqueta /* en Desde: el enlace QR */}
  </div>
  <div className="campo__control">
    <span className="campo__icono"><MagnifyingGlass weight="bold" aria-hidden /></span>
    <input id="hasta" className="campo__input" role="combobox" aria-autocomplete="list"
           aria-expanded={abierto} aria-controls="hasta-lista"
           aria-activedescendant={resaltada ? `hasta-op-${resaltada}` : undefined}
           aria-invalid={!!error} aria-describedby={error ? 'hasta-msg' : undefined}
           placeholder="Busca una sala, un baño o un edificio" />
    {valor && borrable && <button type="button" className="campo__borrar" aria-label="Borrar destino"><X weight="bold" aria-hidden /></button>}
  </div>
  {error && <p id="hasta-msg" className="campo__error"><Warning weight="bold" aria-hidden />{error}</p>}
  {abierto && <ul id="hasta-lista" className="lista-lugares" role="listbox" aria-label="Lugares">
    {/* por grupo: <li role="presentation" className="lista-lugares__grupo">Salas</li> */}
    {/* <li role="option" id="hasta-op-sala-a201" className="lista-lugares__opcion" aria-selected>ícono + nombre + <span>meta</span></li> */}
    {/* al final: <li role="option" className="lista-lugares__opcion lista-lugares__qr">Estoy en un punto QR</li> → navigate('/punto/p1') */}
  </ul>}
</div>
```
- El input muestra el `nombre` del lugar elegido. Al escribir se filtra con `norm(s) = s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()` sobre `nombre` y `meta`.
- **Teclado:** ↓ abre o baja, ↑ sube, Enter elige la resaltada, Escape cierra (y con la lista cerrada, limpia el texto). Al perder el foco, la lista se cierra.
- Los íconos por tipo vienen de `iconos.md`: sala → Door, baño → Toilet, ascensor → Elevator, biblioteca → Books, casino → ForkKnife, edificio → Buildings.
- **Desde:** usa el mismo componente con `MapPin`, sin borrar, con valor inicial `?desde=` o `entrada-principal`, y con `accionEtiqueta` = `<Link className="boton boton--enlace" to="/punto/p1"><QrCode/>Estoy en un punto QR</Link>`. En móvil ese enlace va debajo del campo (con `order` en `Inicio.css`) y en escritorio queda a la derecha de la etiqueta.
- "Borrar destino" llama a `onCambiar(null)` y devuelve el foco al input.

**B3. `web/src/components/ChipLugar.jsx`.**
```jsx
<div className="frecuentes" role="group" aria-label="Lugares frecuentes">
  <button type="button" className="chip-lugar" aria-pressed={hasta === id}><Door weight="bold" aria-hidden />Sala A-201</button>
</div>
```
- Ids: `sala-a201`, `biblioteca`, `bano-b` y `casino`, filtrados a los que existan en `lugares`.
- El texto es el `nombre` del grafo.
- En escritorio se agrega `.frecuentes--envolver` (o se hace con un media query en `Inicio.css`).

**B4. `web/src/components/AvisoBarrera.jsx`.** Props: `{variante: 'compacto'|'alerta'|'bloqueo', titulo, children, acciones}`.

La variante compacta en Inicio:
```jsx
<div role="status" aria-live="polite">  {/* siempre montado, para que se anuncie el cambio */}
  {n > 0 && <div className="aviso aviso--compacto">
    <Warning weight="bold" aria-hidden className="aviso__glifo" />
    <p className="aviso__cuerpo"><span><strong>{n === 1 ? '1 barrera activa en el campus.' : `${n} barreras activas en el campus.`}</strong> Tu ruta ya las evita.</span>
      <Link to="/reportar#activas">Ver barreras</Link></p>
  </div>}
</div>
```
- Las variantes alerta (`.aviso` con `.aviso__icono` y Warning) y bloqueo (`.aviso.aviso--bloqueo` con Prohibit) quedan hechas para el Lote 2, sin usarse todavía.

**B5. `web/src/views/Inicio.jsx` + `Inicio.css`.**
- **Estado:** `perfil` viene del contexto. `desde` es `useSearchParams().get('desde') ?? 'entrada-principal'`. `hasta` arranca en `null`, y `tocado` también arranca en `false` y pasa a `true` cuando el usuario cambia Hasta o Desde.
- **Error:** `tocado && hasta && hasta === desde`, con el texto "Elige un destino distinto al punto de partida.".
- **Motivo:** sin destino, "Elige a dónde vas para ver tu ruta."; con error, el texto del error.
- **Botón:**
  ```jsx
  <button type="button" className="boton boton--primario boton--ancho"
          aria-disabled={!puede} aria-describedby={!puede ? 'motivo-ruta' : undefined}
          onClick={() => puede && navigate(`/mapa?desde=${desde}&hasta=${hasta}&perfil=${perfil ?? 'estandar'}`)}>
    Ver mi ruta{textoBoton && <span className="inicio__boton-extra"> {textoBoton}</span>}
  </button>
  {!puede && <span id="motivo-ruta" className="motivo">{motivo}</span>}
  ```
  `.inicio__boton-extra { font-weight: 400 }`.
- **Marcado:**
  ```jsx
  <div className="inicio">
    <div className="inicio__form">
      <div className="inicio__titulo"><h1>¿A dónde vas hoy?</h1><p>Te mostramos el camino que sí puedes recorrer en Casa Central.</p></div>
      <GrupoPerfiles/> <CampoLugar Desde/> <CampoLugar Hasta + ChipLugar/> <AvisoBarrera/>
      <div className="accion-fija inicio__accion">{botón + motivo}</div>   {/* sticky en móvil; en escritorio static */}
    </div>   {/* el pie legal lo agrega el Shell después */}
    <section className="inicio__mapa" aria-label="Mapa del campus Casa Central">
      <p>Mapa en preparación</p>
    </section>
  </div>
  ```
- **`Inicio.css` en móvil:**
  - `.inicio__form` lleva padding `28px var(--margen-movil)` y `gap: 32px`, en flex columna.
  - El h1 va en `2.444rem` (44 px), 800, `letter-spacing:-0.03em`, `line-height:1` y `text-wrap:balance`.
  - La leyenda va en `var(--t-etiqueta)` y 800.
  - `.inicio__mapa { display:none }`.
  - Como `.accion-fija` es sticky sobre la nav, el pie legal del Shell queda debajo y también es visible.
- **`Inicio.css` en escritorio (≥900 px):**
  - `.inicio` es una fila `display:flex; flex-wrap:wrap` y ocupa el alto restante.
  - `.inicio__form` lleva `flex:5 1 440px`, padding `32px 48px 32px 56px` y `gap:26px`. El h1 va en `2.889rem` (52 px).
  - Las tarjetas son horizontales: `.tarjeta-perfil` en fila, y la rejilla usa `repeat(auto-fit,minmax(min(220px,100%),1fr))`.
  - `.inicio__accion { position:static }`.
  - `.inicio__mapa` lleva `flex:7 1 520px`, `min-height:560px`, `border-left:1px solid var(--linea)` y fondo `var(--superficie)`. El texto va centrado en `var(--tinta-2)`.
  - El aviso de barreras queda en el formulario hasta que exista el mapa.
- Con `data-texto="muy-grande"`, la rejilla pasa a una columna (ya está en `componentes.css`). El botón puede quedar en dos líneas, porque solo tiene `min-height`.

**Aceptación de B (antes del merge):**
- [ ] A 390 px se ve como `01`, `02`, `03`, `04` y `05`; a 1440 px, como `06` (con el placeholder en lugar del mapa).
- [ ] Solo con teclado se llega de la carga a "Ver mi ruta" en orden visual, y las flechas recorren los perfiles.
- [ ] El foco es visible en todo.
- [ ] Con A++ y zoom al 200 % no hay scroll horizontal y los perfiles quedan en una columna.
- [ ] El lector de pantalla anuncia el grupo con el perfil elegido, las etiquetas, el error, el motivo y el aviso.
- [ ] El perfil se mantiene al recargar.
- [ ] `/mapa?...` recibe ids del contrato (por ejemplo `perfil=silla_ruedas&hasta=sala-a201`).
- [ ] Después de un `POST /api/reportes`, el aviso cambia en 5 s o menos.
- [ ] Lighthouse Accessibility ≥ 95 en los tres temas.
- [ ] `npm run build` y `npm test` pasan.

### Decide tú (y avisa en el tablero)
Las medidas que falten, los nombres internos y qué hacer si un texto no cabe.

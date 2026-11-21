# Contratos del proyecto

Lo que une las partes del proyecto. **Solo @holyusm edita este archivo**; cambios se piden en el tablero. Cada uno construye contra estos contratos, con datos falsos si el otro aún no termina.

## Arquitectura

Un repo, un `package.json` en la raíz, un solo servicio que sirve API + frontend.

- Frontend: Vite + React (JS) + Leaflet (OpenStreetMap). Voz: Web Speech API (`speechSynthesis`).
- Backend: Node + Express (`server/`). Reportes en memoria + archivo JSON. El frontend consulta reportes cada 5 s (polling).
- Motor de rutas: módulo JS puro (`motor/`), sin dependencias, probado con `node:test`.
- Deploy: Render. `npm install && npm run build && npm start`.

Todo módulo del servidor/motor es ESM (`"type": "module"`).

## 1. Grafo `data/campus.json`

```json
{
  "nodos": [
    { "id": "entrada-principal", "nombre": "Entrada principal", "tipo": "entrada",
      "lat": -33.0458, "lng": -71.6197, "edificio": "A", "piso": 0,
      "descripcion": "Portón principal de Casa Central" }
  ],
  "tramos": [
    { "id": "t1", "desde": "entrada-principal", "hasta": "ascensor-a", "metros": 40,
      "escalones": 0, "pendiente": "baja", "rampa": true, "ascensor_id": null,
      "techado": false, "superficie": "lisa", "minutos_medidos": 1.2,
      "guia_tactil": false, "notas": "", "foto": null, "sentido_unico": false }
  ]
}
```

- `nodos[].tipo`: `entrada | edificio | sala | ascensor | bano | punto`.
- `tramos[].pendiente`: `nula | baja | media | alta`. `superficie`: `lisa | irregular | adoquin`.
- Los tramos son bidireccionales salvo `sentido_unico: true` (solo `desde` → `hasta`).
- `ascensor_id`: id de un nodo de tipo `ascensor` por el que pasa el tramo; si ese nodo está bloqueado, el tramo se bloquea.
- `nodos[].x`, `nodos[].y` (opcionales, Lote 2): posición en el plano de Casa Central, en unidades del `viewBox` de `web/src/plano/casa-central.svg`, con el origen arriba a la izquierda. El mapa de `/mapa` usa estas, no `lat`/`lng` (que quedan para un GPS futuro). Conversión: `aLatLng` de `web/src/plano/plano.js`.
- `tramos[].nombre` (opcional, Lote 2): cómo se nombra el tramo en los pasos, en minúscula y con artículo ("la rampa del Edificio B"). Sin `nombre`, los pasos usan un texto genérico.

## 2. Perfiles `data/perfiles.json`

```json
[
  { "id": "silla_ruedas", "nombre": "Silla de ruedas", "descripcion": "...",
    "prohibido": { "escalones": true, "pendiente": ["alta"] },
    "costos": { "escalon": 0, "pendiente": { "media": 1.5 }, "superficie": { "adoquin": 1.5, "irregular": 2 } } }
]
```

Ids obligatorios: `estandar`, `silla_ruedas`, `movilidad_reducida` (lesión temporal / bastón: escalones muy caros pero no prohibidos), `baja_vision` (prefiere guía táctil, evita superficie irregular). `prohibido` = el tramo no se puede usar; `costos` = multiplicadores/penalizaciones (el dueño, @juaquo15, define el detalle manteniendo `id`, `nombre`, `descripcion`).

## 3. Motor `motor/ruta.js`

```js
calcularRuta(grafo, perfiles, { desde, hasta, perfil, bloqueos = [] })
// -> { ok: true, nodos: [id...], tramos: [id...], metros, minutos, escalones, advertencias: [string] }
// -> { ok: false, motivo: "sin ruta accesible para este perfil" }
compararPerfiles(grafo, perfiles, { desde, hasta, bloqueos = [] })
// -> { estandar: <resultado>, silla_ruedas: <resultado>, ... }
```

`bloqueos`: lista de ids de tramo o de nodo. Bloquear un nodo `ascensor` bloquea todos los tramos con ese `ascensor_id`.

## 4. API HTTP (prefijo `/api`, JSON)

| Método y ruta | Respuesta |
|---|---|
| `GET /grafo` | contenido de `data/campus.json` |
| `GET /perfiles` | contenido de `data/perfiles.json` |
| `GET /ruta?desde&hasta&perfil` | resultado de `calcularRuta` (con bloqueos de reportes activos) |
| `GET /comparar?desde&hasta` | resultado de `compararPerfiles` |
| `GET /reportes` | `[ Reporte ]` solo activos |
| `POST /reportes` | 201 `Reporte` |
| `POST /reportes/:id/resolver` | `Reporte` con `resuelto: true` |
| `GET /puntos/:id` | `Punto` |
| `GET /simulador?perfil&obras` | resultado de `simular` (§7). `obras` = ids separados por coma, opcional |

```json
// Reporte
{ "id": "r1", "tipo": "ascensor_fuera_servicio", "tramo_id": null, "nodo_id": "ascensor-a",
  "descripcion": "Ascensor A detenido", "creado": "2026-11-21T14:05:00Z",
  "expira": "2026-11-21T16:05:00Z", "resuelto": false }
// POST /reportes body: { tipo, tramo_id | nodo_id, descripcion, duracion_min }
// tipo: ascensor_fuera_servicio | obstaculo | rampa_bloqueada | piso_mojado | otro
// Punto (QR)
{ "id": "p1", "nodo_id": "entrada-principal", "titulo": "Entrada principal",
  "texto_voz": "Estás en la entrada principal...", "indicaciones": [ { "hacia": "Ascensor A", "texto": "Avanza 40 metros de frente, sin escalones." } ] }
```

Errores: `{ "error": "mensaje" }` con 400 o 404.

`GET /ruta` no trae textos de pasos ni coordenadas: el frontend los deriva del grafo con `armarRuta(grafo, resultado)` (`web/src/lib/pasos.js`). El id de una ruta es `tramos.join('-')`; si cambia entre dos consultas, la ruta se recalculó.

## 5. Rutas del frontend (José)

`/` perfil y destino · `/mapa` ruta · `/comparar` · `/reportar` · `/punto/:id` (lo abre el QR, lee en voz alta) · `/campus` mejorar el campus (simulador de obras, Lote 8) · `/horario` ¿llegas a tu próxima clase? (Lote 9, pendiente).

## 6. Dueños de carpetas

Ver tabla en `AGENTS.md` §4.

## 7. Simulador de obras (Lote 8, `/campus`)

Palabras: ver [`GLOSSARY.md`](../GLOSSARY.md) (lugar, trayecto, trayecto con barrera, obra).

### `data/obras.json` (@juaquo15)

```json
[
  { "id": "rampa-patio-biblioteca", "tipo": "rampa",
    "titulo": "Rampa en la escalera del patio central hacia la Biblioteca",
    "lugar": "Patio central", "costo_relativo": "medio",
    "perfiles_beneficiados": ["silla_ruedas", "movilidad_reducida"],
    "cambios": [ { "tramo_id": "t6", "valores": { "escalones": 0, "rampa": true, "pendiente": "baja" } } ],
    "tramos_nuevos": [], "nodos_nuevos": [] }
]
```

- `tipo`: `rampa | ascensor | superficie | guia_tactil | techado`. `costo_relativo`: `bajo | medio | alto` (estimación del equipo, nunca pesos).
- `cambios`: sobrescribe campos de tramos que ya existen (`Object.assign`). `tramos_nuevos` y `nodos_nuevos`: mismo formato que §1, para obras que agregan camino (p. ej. un ascensor nuevo).
- Todo `tramo_id` de `cambios` existe en `campus.json`; los ids nuevos no chocan con los existentes.

### Motor `motor/simulador.js` (@Gxppe, archivo nuevo; traspaso autorizado por @holyusm)

```js
simular(grafo, perfiles, obras, { perfil = 'silla_ruedas', ids = [] })
// -> {
//   perfil,
//   hoy:       { trayectos_evaluados, trayectos_con_barrera, minutos_extra_prom },
//   con_obras: null | { trayectos_evaluados, trayectos_con_barrera, minutos_extra_prom,
//                       trayectos_sin_barrera_por_perfil: { silla_ruedas, movilidad_reducida, baja_vision } },
//   obras: [ { ...obra sin cambios/tramos_nuevos/nodos_nuevos, trayectos_sin_barrera, minutos_ahorrados_prom } ],
//   zonas: [ { nodo_id, nombre, lat, lng, estado, trayectos_con_barrera, minutos_extra } ]
// }
```

Reglas de cálculo (siempre sobre el campus construido: `bloqueos = []`, los reportes no cuentan):

- **Lugares:** nodos con `tipo` `entrada | edificio | sala | bano`. **Trayecto:** par ordenado de lugares distintos (ida y vuelta cuentan aparte). `trayectos_evaluados = n * (n - 1)`.
- **Trayecto con barrera**, con `calcularRuta` del perfil:
  - `silla_ruedas`: `ok: false`.
  - `movilidad_reducida`: `ok: false` o `escalones > 0`.
  - `baja_vision`: `ok: false` o algún tramo de la ruta con `superficie` `adoquin | irregular` o `guia_tactil: false`.
  - `estandar`: nunca.
  - `perfil = 'todos'`: con barrera para al menos uno de los tres perfiles anteriores; en ese caso `minutos_extra_prom` y `minutos_extra` van `null`.
- **`minutos_extra_prom`:** promedio, sobre los trayectos con `ok: true` en el perfil, de `minutos(perfil) - minutos(estandar)`. Redondeo a 1 decimal.
- **`obras[]`:** cada obra se evalúa **sola** contra hoy, para el perfil pedido. `trayectos_sin_barrera` = trayectos con barrera hoy que dejan de tenerla con esa obra. `minutos_ahorrados_prom` = promedio de minutos que baja la ruta en los trayectos con `ok: true` antes y después (1 decimal, `null` en `todos`). Orden: `trayectos_sin_barrera` desc, luego `minutos_ahorrados_prom` desc.
- **`con_obras`:** todas las obras de `ids` aplicadas juntas. `null` si `ids` está vacío. `trayectos_sin_barrera_por_perfil` = cuántos trayectos dejan de tener barrera en cada perfil.
- **`zonas[]`:** un elemento por lugar, sobre los trayectos que **llegan** a ese lugar, con las obras de `ids` aplicadas si hay. `trayectos_con_barrera` = cuántos de esos trayectos tienen barrera. `estado`: `con_barrera` si `trayectos_con_barrera > 0`; si no, `desvio` si `minutos_extra > 0.5`; si no, `accesible`. `minutos_extra` = promedio de minutos extra de esos trayectos.
- Módulo puro, sin dependencias. No muta `grafo` (aplicar obras sobre una copia).

### `GET /api/simulador?perfil=silla_ruedas&obras=id1,id2` (@Gxppe)

- `perfil` opcional (por defecto `silla_ruedas`); acepta los ids de `perfiles.json` y `todos`. `obras` opcional.
- 400 `{ error }` si el perfil o algún id de obra no existe. Si `data/obras.json` no existe aún, responde con `obras: []`.
- Debe responder en menos de 2 s en Render con el grafo real. Si no alcanza, se cachea `hoy` por perfil al arrancar (el grafo no cambia en ejecución).

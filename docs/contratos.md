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

`/` perfil y destino · `/mapa` ruta · `/comparar` · `/reportar` · `/punto/:id` (lo abre el QR, lee en voz alta).

## 6. Dueños de carpetas

Ver tabla en `AGENTS.md` §4.

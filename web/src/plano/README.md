# Plano de Casa Central (`web/src/plano/`)

Plano vectorial del campus generado desde **OpenStreetMap**, con estilo propio desde los tokens. No usa teselas ni el jpg oficial. Las coordenadas son reales (WGS84), así que los nodos del grafo usan `lat`/`lng` verdaderos.

Dueño: `@holyusm`. Para cambiar algo aquí, pidan traspaso en el tablero.

## Archivos

| Archivo | Qué es |
|---|---|
| `generar.mjs` | Script que consulta Overpass y escribe el GeoJSON. Se corre a mano, no en el build. |
| `casa-central.geo.json` | Datos generados (se commitean: la app no depende de Overpass). |
| `plano.js` | Exporta `geojson`, `LIMITES`, `LIMITES_VISTA`, `CENTRO`, `ZOOM`, `ATRIBUCION`, `LETRAS` y `estilo(feature)`. |
| `plano.css` | Estilo por tipo (`.plano-edificio`, `.plano-edificio--campus`, `.plano-patio`, `.plano-sendero`, `.plano-escalera`, `.plano-calle`, `.plano-letra`). Solo colores de `tokens.css`: funciona en claro, oscuro y contraste. |
| `CapaPlano.jsx` | Componente react-leaflet: dibuja el plano en paneles bajo la ruta (`zIndex` 250 y 350) y las letras de los edificios (`aria-hidden`). |

## Cómo se usa

```jsx
import { MapContainer } from 'react-leaflet';
import CapaPlano from '../plano/CapaPlano.jsx';
import { LIMITES, LIMITES_VISTA, ZOOM } from '../plano/plano.js';

<MapContainer
  className="mapa-plano"
  bounds={LIMITES}
  maxBounds={LIMITES_VISTA}
  minZoom={ZOOM.min}
  maxZoom={ZOOM.max}
>
  <CapaPlano />
  {/* ruta, marcadores, etc. encima */}
</MapContainer>
```

- CRS normal de Leaflet (no `CRS.Simple`), sin `TileLayer`.
- La atribución "© colaboradores de OpenStreetMap" la agrega la capa sola; no la oculten (licencia ODbL).
- Las letras y el plano son decorativos para el lector de pantalla: la información accesible va en la hoja de ruta.
- Los puntos de servicio del GeoJSON no se dibujan (los marcadores los pone `MapaRuta`).

## Cómo se regenera

```sh
node web/src/plano/generar.mjs
```

Consulta `overpass-api.de` con un User-Agent genérico (`campus-prototype/0.1`) y no envía datos personales. Trae la relación `8187017` ("Universidad Técnica Federico Santa María") y, en una caja con margen, edificios, senderos, escaleras, calles, salas interiores (`indoor`) y servicios. Un edificio queda con `campus: true` si su centro cae dentro del contorno de la relación o si su nombre u operador es de la USM (Sansamed, FEUTFSM, RR.HH.). Si Overpass responde 502 o 504, esperen un minuto y reintenten.

Propiedades por elemento: `tipo` (campus, calle, patio, edificio, sala, pasillo, sendero, rampa, escalera, servicio), `osm`, `nombre`, `ref`, `nivel`, `pisos`, `silla`, `servicio`, `campus`, `letra`.

## Licencia

Datos © colaboradores de OpenStreetMap, disponibles bajo la [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). Hay que mostrar la atribución en el mapa. Si modificamos y publicamos los datos, la base derivada queda bajo ODbL.

## Tabla de anclajes

Coordenadas reales para ubicar los nodos de `data/campus.json`. Para edificios es el centro del contorno; para elegir la puerta, muévanse unos metros hacia el sendero más cercano. `lat`, `lng` con 6 decimales (~10 cm).

### Accesos

| Lugar | lat | lng | Nota |
|---|---|---|---|
| Acceso Av. España (escalas frente al Edificio A) | -33.033897 | -71.595230 | Inicio de las escaleras desde Av. España; con escalones |
| Escala Vista Nave (base, Av. España) | -33.033639 | -71.593948 | Sube hacia el Museo |
| Escala Vista Nave (llegada) | -33.034302 | -71.593662 | |
| Acceso oriente (Edificio R / FEUTFSM) | -33.035472 | -71.592952 | Por confirmar en el plano oficial |
| Acceso sur (Edificio C, Av. Matta) | -33.036543 | -71.595244 | Por confirmar en el plano oficial |

OSM no tiene nodos `entrance` en Casa Central: los accesos salen de dónde los senderos cruzan el contorno. José los confirma con el jpg oficial.

### Patios

| Lugar | lat | lng |
|---|---|---|
| Patio Central | -33.034933 | -71.595880 |
| Pasaje Gounod | -33.034400 | -71.592978 |

### Edificios

| Edificio | lat | lng | Pisos (OSM) |
|---|---|---|---|
| A | -33.034852 | -71.595507 | |
| B (candidato: edificio central sin nombre en OSM, `relation/17542343`) | -33.035603 | -71.595209 | |
| C | -33.036030 | -71.594625 | |
| D | -33.035271 | -71.596014 | |
| E | -33.035224 | -71.596437 | |
| F | -33.034832 | -71.596705 | |
| K (CIAC) | -33.036202 | -71.595639 | |
| L (Tribuna) | -33.034930 | -71.594260 | |
| M | -33.034903 | -71.592931 | |
| M2 (Gimnasio 2) | -33.034889 | -71.593304 | |
| P | -33.036781 | -71.594223 | |
| Q (Cafetería Vivendum) | -33.035800 | -71.595948 | |
| R | -33.035658 | -71.592920 | 2 |
| T | -33.035182 | -71.597597 | 4 |
| U (Biblioteca) | -33.034936 | -71.595002 | |
| Gimnasio 1 | -33.035214 | -71.595309 | |
| Comedores | -33.035505 | -71.596102 | |
| Museo Institucional | -33.034257 | -71.594433 | 3 |
| Edificio de Innovación Tecnológica | -33.034068 | -71.592398 | 4 |

### Servicios (puntos OSM)

| Servicio | lat | lng |
|---|---|---|
| Casino | -33.035443 | -71.595821 |
| Sala de Estar y Ocio | -33.035455 | -71.595477 |
| Radio USM | -33.035017 | -71.595886 |
| Cajero Banco Santander | -33.036245 | -71.594660 |
| Estacionamiento de bicicletas (Patio Central) | -33.034368 | -71.595927 |

### Escaleras con nombre o relevantes

| Escalera | Inicio lat, lng | Fin lat, lng |
|---|---|---|
| Escala Vista Nave | -33.033639, -71.593948 | -33.034302, -71.593662 |
| Escalas acceso Av. España al A (`way/173079174`) | -33.034543, -71.595697 | -33.034681, -71.595626 |
| Escala entre Patio Central y Gimnasio (`way/1278343078`) | -33.034464, -71.595778 | -33.034574, -71.595788 |
| Escala junto a C (`way/1276695236`) | -33.035783, -71.594792 | -33.035849, -71.594755 |

OSM trae 36 escaleras en total (`tipo: 'escalera'` en el GeoJSON) y ninguna rampa etiquetada dentro del campus. La rampa del Edificio B y la pasarela de `campus.json` son supuestos del prototipo: van en la sección "supuestos" del README.

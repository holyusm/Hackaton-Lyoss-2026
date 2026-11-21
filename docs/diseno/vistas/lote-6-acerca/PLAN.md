# Plan del Lote 6 (`/acerca`)

Implementa @holyusm. Rama `<issue>-acerca` desde `main` fresco.

## Quién toca qué

| Archivo | Dueño | Para este lote |
|---|---|---|
| `web/src/views/Acerca.jsx`, `Acerca.css`, `acerca.json` (nuevos) | @holyusm | La vista y sus textos |
| `web/src/main.jsx` | @Gxppe | Una línea: `<Route path="/acerca" element={<Acerca />} />` en lugar de `Pendiente`. Se avisa en el tablero. |
| `web/src/components/Shell.jsx` | @Gxppe | **No se toca.** Ya tiene "Acerca" (ícono `Info`) y la marca activa. |
| `web/src/lib/comparar.js`, `lineaRuta.js`, `motor/` | otros | Solo se importan, no se editan. |

## Datos

- **Textos:** `acerca.json` sale de `datos-ejemplo.json`, sin `perfiles.lista`.
- **Perfiles, en vivo:** el trayecto `entrada-principal` → `sala-a201` se calcula sin barreras con `compararPerfiles(grafo, perfiles, …)` de `motor/ruta.js` y `armarFilas` de `web/src/lib/comparar.js`, como en `/comparar`. De cada fila salen el chip (`difMetros`), "Pasa por" (`pasaPor`), los metros, los minutos y los escalones. La frase resumen sale de `fraseResumen`. Así los números de esta página coinciden con el Lote 3 y no hay cifras inventadas.
- Escalones en `--alto` si son más de 0 y en `--paso` si son 0.

## Mini mapa

SVG propio, sin Leaflet: `lineaRuta(grafo, fila.tramos, fila.nodos[0], (n) => [n.lat, n.lng])`, proyectado a un `viewBox` común a las cuatro tarjetas. De fondo van los edificios del campus de `web/src/plano/plano.js`. El trazo de cada perfil copia `ESTILOS` de `MapaComparar.jsx`, con los mismos colores de `MapaComparar.css`. Lleva `role="img"` y un `aria-label` con la ruta.

## Pruebas

`npm run build` y `npm test`. Revisar `/acerca` a 1440, 1024, 720 y 390 px, en los tres temas, con texto muy grande, con zoom al 200 % y con teclado. Los números tienen que ser iguales a los de `/comparar` sin barreras activas.

## Aceptación

Las casillas de "Criterios de aceptación" del [README](README.md).

# Levantamiento en terreno: Casa Central USM

Guía y planilla para medir el campus a mano. Los datos van en `data/levantamiento/nodos.csv` y `tramos.csv`; el conversor los valida y genera `data/campus.json` (formato de `docs/contratos.md` §1).

```
node data/levantamiento/convertir.js             # solo valida
node data/levantamiento/convertir.js --escribir  # valida y escribe data/campus.json
```

## Qué llevar
Celular con mapa (para lat/lng), cronómetro, cinta o app de medición (o contar pasos: 1 paso ≈ 0,7 m), libreta o este archivo abierto, cámara. Si puedes, pedirle a alguien que recorra los tramos empujando una silla de ruedas o con bastón para medir tiempos reales de cada perfil.

## Qué es un nodo
Un lugar donde alguien decide o llega: entradas, puertas de edificios, ascensores (uno por ascensor), baños accesibles, salas clave, bifurcaciones. Apunta **15 a 25**. Un nodo por cada ascensor (`tipo: ascensor`) y otro nodo en cada piso al que llega.

| Campo | Cómo llenarlo |
|---|---|
| `id` | minúsculas y guiones, sin tildes: `ascensor-a`, `biblioteca-p1` |
| `nombre` | como lo diría un estudiante |
| `tipo` | `entrada`, `edificio`, `sala`, `ascensor`, `bano`, `punto` |
| `lat`, `lng` | del mapa del celular, parado en el punto (6 decimales, con punto) |
| `edificio`, `piso` | letra o nombre; piso 0 = calle |
| `descripcion` | una frase útil para orientarse |

## Qué es un tramo
El recorrido directo entre dos nodos, sin decisiones intermedias. Un tramo por cada camino distinto, **incluidas las alternativas** (escalera y rampa hacia el mismo lugar son dos tramos). Son bidireccionales salvo `sentido_unico`.

| Campo | Cómo medirlo |
|---|---|
| `id` | `t1`, `t2`... |
| `desde`, `hasta` | ids de nodos |
| `metros` | cinta o pasos |
| `escalones` | contar todos los del tramo (0 si no hay) |
| `pendiente` | `nula` plano; `baja` leve (menos de 5 %); `media` se nota al caminar (5 a 8 %); `alta` esfuerzo claro o más de 8 % (límite de rampas accesibles en la norma chilena) |
| `rampa` | `si` si hay rampa en el tramo |
| `ascensor_id` | id del nodo ascensor, solo si el tramo pasa por él |
| `techado` | `si` si te protege de lluvia |
| `superficie` | `lisa`, `irregular` (grietas, baldosas sueltas), `adoquin` |
| `minutos_medidos` | cronometra a paso normal, ida; anota en `notas` si mediste con silla o bastón |
| `guia_tactil` | `si` si hay baldosa podotáctil |
| `notas` | lo que cambie la experiencia: ancho, puertas pesadas, obstáculos fijos |
| `foto` | ruta relativa a `data/`, por ejemplo `fotos/t4.jpg`; vacío si no hay |
| `sentido_unico` | `si` solo si físicamente solo se puede ir de `desde` a `hasta` (por ejemplo, una puerta de salida) |

## Fotos
Una por tramo difícil o interesante (escaleras, rampas, piso irregular). **Sin rostros ni patentes.** Nómbralas como el tramo (`t4.jpg`), guárdalas en `data/fotos/` y reduce a menos de 500 KB.

## Planilla rápida de terreno (para imprimir o copiar)

```
TRAMO ___  de ______________ a ______________
metros ___  escalones ___  pendiente: nula / baja / media / alta
rampa: si / no   techado: si / no   guía táctil: si / no
superficie: lisa / irregular / adoquín   minutos ___  (paso normal / silla / bastón)
sentido único: si / no   foto: ____   notas: ______________________
```

## Supuestos y limitaciones (completar al terminar)
- Fecha y hora del levantamiento: _____
- Quién midió y con qué instrumentos: _____
- Los metros medidos con pasos tienen error de ±10 %.
- Los tiempos son de una sola persona a paso normal; no representan a todos los usuarios de cada perfil.
- No se midió: _____ (zonas cerradas, pisos sin acceso, etc.)
- El estado de ascensores y obras es el del día de la medición.


## Cifras de impacto

Salen de `node motor/impacto.js`, que lee `data/campus.json` y `data/perfiles.json` y llama a `compararPerfiles` (`motor/ruta.js`), el mismo cálculo de `GET /api/comparar`. Nada está calculado a mano: si cambian los datos, se vuelve a correr el script y se pega la salida aquí. Cada celda es metros · minutos · escalones, o "sin ruta accesible".

**Supuesto declarado (leer junto a las cifras):** el grafo de `data/campus.json` sigue siendo simulado (`"simulado": true`); el levantamiento en terreno (#12) no está hecho. Las distancias salen de las coordenadas reales del plano de OpenStreetMap (#118); los tiempos usan 1,2 m/s más 2 s por escalón; y el acceso sin escalones de la entrada principal es un dato de ejemplo (#134). Son cifras de la simulación, no mediciones en terreno.

| Origen → destino | Estándar | Silla de ruedas | Movilidad reducida | Baja visión |
|---|---|---|---|---|
| Entrada principal → Sala A-201 | 320 m · 5,9 min · 42 esc. | 330 m · 5,5 min · 0 esc. | 330 m · 5,5 min · 0 esc. | 330 m · 5,5 min · 0 esc. |
| Entrada principal → Biblioteca | 140 m · 1,9 min · 0 esc. | sin ruta accesible | 140 m · 1,9 min · 0 esc. | 140 m · 1,9 min · 0 esc. |
| Entrada principal → Casino | 340 m · 4,8 min · 0 esc. | 340 m · 4,8 min · 0 esc. | 340 m · 4,8 min · 0 esc. | 340 m · 4,8 min · 0 esc. |
| Entrada principal → Baño accesible B | 145 m · 2 min · 0 esc. | sin ruta accesible | 145 m · 2 min · 0 esc. | 145 m · 2 min · 0 esc. |
| Entrada principal → Edificio A, piso 2 | 315 m · 5,8 min · 42 esc. | 325 m · 5,4 min · 0 esc. | 325 m · 5,4 min · 0 esc. | 325 m · 5,4 min · 0 esc. |
| Entrada principal → Sala A-201 (bloqueo: ascensor-a) | 320 m · 5,9 min · 42 esc. | 450 m · 6,4 min · 0 esc. | 450 m · 6,4 min · 0 esc. | 320 m · 5,9 min · 42 esc. |
| Entrada principal → Sala C231 | 540 m · 8,2 min · 20 esc. | 550 m · 8,6 min · 0 esc. | 550 m · 8,6 min · 0 esc. | 550 m · 8,6 min · 0 esc. |
| Entrada principal → Sala C231 (bloqueo: ascensor-c) | 540 m · 8,2 min · 20 esc. | sin ruta accesible | 540 m · 8,2 min · 20 esc. | 540 m · 8,2 min · 20 esc. |

### Resumen

- Pares evaluados: 8 (los de bloqueo son escenarios con un ascensor fuera de servicio: A para la Sala A-201 y C para la Sala C231). Las salas del Edificio C (piso 2) entran desde `data/levantamiento/salas.csv`; su interior es simulado (ver `data/README.md`).
- Sin ruta accesible en silla de ruedas: 2 de los 6 destinos (Entrada principal → Biblioteca y Entrada principal → Baño accesible B), porque la única alternativa sin escalones es una rampa lateral demasiado empinada (#125).
- Ruta accesible frente a estándar en los 4 pares sin bloqueo donde ambas existen: +7,5 m y -0,1 min en promedio. En Sala A-201 y Edificio A, piso 2 la ruta accesible es 10 m más larga pero 0,4 min **más rápida** (la escalera de 42 escalones pesa más en tiempo que el rodeo por el ascensor); en el Casino es la misma ruta; en la Sala C231 es 10 m y 0,4 min más lenta (el ascensor espera más que 20 escalones).
- Con el ascensor A bloqueado (Entrada principal → Sala A-201): la ruta en silla de ruedas pasa a 450 m y 6,4 min, es decir +130 m y +0,5 min frente a la estándar, que sigue con 42 escalones. Baja visión mantiene la escalera en ese escenario.
- Con el ascensor C bloqueado (Entrada principal → Sala C231): **no hay ruta en silla de ruedas** al piso 2 del Edificio C (la estándar sube 20 escalones). Esa es la barrera que el reporte en vivo hace visible.

### Frases para el pitch

1. "En nuestra simulación del campus, 2 de los 6 destinos que probamos, entre ellos la Biblioteca, no tienen ninguna ruta posible en silla de ruedas desde la entrada principal."
2. "Para llegar a la Sala A-201, la ruta accesible es solo 10 metros más larga que la escalera de 42 escalones y, según el modelo, hasta 0,4 minutos más rápida."
3. "Cuando el ascensor A está fuera de servicio, la app recalcula la ruta en silla de ruedas: 130 metros y 0,5 minutos más que por la escalera, pero sin escalones."
4. "En el Edificio C, si el ascensor deja de funcionar, ninguna sala del segundo piso es alcanzable en silla de ruedas: la app lo muestra al instante."

> Supuesto de estas cifras y frases: grafo simulado (#12 pendiente); distancias de las coordenadas reales del plano de OpenStreetMap (#118); tiempos a 1,2 m/s más 2 s por escalón; acceso sin escalones de la entrada es un dato de ejemplo (#134). Se reemplazan al completar el levantamiento real.

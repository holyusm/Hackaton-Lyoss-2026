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

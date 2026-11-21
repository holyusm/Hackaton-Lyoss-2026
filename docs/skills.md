# Skills: qué son y cuándo usar cada una

Una **skill** es un instructivo que Claude Code carga cuando la tarea lo amerita. Viven en `.claude/skills/` y llegan a tu máquina con `git pull`; no hay que instalar nada.

**Cómo se usan:**
- Escribe `/nombre` en Claude Code (por ejemplo `/grilling`), o
- pídelo con palabras normales ("revisa la UI", "diagnostica este error") y Claude la carga solo.

## Las que tenemos

| Skill | Cuándo usarla | Ejemplo de prompt |
|---|---|---|
| `tablero-equipo` | Siempre. Se carga sola: coordina mensajes y trabajo en paralelo | (automático) |
| `grilling` / `grill-me` | Antes de construir algo. Te bombardea a preguntas, en rondas y con su respuesta recomendada, hasta que el plan no tiene huecos. **Uso clave: a las 09:20, para afilar la idea contra el ODS y la rúbrica** | `/grilling nuestra idea es X para el ODS Y` |
| `prototype` | Cuando no sabes cómo debería verse o funcionar algo. Hace versiones desechables para comparar | `/prototype 3 variantes de la pantalla principal` |
| `design-taste-frontend` (carpeta `taste-skill`) | Al construir la interfaz o la landing. Evita el look "hecho por IA" (degradados morados, tres tarjetas iguales) | `construye la landing con la skill de taste` |
| `redesign-existing-projects` (carpeta `redesign-skill`) | Pulido final (14:00–15:45): sube el nivel visual sin romper nada | `/redesign-existing-projects aplica a la app` |
| `web-design-guidelines` | Revisión rápida de UI y accesibilidad antes del congelamiento | `revisa mi UI en src/app` |
| `diagnosing-bugs` | Algo se rompe y no es obvio por qué. Primero arma una prueba que reproduzca el error, después lo arregla | `diagnostica: el botón guardar no hace nada` |
| `research` | Buscar datos con fuentes para el pitch (cifras del ODS, documentación de una API). Trabaja en segundo plano | `/research cifras de desperdicio de agua en Chile con fuentes` |

## Consejos para quien parte con skills

- **Una sesión, una tarea.** Para otra cosa en paralelo, abre otra sesión en un worktree (ver `tablero-equipo`, sección 4).
- **Lee lo que hace.** Las bases exigen que entiendas y sepas explicar tu código. Antes de aceptar un cambio grande, pregúntale a Claude: "explícame qué hiciste y por qué".
- **Las skills de diseño son para la interfaz**, no para la lógica. Úsalas cuando la funcionalidad ya exista.
- **No pegues secretos** (tokens, contraseñas) en el chat ni en el repo.

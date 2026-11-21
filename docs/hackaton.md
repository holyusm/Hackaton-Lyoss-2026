# Hackatón LYOSS USM 2026: contexto oficial

Resumen de las bases oficiales y de https://www.lyoss.org/eventos/hackaton-2026/. Si algo de aquí choca con lo que diga la organización el día del evento, **manda la organización**. Avisos oficiales: Discord https://discord.com/invite/vESGc8JajC, Instagram @lyoss.usm, lyoss.org.

## Qué es

Hackatón de un día organizada por LYOSS (Software Libre USM). Equipos de 3 personas. El desafío es un **ODS (Objetivo de Desarrollo Sostenible)** que se revela al inicio. La relación con el ODS tiene que verse **en la funcionalidad**, no solo en el discurso.

Lugar: Salón de Honor, Edificio A, Casa Central USM.

**Desafío 2026 (ya revelado): "Campus sin barreras: movilidad y orientación para todos".** Resumen y decisiones del equipo en [`docs/desafio.md`](desafio.md). PDFs oficiales en [`docs/oficial/`](oficial/).

## Horario (y lo que hacemos en cada bloque)

| Hora | Oficial | Nosotros |
|---|---|---|
| 08:30 | Acreditación | Laptops cargados, `gh auth status` ok, Claude Code funcionando |
| 09:20 | **Inicio oficial: se revela el ODS.** Antes de esto no se escribe código del producto | José crea el repo del proyecto desde el kit (`docs/kit.md`, 2 min). 09:20–09:50: idea + `grilling` de la idea (orquestador con José) |
| 09:50 | | Esqueleto + `docs/contratos.md` + issues asignados ([ASIGNACIÓN]) |
| ~10:30 | | **Deploy del esqueleto** (URL pública que funciona) |
| 10:30–13:00 | | Construcción en paralelo. [ESTADO] cada ~60 min |
| 13:00–14:00 | Almuerzo | Las sesiones pueden seguir trabajando en issues ya asignados |
| 14:00–15:45 | | Terminar funcionalidad principal. Pulido visual (`design-taste-frontend` / `redesign-existing-projects`) |
| **15:45** | | **[CONGELAR]: no más features.** Solo bugs, README, pitch |
| 16:30 | | Checklist de entrega completo (abajo). Ensayo del pitch cronometrado |
| **17:00** | **Cierre del desarrollo y entrega.** Después no se permiten cambios sustanciales | Repo público, último push hecho |
| 17:00–17:45 | Evaluación (pitch + demo) | Pitch de 3:00 |
| 17:45 | Premiación | |

## Cómo nos evalúan (5 jueces)

| Criterio | Peso | Qué significa para nosotros |
|---|---|---|
| **Impacto** | 30% | Problema real del ODS, para quién, cuánto mejora. Con un número o un caso concreto |
| **Innovación** | 25% | Algo que no sea "otra app de listas". Un enfoque o una técnica distinta |
| **Ejecución** | 20% | **La demo en vivo hace lo que el pitch promete.** No prometer nada que no funcione |
| **Presentación** | 15% | Pitch claro + README completo |
| **UX/UI** | 10% | Que se vea cuidado y se entienda sin explicación |

Desempate: Impacto, luego Ejecución, luego Innovación.

## Entregables obligatorios

- [ ] **Repositorio PÚBLICO** (GitHub) antes de las 17:00: el del proyecto, nunca el kit (`docs/kit.md`). José decide cuándo.
- [ ] **LICENSE** con licencia OSI: ya viene MIT desde el kit
- [ ] **README.md** con: nombre y descripción; problema que resuelve (y su ODS); funcionalidades; instalación; ejecución; tecnologías, dependencias y servicios; integrantes (roles opcionales); recursos externos usados; **herramientas de IA usadas**
- [ ] Archivos de configuración **sin secretos** (`.env.example`, nunca `.env`)
- [ ] **Prototipo funcional** (idealmente con URL pública)
- [ ] Documentación suficiente para levantarlo
- [ ] **Pitch de máximo 3:00**: problema, solución, funcionalidades, demo en vivo, tecnologías, diferenciadores, impacto. De 3:00 a 3:30 se descuentan 2 puntos; a los 3:30 se corta

## Reglas de originalidad y de IA

- El código central del proyecto se escribe **durante el evento** (desde las 09:20). La organización puede revisar el historial de git.
- Se permite código genérico preexistente (configuración, utilidades, estructura base) **si se declara**. Lo nuestro preexistente, que va declarado en el README:
  - `tools/board`, `.claude/hooks/`, `.claude/settings.json`: tablero de coordinación del equipo (no es parte del producto)
  - `.claude/skills/`: guías para los agentes de IA
  - `AGENTS.md`, `docs/`: reglas de trabajo del equipo
- La IA está permitida, **pero se declara** (Claude Code y las skills usadas) y el equipo **tiene que entender y saber explicar el código**. Los jueces pueden preguntar por cualquier parte: cada uno debe poder explicar su área.

## Riesgos que ya conocemos

- **Repo público y el tablero.** Al hacerlo público, cualquiera puede comentar en el issue #1 y los agentes leerían esos comentarios. `tools/board` muestra el autor de cada post: los agentes solo obedecen a `@holyusm`, `@Gxppe` y `@juaquo15`. Si aparece spam, se bloquea el issue (`gh issue lock 1`) y se coordina por chat.
- **Demo en vivo que falla.** Tener un video corto de respaldo y datos de ejemplo precargados.
- **Promesas de más.** Lo que no esté funcionando a las 15:45 no se menciona en el pitch.

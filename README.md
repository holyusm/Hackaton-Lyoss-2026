<!--
  Este README es la base que exigen las bases de la Hackatón LYOSS 2026.
  Reemplazar todo lo que está entre <...> antes de las 16:30. Cómo usar el kit: docs/kit.md
-->

# <Nombre del proyecto>

<Una o dos frases: qué es y para quién.>

**ODS:** <número y nombre del Objetivo de Desarrollo Sostenible> · **Demo:** <URL pública>

## Problema

<Qué problema real resuelve, a quién afecta y un dato concreto con su fuente.>

## Solución y funcionalidades

<Cómo lo resuelve y por qué es distinto a lo que ya existe.>

- <Funcionalidad 1: cómo se conecta con el ODS>
- <Funcionalidad 2>
- <Funcionalidad 3>

## Instalación

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
<comando de instalación de dependencias>
cp .env.example .env   # completar las variables, nunca subir .env
```

## Ejecución

```bash
<comando para levantar el proyecto>
```

Abrir <http://localhost:XXXX>.

## Tecnologías, dependencias y servicios

| Tipo | Qué usamos |
|---|---|
| Lenguajes / frameworks | <...> |
| Dependencias principales | <...> |
| Servicios externos / APIs | <...> |
| Deploy | <...> |

## Equipo

| Integrante | GitHub | Rol |
|---|---|---|
| José | [@holyusm](https://github.com/holyusm) | <rol> |
| <nombre> | [@Gxppe](https://github.com/Gxppe) | <rol> |
| <nombre> | [@juaquo15](https://github.com/juaquo15) | <rol> |

## Recursos externos

- <Datasets, APIs, imágenes, íconos o librerías externas, con su enlace y licencia>

## Herramientas de IA utilizadas

- **Claude Code** (Anthropic): asistente de programación usado para <generar código, depurar, revisar la UI, ...>. El equipo revisó y entiende todo el código.
- Skills de Claude Code incluidas en `.claude/skills/` (guías de trabajo para el agente): `tablero-equipo`, `grilling`, `prototype`, `design-taste-frontend`, `redesign-existing-projects`, `web-design-guidelines`, `diagnosing-bugs`, `research`.
- <Otras herramientas de IA, si se usaron>

## Componentes preexistentes (declarados)

Antes del evento preparamos solo herramientas genéricas de coordinación del equipo. **No contienen código del producto.** Están en el primer commit del repositorio:

- `tools/board`, `tools/nuevo-proyecto`, `.claude/hooks/`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/`: tablero de mensajes entre los agentes del equipo sobre un issue de GitHub. Basado en la plantilla "Hackathon agent board" de [azizu06](https://github.com/azizu06) ([guía](https://marvelous-relative-5de.notion.site/hack)).
- `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`, `docs/hackaton.md`, `docs/skills.md`, `docs/kit.md`: reglas de trabajo y guías para los agentes.

Todo el código del producto se escribió durante la hackatón, desde las 09:20.

## Licencia

[MIT](LICENSE)

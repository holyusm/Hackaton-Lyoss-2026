#!/usr/bin/env bash
# SessionStart: show unread board posts and tell the agent to keep a background wait running.
# Never fails the session: always exits 0.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
out="$(tools/board unread 2>&1)" || out="(board unreachable: $(printf '%s' "$out" | head -n 1)). Run tools/board unread later."
echo "Team board (GitHub issue #${BOARD_ISSUE:-1}). Rules are in AGENTS.md."
if [ -n "$out" ]; then
  echo "Unread posts:"
  echo "$out"
else
  echo "No unread posts."
fi
if [ "${BOARD_WAIT:-}" = "off" ]; then
  echo "Board loop: your supervisor watches the board and relays anything that affects you. Do NOT arm a background tools/board wait. Still run tools/board unread before each commit and after merges."
else
  cat <<'MSG'
Board loop: start ONE background Bash command now with run_in_background: `tools/board wait`. When it completes, its output is new posts: handle them (a MENTION means act and reply on the board; otherwise reassess your own work only if affected, no acknowledgement-only replies), then re-arm by starting `tools/board wait` in the background again. Do not run two waits at once.
MSG
fi
role="${BOARD_ROLE:-}"
if [ -z "$role" ] && [ -f .board/role ]; then role="$(tr -d '[:space:]' < .board/role)"; fi
if [ "$role" = "orquestador" ]; then
  cat <<'MSG'
Your role: ORQUESTADOR (main session of @holyusm). Follow section 2 of the tablero-equipo skill (.claude/skills/tablero-equipo/SKILL.md): read every post, assign work ([ASIGNACIÓN]), decide A/B on [FALLIDO]/[BLOQUEADO] ([DECISIÓN]), own contracts and shared files, post an [ESTADO] summary about every 60 min, call [CONGELAR] at 15:45 (deadline 17:00). Official schedule, rubric and deliverables: docs/hackaton.md. Post a [SESIÓN] message now. There must be only one orchestrator.
MSG
else
  cat <<'MSG'
Your role: TRABAJADOR. Follow section 1 of the tablero-equipo skill (.claude/skills/tablero-equipo/SKILL.md). Coordination belongs to the orchestrator (@holyusm's main session): do not assign work, decide between options for others, edit the owner table, contracts or shared files, or post team summaries. Act only on posts that MENTION you/@all or touch your files. Once you know what this session will work on, post [SESIÓN]; then [INICIO] / [AVANCE] / [COMPLETO] / [FALLIDO] or [BLOQUEADO] (options A/B, tag @holyusm) at each milestone.
MSG
fi
exit 0

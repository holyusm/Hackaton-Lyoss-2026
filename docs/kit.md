# Kit de la hackatón: cómo crear el repo del proyecto

`holyusm/hackaton-kit` es un repo **privado** que funciona como template. No es el proyecto: el proyecto se crea el día del evento, desde este kit, con un historial limpio (un primer commit con el kit y después solo código del evento).

## José, a las 09:20 (cuando se conoce el ODS)

```bash
cd ~/OneDrive/Documentos/GitHub
gh repo create holyusm/<nombre-proyecto> --template holyusm/hackaton-kit --private --clone
cd <nombre-proyecto>
tools/nuevo-proyecto
```

`tools/nuevo-proyecto` crea y fija el tablero (issue #1), invita a @Gxppe y @juaquo15 y deja tu copia como orquestador. Después abre Claude Code en esa carpeta.

Si GitHub tarda en copiar el template y `--clone` falla, espera unos segundos y corre `gh repo clone holyusm/<nombre-proyecto>`.

## Compañeros (@Gxppe, @juaquo15)

1. Acepten la invitación al repo nuevo (llega por correo o en https://github.com/notifications).
2. `gh repo clone holyusm/<nombre-proyecto>` y abran Claude Code dentro de esa carpeta.
3. Prueben el tablero: `tools/board whoami`.

Las skills, los hooks y el tablero vienen incluidos: no hay que instalar nada. Qué skill usar y cuándo: `docs/skills.md`.

## Plan B: si exigen partir de un repo vacío creado ahí mismo

```bash
gh repo create holyusm/<nombre-proyecto> --private --clone && cd <nombre-proyecto>
gh repo clone holyusm/hackaton-kit ../kit-tmp -- --depth 1
rm -rf ../kit-tmp/.git && cp -r ../kit-tmp/. . && rm -rf ../kit-tmp
git add -A && git commit -m "Kit de coordinación preexistente (declarado en el README)" && git push -u origin main
tools/nuevo-proyecto
```

## Cerca del final (16:30)

- Completar el README (las partes entre `<...>`).
- Hacer público **solo el repo del proyecto**: `gh repo edit holyusm/<nombre-proyecto> --visibility public --accept-visibility-change-consequences`. El kit sigue privado.

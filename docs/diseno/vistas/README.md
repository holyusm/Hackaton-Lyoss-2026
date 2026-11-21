# Diseños de las vistas

José diseña cada vista en Claude Design y deja aquí lo exportado: capturas, HTML o el handoff. Cada lote tiene su carpeta. Quien implementa una vista la construye en `web/` a partir de estos archivos y de las instrucciones que recibe en el tablero.

| Carpeta | Ruta | Implementa |
|---|---|---|
| [lote-0-sistema](lote-0-sistema/) | toda la app | @Gxppe (junto con el Lote 1) |
| [lote-1-inicio](lote-1-inicio/) | `/` | @Gxppe |
| [lote-2-mapa](lote-2-mapa/) | `/mapa` | @juaquo15 |
| [lote-3-comparar](lote-3-comparar/) | `/comparar` | por asignar |
| [lote-4-reportar](lote-4-reportar/) | `/reportar` | por asignar |
| [lote-5-punto](lote-5-punto/) | `/punto/:id` | por asignar |
| [lote-6-acerca](lote-6-acerca/) | `/acerca` | por asignar |
| [lote-7-estados](lote-7-estados/) | todas | por asignar |

## Cómo se usa

1. José sube los diseños de un lote a su carpeta y asigna quién lo implementa en el tablero, con las instrucciones completas.
2. Quien implementa lee primero `lote-0-sistema/`, porque ahí están los colores, la tipografía y los componentes que se comparten, y después la carpeta de su lote.
3. Si el diseño no responde una duda, decide con lo que ya está en el Lote 0 y en [prompts-claude-design.md](../prompts-claude-design.md), y avisa en el tablero qué decidiste. No esperes a José para cosas pequeñas.
4. Antes de abrir el PR, revisa la vista con teclado, con zoom al 200% y en el ancho de un teléfono (390 px).

## Reglas en `web/`

- Cada vista vive en su archivo, `web/src/views/<Vista>.jsx`, y su CSS en `web/src/views/<Vista>.css`. Ese archivo es de quien implementa la vista.
- Los archivos compartidos son de quien implementa el Lote 0: `web/src/styles/tokens.css`, `web/src/components/` y el router en `web/src/main.jsx`. Para cambiarlos, pide el traspaso en el tablero.
- Los colores se usan desde `tokens.css`, nunca escritos a mano en una vista.
- Si necesitas una dependencia nueva, pídela en el tablero, porque `package.json` es de José.

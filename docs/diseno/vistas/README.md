# Diseños de las vistas (parejo)

José diseña cada vista en Claude Design y deja aquí lo exportado. Quien implementa una vista la construye en `web/` a partir de estos archivos y de las instrucciones que recibe en el tablero. Lo que viene de Claude Design está descrito en [ENTREGA.md](ENTREGA.md).

| Carpeta | Ruta | Diseño | Implementa |
|---|---|---|---|
| [lote-0-sistema](lote-0-sistema/) | toda la app: marca, tokens, componentes, shell | listo | @Gxppe |
| [lote-1-inicio](lote-1-inicio/) | `/` | listo | @Gxppe |
| [lote-2-mapa](lote-2-mapa/) | `/mapa` | listo | @juaquo15 |
| [lote-3-comparar](lote-3-comparar/) | `/comparar` | listo | @Gxppe |
| [lote-4-reportar](lote-4-reportar/) | `/reportar` | listo | @juaquo15 |
| [lote-5-punto](lote-5-punto/) | `/punto/:id` | listo | @Gxppe |
| [lote-6-acerca](lote-6-acerca/) | `/acerca` | pendiente | por asignar |
| [lote-7-estados](lote-7-estados/) | todas | pendiente | por asignar |
| [lote-10-plano](lote-10-plano/) | `/plano` | listo | @juaquo15 |

## Qué leer antes de implementar

1. [lote-0-sistema/README.md](lote-0-sistema/README.md): marca, color, tipografía, accesibilidad, tono y lo prohibido.
2. [lote-0-sistema/componentes.md](lote-0-sistema/componentes.md) y [iconos.md](lote-0-sistema/iconos.md): anatomía, estados y ARIA de cada componente; qué ícono de Phosphor va en cada lugar.
3. El `README.md` de tu lote: estructura, comportamiento, textos exactos y criterios de aceptación.
4. `referencia/*.html` de tu lote: ábrelos en el navegador e inspecciona medidas y colores. Los `.png` sirven solo para ver la composición, porque usan otra fuente.

## Ya aplicado en `web/` (no hay que copiarlo de nuevo)

- `web/src/styles/tokens.css` y `web/src/styles/componentes.css` son copia de `lote-0-sistema/`. Si cambia el diseño, se vuelven a copiar desde aquí. No se editan a mano.
- Fuente: `@fontsource-variable/atkinson-hyperlegible-next`, importada en `web/src/main.jsx`. Íconos: `@phosphor-icons/react`, peso `bold`.
- Favicon en `web/public/favicon.svg`.
- Temas y tamaño de texto van en `<html>`: `data-tema="claro|oscuro|contraste"` y `data-texto="normal|grande|muy-grande"`. Las preferencias se guardan en `localStorage` como `parejo:tema`, `parejo:texto`, `parejo:voz` y `parejo:perfil`.

## Reglas en `web/`

- Cada vista vive en su archivo, `web/src/views/<Vista>.jsx`, y su CSS propio en `web/src/views/<Vista>.css`. Ese archivo es de quien implementa la vista.
- Los archivos compartidos son de quien implementa el Lote 0 (@Gxppe): `web/src/components/`, `web/src/hooks/` y el router en `web/src/main.jsx`. Para cambiarlos, pide el traspaso en el tablero.
- Colores, tamaños y radios salen siempre de las variables de `tokens.css`, nunca escritos a mano.
- Si el diseño no responde una duda, decide con lo que ya está en `lote-0-sistema/` y avisa en el tablero qué decidiste. No esperes a José para cosas pequeñas.
- Antes de abrir el PR, revisa la vista con teclado, con zoom al 200 %, a 390 px y 1440 px, y en los tres temas.
- Si necesitas una dependencia nueva, pídela en el tablero, porque `package.json` es de José.

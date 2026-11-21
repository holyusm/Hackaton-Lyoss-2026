# Parejo: entrega de diseño para implementar

Paquete de diseño de **Parejo** (Campus sin barreras, Hackathon USM 2026), listo para el repositorio de código.

```
docs/diseno/vistas/
├── lote-0-sistema/        Marca, tokens, componentes e íconos. Lo usan TODAS las vistas.
│   ├── README.md          Idea, marca, color, tipografía, accesibilidad, tono, prohibiciones
│   ├── tokens.css         Variables CSS (claro, oscuro, alto contraste, A/A+/A++)
│   ├── tokens.json        Los mismos tokens en JSON
│   ├── componentes.css    Clases de cada componente
│   ├── componentes.md     Anatomía, estados y ARIA de cada componente
│   ├── iconos.md          Qué ícono de Phosphor va en cada lugar
│   ├── marca/             Símbolo, logo y favicon en SVG
│   └── referencia/        Sistema en los 3 temas, marca y shell móvil (HTML y PNG)
└── lote-1-inicio/         Vista "/" (perfil y destino)
    ├── README.md          Especificación: estructura, comportamiento, textos, criterios
    ├── datos-ejemplo.json Perfiles, lugares, frecuentes y barreras de ejemplo
    └── referencia/        6 pantallas: móvil en 3 temas, 2 estados y escritorio (HTML y PNG)
```

## Cómo usarlo en el repositorio

1. Ya está en el repo: `docs/diseno/vistas/` (diseño general en `lote-0-sistema/`).
2. Copien `lote-0-sistema/tokens.css` y `lote-0-sistema/componentes.css` a `web/src/styles/`.
3. Copien `lote-0-sistema/marca/favicon.svg` a `web/public/` y enlácenlo desde `index.html`.
4. Pidan la implementación vista por vista: el sistema y el shell primero, después cada lote.

## Instrucción sugerida para Claude Code

> Lee `docs/diseno/vistas/ENTREGA.md`, `docs/diseno/vistas/lote-0-sistema/README.md`, `componentes.md` e `iconos.md`. Implementa primero el shell (cabecera, navegación móvil y de escritorio, panel de accesibilidad, enlace para saltar al contenido, pie) y los componentes base en `web/src/components/`, usando `tokens.css` y `componentes.css` sin cambiar sus valores. Después implementa la vista Inicio según `lote-1-inicio/README.md`, con `datos-ejemplo.json` como respaldo de datos. Compara tu resultado con los HTML de `referencia/` en móvil (390 px) y escritorio (1440 px), en claro, oscuro y alto contraste, y cumple todos los criterios de aceptación del lote antes de terminar.

## Pila de destino

React 18 + Vite + react-router + react-leaflet (teselas CARTO Positron con atribución visible). CSS plano con variables, sin Tailwind ni librerías de animación. Íconos `@phosphor-icons/react` en peso bold. Tipografía Atkinson Hyperlegible Next.

Prototipo estudiantil. No es un servicio oficial de la USM.

# Lote 5: Punto QR con voz (`/punto/:id`)

Se abre al escanear un QR pegado en el campus. La usuaria principal es Valentina (baja visión, lector de pantalla). **Es la vista más accesible de toda la app.**

**Requiere** [lote-0-sistema](../lote-0-sistema/) (tokens, componentes, íconos). **Implementa:** @Gxppe. **Plan:** [PLAN.md](PLAN.md). Esta carpeta trae solo lo propio de la vista. Los textos exactos y los datos están en `datos-ejemplo.json`.

## Referencias

| Archivo en `referencia/` | Qué muestra |
|---|---|
| `01-movil-alto-contraste-texto-grande` | **La principal:** así se abre por defecto (alto contraste, texto A+, sin mapa) |
| `02-movil-reproduciendo` | Leyendo en voz alta: barra de estado, Pausar, Repetir y el bloque que se lee resaltado |
| `03-movil-modo-claro` | Tema claro con texto normal (A), para quien cambia la preferencia |
| `04-movil-con-barrera` | Hay una barrera en el punto: aviso arriba de todo, y la voz lo lee primero |

Los `.html` cargan la tipografía real: ábranlos en el navegador e inspeccionen. Los `.png` usan una fuente de reemplazo.

## Valores por defecto

Al abrir `/punto/:id` sin preferencias guardadas: `data-tema="contraste"` y `data-texto="grande"` (A+) en `<html>`. Sin mapa. Si la persona ya eligió otra cosa en la app (`localStorage`), se respeta su preferencia. La referencia 03 muestra ese caso.

## Estructura (de arriba hacia abajo, en el mismo orden que la voz)

1. **Cabecera** de 64 px: Wordmark (en contraste, el símbolo en blanco y negro) y el botón "Accesibilidad". **Sin navegación inferior**: es una página de llegada y no hace falta distraer.
2. **Aviso de barrera** (solo si el punto tiene una): amarillo, con domos en claro y sin textura pero con borde negro de 2 px en contraste. Lleva `role="alert"`, el ícono `Warning` en un círculo, el título "Atención: piso mojado en el portón." y la indicación concreta "Avanza por el lado derecho, junto a la pared. El aviso vence a las 12:35.".
3. **Dónde estás:** `<h1>` "Estás en: Entrada principal" (40 px con A+, es decir 32 px × 1,25; 800; interletraje -3 %) y la descripción "Portón de Avenida España. Frente a ti está el Patio central.".
4. **Voz:**
   - En reposo: botón primario **gigante** de ancho completo y 72 px de alto mínimo, "Escuchar indicaciones" con el ícono `SpeakerHigh`.
   - Leyendo: el botón se reemplaza por una **barra de estado** (`role="status"`, `aria-live="polite"`, fondo Pacífico o negro, 56 px) que dice qué se lee: "Leyendo Ascensor A". Debajo, dos botones secundarios de 64 px: "Pausar" (pasa a "Seguir", `aria-pressed`) y "Repetir".
   - Siempre visible: "Velocidad de la voz" con Lenta, Normal y Rápida, un `fieldset role="radiogroup"` en píldora con segmentos de 52 px.
5. **"Desde aquí puedes ir a:"** (`<h2>`): una tarjeta por destino (radio de 20 px, borde de 2 px) con el ícono, el nombre (`<h3>`), **la indicación hablable completa** y el botón secundario "Llévame" de 56 px.
   - "Llévame" es un enlace a `/mapa?desde=<punto>&hasta=<destino>` con `aria-label="Llévame a Ascensor A"`, y conserva el perfil guardado.
6. **Pie:** "Este punto QR es parte de un prototipo estudiantil." y el enlace "Cambiar perfil" (48 px), que abre la elección de perfil.

## Voz (`speechSynthesis`)

- **Nunca arranca sola:** el navegador exige un toque. Se habla solo después de "Escuchar indicaciones".
- `lang = "es-CL"` y `rate` según la velocidad (0,8; 1; 1,25). La velocidad se guarda en `localStorage`.
- Se lee **un bloque por frase**, en el orden visual: aviso (si hay), dónde estás y cada destino como "{nombre}: {indicación}". Las frases exactas están en `datos-ejemplo.json`.
- **El bloque que se lee se resalta:** contorno de 4 px Cobalto (fuera del borde) y fondo `--cobalto-tinte`. El nombre del bloque se muestra en la barra de estado. Se usa `onstart` de cada frase.
- **Pausar** llama a `speechSynthesis.pause()` y el botón pasa a "Seguir" (`resume()`). **Repetir** cancela y empieza de nuevo.
- **Cambiar la velocidad mientras lee** retoma desde el bloque actual con la nueva velocidad.
- Al terminar (`onend` de la última frase) vuelve el botón "Escuchar indicaciones".
- Al salir de la página: `speechSynthesis.cancel()`.
- **Sin voz en español** (no hay voces `es-*`): el botón se deshabilita con el motivo "Tu navegador no tiene voz en español. Puedes leer las indicaciones aquí abajo."
- **Lector de pantalla activo:** la voz propia sigue disponible, pero no se lanza sola. Con lector, la página ya se lee en el mismo orden visual.

## Reglas de contenido
- **Todo el texto es real y sin abreviaturas** ("Avenida España", no "Av. España"), porque se lee en voz alta. Las horas se escriben "12:35" y se dicen "12 y 35".
- **El orden de lectura es idéntico al visual.** Sin posiciones absolutas que cambien el orden, sin `tabindex` positivos.
- **Sin conexión:** el texto ya cargado sigue visible y se puede volver a escuchar (la voz funciona sin red). Bajo la cabecera aparece la banda "Sin conexión. Puedes seguir escuchando lo que ya cargó." (`BandaEnVivo` en su variante sin conexión). Cachear la última respuesta de `/api/puntos/:id`.

## Ajustes técnicos para el código
- **Saltar al contenido:** en las referencias está fuera de la pantalla y no aparece con foco, porque el lienzo no permite `:focus`. En código usen la clase `.saltar` de `tokens.css`, que sí lo muestra.
- **Grupo de velocidad:** apliquen roving tabindex con flechas, como en los demás `radiogroup`.

## Cambios frente al prompt original
- **Barra de reproducción:** "Reproduciendo… · Pausar · Repetir" se separó en una barra de estado que dice qué bloque se lee, más dos botones. Esto respeta la regla de no usar "·".
- **Resaltado del bloque leído:** es un agregado. Sirve a quien sigue con la vista y el oído a la vez.

## Archivos sugeridos

```
web/src/views/Punto.jsx
web/src/components/BarraVoz.jsx        (botón, estado, pausar, repetir, velocidad)
web/src/components/TarjetaDestino.jsx
web/src/hooks/useVoz.js                (cola de frases, onstart y onend, pause, resume, cancel, rate)
web/src/hooks/usePunto.js              (GET /api/puntos/:id con caché para sin conexión)
```

## Criterios de aceptación

- [ ] Al abrir un QR sin preferencias guardadas, la página está en alto contraste y A+, como la referencia 01.
- [ ] "Escuchar indicaciones" lee en español de Chile, en el orden visual, y con barrera empieza por el aviso.
- [ ] El bloque que se lee se resalta, y la barra dice cuál es.
- [ ] Pausar, Seguir, Repetir y la velocidad funcionan, y la velocidad cambia sin perder el lugar.
- [ ] Con lector de pantalla, el orden de lectura es el mismo que el visual y cada "Llévame" anuncia su destino.
- [ ] Con A++ y zoom al 200 % no hay nada cortado ni scroll horizontal.
- [ ] Sin conexión, el texto sigue visible y se puede volver a escuchar.
- [ ] Todo lo que se toca mide 48 px o más. Ningún texto tiene abreviaturas, guion largo, semiguion ni "·".

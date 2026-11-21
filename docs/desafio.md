# El desafío: "Campus sin barreras" (movilidad y orientación para todos)

Resumen del enunciado oficial, revelado a las 09:20 del 21-11-2026. Original: [`docs/oficial/Enunciado_Hackathon_2026.pdf`](oficial/Enunciado_Hackathon_2026.pdf). Bases completas: [`docs/oficial/Bases_Hackaton_Oficiales.pdf`](oficial/Bases_Hackaton_Oficiales.pdf). Si este resumen choca con los PDF, mandan los PDF.

## La pregunta

> **¿Cómo podemos utilizar la tecnología para reducir las dificultades de orientación y desplazamiento que enfrentan estudiantes con distintas necesidades dentro de un campus universitario?**

## Problemática (en palabras del enunciado)

Los estudiantes pueden enfrentar **barreras de orientación y desplazamiento** dentro del campus, por la interacción entre **las características del entorno, la información disponible y sus diversas necesidades**. No hay una única causa ni afecta a todos igual. Las dificultades pueden venir de:

- la distribución y características de los espacios (edificios, salas, laboratorios, bibliotecas);
- las condiciones de los recorridos;
- la accesibilidad de la infraestructura;
- la disponibilidad y claridad de la información para orientarse y moverse.

Consecuencias que nombra: menos autonomía, acceso difícil a ciertos espacios, obstáculos extra para desenvolverse.

## Qué decidimos nosotros (libertad total)

El enunciado deja al equipo elegir:

1. **Qué dificultad concreta** abordar (una, bien elegida; no "todo el campus").
2. **A qué estudiantes** va dirigida (p. ej. movilidad reducida, discapacidad visual, neurodivergencia, estudiantes nuevos, lesión temporal, etc.).
3. **Qué aspecto** del problema mejorar.
4. **Qué tecnologías, métodos y estrategias** usar.
5. **Cómo demostrar** que funciona y que sirve.

No existe solución predeterminada.

## Qué hay que entregar (resultado esperado)

- Un **prototipo funcional** que muestre las características principales.
- Debe dejar claro: **la dificultad abordada**, **los estudiantes beneficiados** y **cómo el prototipo ayuda a resolverla**.
- No tiene que ser un producto terminado.

## Datos y recursos

- Referencia: la realidad de la **USM** (Casa Central, Valparaíso).
- Se pueden usar recursos disponibles, información pública o **datos simulados**, siempre que se **declaren los supuestos y limitaciones** (ponerlos en el README).

## ODS relacionados (inferencia nuestra: el enunciado no nombra un número)

- **ODS 10** Reducción de las desigualdades (inclusión de personas con discapacidad).
- **ODS 11** Ciudades y comunidades sostenibles (espacios accesibles e inclusivos, meta 11.7).
- **ODS 4** Educación de calidad (instalaciones educativas inclusivas, meta 4.a).

Las bases exigen que la relación con el ODS se vea **en la funcionalidad**, no solo en el discurso.

## Cómo nos evalúan (recordatorio)

Impacto 30% · Innovación 25% · Ejecución 20% · Presentación (pitch + README) 15% · UX/UI 10% (incluye **accesibilidad**, que en este desafío pesa doble: la app misma tiene que ser accesible). Detalle y horario en [`docs/hackaton.md`](hackaton.md).

## Puntos de las bases que conviene no olvidar

- **Admisibilidad** (si falla una, no nos evalúan): repo público, código fuente, `LICENSE` OSI, `README.md` completo, entrega a tiempo, originalidad, recursos externos declarados, prototipo evaluable.
- Si los jueces no logran levantar el proyecto, hay **una sola oportunidad** de aclarar instrucciones; no se puede tocar código. README de instalación probado en limpio.
- No meter en herramientas de IA datos personales, credenciales ni claves.
- Pitch: máx. 3:00; 3:01–3:30 = −2 puntos; a los 3:30 se corta.
- Commits frecuentes: la organización puede revisar el historial de git.

## Estado actual del equipo

> El orquestador (sesión de @holyusm) actualiza esta sección cuando se decide algo grande.

- **Nombre:** **parejo** (piso sin desniveles, "igual para todos"). Diseño en `docs/diseno/vistas/`.
- **Idea (tal como quedó):** mapa de rutas accesibles por perfil (silla de ruedas, movilidad reducida, baja visión, estándar) + barreras reportadas en vivo que recalculan la ruta + plano interactivo `/plano` con interiores (Edificio C desde OpenStreetMap, Edificio P dibujado por el equipo) y rutas a salas + comparador de perfiles + puntos QR con voz + `/campus` (simulador de obras e informe A4 para la universidad).
- **Dificultad elegida:** orientación y desplazamiento en Casa Central USM: el camino accesible es desconocido o cambia (ascensor fuera de servicio, obstáculos).
- **Usuarios objetivo:** estudiantes con movilidad reducida (silla de ruedas, lesión temporal), baja visión/ceguera, y estudiantes nuevos.
- **Stack:** Vite + React + Leaflet / Node + Express / motor de rutas JS. Detalle en `docs/contratos.md`.
- **Demo pública:** https://hackaton-lyoss-2026.onrender.com (Render Free: se duerme tras ~15 min sin tráfico, abrirla unos minutos antes del pitch; los reportes se reinician en cada deploy).

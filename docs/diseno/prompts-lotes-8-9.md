# Prompts para Claude Design: lotes 8 y 9 (parejo)

Dos vistas nuevas que se pegan en el **mismo proyecto de Claude Design** donde ya están el sistema parejo (Lote 0) y los lotes 1 a 7. Orden: primero el bloque "Contexto nuevo", después el Lote 8 y por último el Lote 9. Cada bloque se itera hasta que guste y se exporta a `docs/diseno/vistas/lote-8-campus/` y `docs/diseno/vistas/lote-9-horario/`.

| Lote | Vista / ruta | Para quién | Qué demuestra en el pitch | Prioridad |
|---|---|---|---|---|
| 8 | `/campus` Mejorar el campus (simulador de obras) | La universidad (Programa de Inclusión, infraestructura) y el jurado | Que la app no solo esquiva barreras: le dice a la USM cuál arreglar primero y cuánto mejora | Alta |
| 9 | `/horario` ¿Llegas a tu próxima clase? | Estudiantes (accesorio dentro de la app) | El problema traducido a algo que todos entienden: llegar tarde a clase por una escalera | Media |

Los nombres de campos que aparecen al final de cada lote son los que va a entregar el servidor. Diseña con esos datos para que la implementación calce sin inventar nada. Las palabras (trayecto, trayecto con barrera, obra, traslado, ajuste razonable) son las de [GLOSSARY.md](../../GLOSSARY.md).

Alcance acordado el 21-11 (14:50): del Lote 8 se implementa hoy lo esencial (cifras de hoy, ranking de obras, interruptor "Simular" y la franja Hoy / Con obras). El informe imprimible se diseña pero no se implementa hoy. Del Lote 9 se implementa solo "Un cambio de sala", y solo si sobra tiempo.

---

## CONTEXTO NUEVO (pegar primero, una sola vez)

```
Vamos a sumar dos vistas a parejo. Usa el mismo sistema de diseño que ya fijamos en el Lote 0: colores de cerro (Niebla, Pacífico, Cobalto como único acento de interfaz, Podotáctil solo para barreras y recálculo con su textura de domos, Alto para bloqueado o sin ruta, Paso para accesible o resuelto, Calamina solo en la marca), una sola familia tipográfica (Atkinson Hyperlegible Next, 400 a 800), botones con escalón, lo elegido se invierte a Pacífico con check, áreas táctiles de 48 px y foco doble Pacífico más Podotáctil. Mismo tono de señalética, mismas prohibiciones. No cambies ningún componente existente: si necesitas uno nuevo, constrúyelo con las piezas del Lote 0 y muéstralo aparte.

POR QUÉ ESTAS VISTAS
Hasta ahora parejo ayuda a una persona a encontrar el camino que sí puede recorrer. Ahora queremos dos cosas más:

1. Ayudar a la universidad a mejorar el campus. Parejo ya sabe, tramo por tramo, dónde hay escalones, pendientes, adoquín y ascensores. Con eso puede simular obras ("¿y si ponemos una rampa aquí?") y medir cuántos trayectos dejan de tener barrera para cada perfil. Las obras son cambios permanentes: se miden contra el campus tal como está construido, sin contar los reportes del momento. La pregunta que responde es: "¿Qué arreglar primero para que el campus funcione para todos?". Es una vista de decisión, para el Programa de Inclusión o el área de infraestructura de la USM, y la verá el jurado en el proyector.

2. Un accesorio para estudiantes: "¿Llegas a tu próxima clase?". Con el horario del día (o con dos salas), parejo calcula si el tiempo entre clases alcanza según cómo te mueves. Si no alcanza, lo dice claro, explica por qué y arma un texto para pedir un ajuste razonable. No es una agenda ni un gestor de horario: es una revisión rápida.

Las dos vistas comparten la idea central de parejo: el mismo campus no es el mismo para todos, y eso se puede medir.

DÓNDE VIVEN EN LA APP
- /campus "Mejorar el campus" entra a la navegación principal en escritorio. En móvil la barra inferior sigue con 4 ítems: el cuarto pasa de "Acerca" a "Más", que abre un panel con "Mejorar el campus", "¿Llegas a tu próxima clase?" y "Acerca". Muestra ese ajuste del shell en el Lote 8.
- /horario no va en la navegación principal. Se llega desde un enlace en Inicio ("¿Llegas a tu próxima clase? Revísalo aquí"), desde el panel "Más" y desde el panel de la ruta en /mapa ("¿Me alcanza el recreo?").

PALABRAS (úsalas siempre igual)
- Trayecto: ir de un lugar a otro (entradas, edificios, salas, baños). La ida y la vuelta cuentan aparte.
- Trayecto con barrera: en Silla de ruedas, no tiene ruta; en Movilidad reducida, su ruta obliga a subir escalones; en Baja visión, su ruta pasa por adoquín o piso irregular, o sin guía podotáctil. En Estándar no existe.
- Obra: cambio permanente al campus (rampa, ascensor nuevo, nivelar superficie, guía podotáctil, techado). Nunca "intervención" ni "mejora".
- Traslado: el cambio de sala entre dos clases seguidas.

DATOS
Todo lo que se muestre como cifra viene del motor de rutas sobre el grafo del campus. Mientras el grafo no esté completo, las cifras son de ejemplo y se marcan "Datos de ejemplo" en la misma vista. Los costos de las obras son relativos (bajo, medio, alto), estimados por el equipo, nunca montos en pesos.

Confírmame en 4 líneas cómo vas a resolver estas dos vistas sin salirte del sistema y espera el Lote 8.
```

---

## LOTE 8: `/campus` Mejorar el campus (simulador de obras)

```
Lote 8: "/campus", vista "Mejorar el campus". Usa solo el sistema del Lote 0 más los componentes nuevos que se piden aquí.

Objetivo: en 10 segundos, alguien de la universidad (o un juez) entiende cuántos trayectos del campus tienen barrera para un perfil, cuál es la obra que más barreras quita y cómo cambia el campus si la hace. Es una herramienta de decisión, no un dashboard: pocas cifras, grandes, con una frase que las explica.

Formato principal: escritorio 1440×900 y proyector (se lee a 5 m). Móvil es secundario pero tiene que funcionar.

ESTRUCTURA (escritorio, de arriba hacia abajo)

1. Encabezado
   - Título: "¿Qué arreglar primero?"
   - Bajada en Cuerpo: "Simulamos obras sobre el mapa accesible de Casa Central y medimos cuántos trayectos dejan de tener barrera para cada perfil."
   - Selector de perfil compacto (los 4 chips de perfil en una fila, radiogroup con flechas). Por defecto "Silla de ruedas". Al lado, un quinto chip "Todos los perfiles": cuenta los trayectos que tienen barrera para al menos un perfil.
   - Debajo del selector, en Detalle, qué significa "barrera" para el perfil elegido: "En silla de ruedas, un trayecto tiene barrera cuando no hay ruta sin escalones." Cambia con el perfil.
   - Marca "Datos de ejemplo" visible junto al título mientras corresponda.

2. Estado de hoy (franja de cifras, sin tarjetas, separadas por líneas finas verticales como las métricas de ruta)
   - "14 de 56 trayectos con barrera" (cifra grande en Alto con ícono Prohibit; la palabra lo dice, no solo el color).
   - "+3,1 min de desvío promedio" en los trayectos que sí tienen ruta.
   - "6 traslados entre salas no alcanzan en 10 min de recreo" (este dato conecta con el Lote 9).
   - Debajo, una frase-resumen en Subtítulo generada desde los datos: "Hoy, 1 de cada 4 trayectos de Casa Central no se puede hacer en silla de ruedas." Es la frase del pitch. Para otros perfiles cambia el verbo: "En movilidad reducida, 1 de cada 3 trayectos obliga a subir escalones."

3. Cuerpo en dos columnas asimétricas
   Izquierda (7/12): mapa de zonas.
   - El mapa del campus (mismas teselas que /mapa) con cada lugar marcado según qué tan accesible es llegar a él desde el resto, para el perfil elegido. Tres niveles, cada uno con forma, ícono y texto propios (nunca solo color):
     a) Accesible: círculo con check, color Paso.
     b) Con desvío: rombo con la cifra "+4 min" dentro de una etiqueta, color Cobalto.
     c) Con barrera: cuadrado con Prohibit, color Alto (en Silla de ruedas la etiqueta dice "Sin ruta"; en los otros perfiles, "Con escalones" o "Sin guía").
   - Las obras que se pueden simular aparecen sobre el mapa como un pictograma en un cuadrado Pacífico con borde blanco (rampa, ascensor, superficie, guía podotáctil). Al seleccionar una en la lista, se resalta en el mapa y viceversa.
   - Leyenda fija abajo a la izquierda con las tres formas y su texto.
   - Interruptor "Ver como lista", igual que en /mapa: muestra los lugares en una tabla (Lugar, Desde cuántos lugares se llega, Desvío promedio, Estado) para lector de pantalla y baja visión. Es parte del diseño, no un extra.

   Derecha (5/12): ranking de obras.
   - Título: "Obras que más ayudan". Bajada en Detalle: "Ordenadas por trayectos que dejan de tener barrera."
   - Lista ordenada (ol) de obras. Cada fila, sin tarjeta, separada por línea fina:
     · posición (1, 2, 3) en cifra mediana,
     · título de la obra en Cuerpo 700: "Rampa en la escalera del patio central hacia la Biblioteca",
     · pictograma del tipo y el lugar en Detalle,
     · el impacto como texto, sin barras: "9 trayectos sin barrera", "1,2 min menos en promedio",
     · perfiles beneficiados como íconos de perfil con su nombre (no solo íconos),
     · costo relativo en texto con ícono: "Costo bajo", "Costo medio", "Costo alto",
     · un interruptor "Simular" (switch accesible con etiqueta "Simular rampa en la escalera del patio central").
   - Arriba de la lista, un selector "Ordenar por: Trayectos sin barrera / Minutos ahorrados / Costo".

4. Simulación (el momento clave de la vista)
   Cuando se activa una o más obras:
   - Aparece arriba del cuerpo una franja "Con las obras simuladas" que compara Hoy y Con obras lado a lado, en cifras grandes: "Hoy: 14 con barrera. Con 2 obras: 3 con barrera." y, por perfil: "Silla de ruedas: 11 trayectos más con ruta. Movilidad reducida: 7 trayectos más sin escalones." No uses flechas ni barras: dos columnas con encabezado "Hoy" y "Con obras".
   - En el mapa, los lugares que cambian de nivel se redibujan con su nueva forma y una marca "Nuevo" en Paso durante unos segundos. Los trayectos que se destraban se dibujan como línea Paso discontinua para distinguirlos de las rutas normales.
   - El cambio se anuncia por aria-live: "Con la rampa del patio central, 9 trayectos más tienen ruta en silla de ruedas."
   - Botones: "Quitar todas" (terciario) y "Armar informe" (primario).
   Diseña los tres momentos: sin obras, una obra activa, tres obras activas.

5. Supuestos (siempre visibles, como texto, no escondidos)
   - "Trayecto: ir de una entrada, edificio, sala o baño a otro. La ida y la vuelta cuentan aparte."
   - "Medimos el campus tal como está construido. Los reportes del momento (un ascensor detenido) no cuentan aquí: se ven en Reportar."
   - "El costo de cada obra es una estimación relativa del equipo, no un presupuesto."
   - "Recreo de 10 minutos entre clases: supuesto, la USM puede tener otro."
   - "Datos del levantamiento del equipo del 21-11-2026 y datos de ejemplo donde faltó medir."

6. Informe para la universidad (vista de impresión; se diseña ahora, se implementa después)
   "Armar informe" abre una vista lista para imprimir o guardar como PDF (window.print), en blanco y negro legible, una página A4 vertical:
   - Título "Propuesta de obras para un campus parejo", fecha y perfil evaluado.
   - Las cifras Hoy y Con obras.
   - La tabla de obras elegidas con impacto, perfiles beneficiados y costo relativo.
   - El mapa en miniatura con las formas de la leyenda (debe entenderse impreso en gris).
   - Los supuestos y el pie "Prototipo estudiantil. No es un servicio oficial de la USM."
   Diseña también esta página.

MÓVIL (390×844)
- Encabezado y selector de perfil (los chips en scroll horizontal con snap).
- La franja de cifras pasa a una columna.
- Pestañas "Obras" y "Mapa" (tablist accesible) en lugar de dos columnas. "Obras" va primero.
- La franja "Con las obras simuladas" queda fija arriba mientras haya obras activas, compacta: "Con 2 obras: 3 con barrera (hoy 14)".

PROYECTOR
Con el modo proyector del Lote 7: tipografía +20 %, solo las cifras de estado, el mapa y las 3 primeras obras. Es lo que se muestra en el pitch al activar una obra en vivo.

ESTADOS
- Carga: esqueletos con la forma de las cifras y de las filas de obras.
- Perfil Estándar elegido: "Para el perfil Estándar ningún trayecto tiene barrera. Elige otro perfil para ver dónde está." (con los chips a la mano).
- Ninguna obra mejora nada para el perfil elegido: "Ninguna de las obras de la lista quita barreras para Baja visión."
- Todas las obras activas y siguen trayectos con barrera: la franja lo dice, en Alto con ícono: "Aún quedan 2 trayectos con barrera: necesitan obras que no están en la lista."
- Error de servidor: mensaje en línea con "Reintentar".

COMPONENTES NUEVOS (muéstralos aparte, con sus estados)
- Fila de obra (normal, hover, foco, simulada).
- Switch "Simular" (apagado, encendido, foco, deshabilitado con motivo).
- Marcadores de zona: Accesible, Con desvío, Con barrera, Nuevo, Obra.
- Franja comparativa Hoy / Con obras.

DATOS QUE ENTREGA EL SERVIDOR (diseña con estos campos; el contrato exacto queda en docs/contratos.md)
Por perfil: trayectos_evaluados (56), trayectos_con_barrera (14), minutos_extra_prom (3.1), traslados_no_alcanzan (6).
obras: [{ id, tipo: rampa|ascensor|superficie|guia_tactil|techado, titulo, lugar, trayectos_sin_barrera (cuántos deja sin barrera), minutos_ahorrados_prom, perfiles_beneficiados: [ids], costo_relativo: bajo|medio|alto }]
zonas: [{ nodo_id, nombre, estado: accesible|desvio|con_barrera, minutos_extra }]
Al simular obras: las mismas cifras en "hoy" y "con_obras", más trayectos_sin_barrera_por_perfil: { silla_ruedas: 11, movilidad_reducida: 7, ... }.

DATOS DE EJEMPLO (márcalos como tales)
Obras:
1. Ascensor nuevo en la Biblioteca (ascensor): 9 trayectos sin barrera, Silla de ruedas y Movilidad reducida, costo alto.
2. Rampa en la escalera del patio central hacia la Biblioteca (rampa): 6 trayectos sin barrera, Silla de ruedas y Movilidad reducida, costo medio.
3. Nivelar el adoquín del patio central (superficie): 4 trayectos sin barrera para Baja visión, 1,2 min menos en promedio en Silla de ruedas, costo alto.
4. Guía podotáctil desde la Entrada principal al Patio central (guia_tactil): 5 trayectos sin barrera para Baja visión, costo bajo.
5. Techar el paso hacia el Casino (techado): no quita barreras, útil con lluvia para todos, costo medio.
(Las obras reales las define el equipo a partir del levantamiento en terreno.)
Lugares: Entrada principal, Patio central, Ascensor A, Edificio A piso 2, Sala A-201, Biblioteca, Baño accesible B, Casino.

Entrega: escritorio sin obras, escritorio con una obra, escritorio con tres obras, escritorio "Ver como lista", móvil pestaña Obras con simulación activa, móvil pestaña Mapa, proyector, página del informe impreso, ajuste del shell con "Más" en móvil, y la hoja de componentes nuevos. Modo oscuro y alto contraste de la vista principal de escritorio.
```

---

## LOTE 9: `/horario` ¿Llegas a tu próxima clase?

```
Lote 9: "/horario", vista "¿Llegas a tu próxima clase?". Es un accesorio de parejo: rápido, de una sola pantalla, pensado para el celular entre clases.

Usuario principal: Tomás (muletas por 6 semanas) y Camila (silla de ruedas). Tienen 10 minutos entre una clase en el Edificio A piso 2 y otra en la Biblioteca. Para el perfil Estándar sobra tiempo; para ellos, con el ascensor detenido, no.

Objetivo: en 20 segundos saber si alcanzan, cuánto les falta y qué hacer.

ESTRUCTURA EN MÓVIL (390×844)

1. Encabezado
   - Título: "¿Llegas a tu próxima clase?"
   - Bajada: "Revisa si el tiempo entre clases te alcanza según cómo te mueves."
   - Chip del perfil actual (el que se eligió en Inicio) con la acción "Cambiar".

2. Dos maneras de revisar (tablist accesible, dos pestañas):
   a) "Un cambio de sala" (por defecto)
      - "Salgo de": selector de lugar (salas y edificios).
      - "Voy a": selector de lugar.
      - "Tengo": control segmentado 5 min / 10 min / 15 min / 20 min, más "Otro" que abre un campo numérico.
      - Botón primario "Revisar".
   b) "Mi horario de hoy"
      - Lista de clases del día, cada una en una fila editable: nombre de la clase (opcional, ej. "Cálculo"), sala y bloque. El bloque se elige de una lista (Bloque 1-2, 08:15 a 09:25; Bloque 3-4, 09:35 a 10:45; Bloque 5-6, 10:55 a 12:05; y así), no se escribe la hora. La lista es un select nativo grande con la hora escrita en cada opción.
      - "Agregar clase" (secundario) hasta 6 clases. Cada fila se puede quitar.
      - Botón primario "Revisar mi día".
      - Nota en Detalle: "Tu horario se queda en este teléfono. No lo enviamos a nadie." (se guarda en localStorage).

3. Resultado (aparece debajo, se anuncia por aria-live, y el foco salta a su título)
   - Una frase-resumen en Subtítulo: "Llegas a 2 de tus 3 cambios de sala." o, en modo rápido, "No alcanzas: te faltan 4 minutos."
   - Una fila por traslado, ordenadas por hora, cada una con tres estados que se distinguen por ícono, texto y forma:
     · Alcanza (ícono CheckCircle, Paso): "Sala A-201 a Casino. Tienes 15 min, necesitas 3 min. Te sobran 12 min."
     · Justo (aviso Podotáctil con textura, ícono Warning): "Tienes 10 min, necesitas 9 min. Sal apenas termine la clase."
     · No alcanza (ícono Prohibit, Alto): "Edificio A piso 2 a Biblioteca. Tienes 10 min, necesitas 14 min. Te faltan 4 min."
   - Cada fila muestra el motivo en Detalle cuando lo hay: "El Ascensor A está fuera de servicio. El desvío por la rampa del edificio B suma 6 min."
   - Cada fila muestra la comparación con el perfil Estándar en Detalle: "Con el perfil Estándar: 4 min." Es lo que hace visible la diferencia.
   - Acción por fila: "Ver ruta" (abre /mapa con origen y destino puestos).
   - "Justo" es cuando sobran 2 min o menos. Decláralo en la vista como supuesto.
   - Supuesto visible bajo el resultado: "Los minutos consideran que con muletas o en silla de ruedas se avanza más lento que a paso normal. Es una estimación del equipo." (el factor exacto lo define el equipo).

4. Pide un ajuste razonable (solo si algún traslado no alcanza)
   - Título: "Pide un ajuste razonable"
   - Bajada: "Puedes pedir llegar unos minutos después, salir antes o que la clase cambie de sala. Te dejamos el texto listo."
   - Selector de destinatario: "Docente" o "Programa de Inclusión USM". Cambia el saludo del texto.
   - Vista previa del texto en un textarea editable (Cuerpo, buen interlineado), ya redactado con los datos: clases, salas, minutos disponibles y necesarios, motivo. Ejemplo:
     "Hola. Me muevo con muletas por una lesión temporal. Entre Cálculo (Edificio A, piso 2, termina 10:15) y Física (Biblioteca, empieza 10:25) tengo 10 minutos, y el trayecto sin escaleras me toma 14. Les pido poder llegar hasta 5 minutos después a Física mientras dure la lesión. Gracias."
   - Campo opcional "Tu nombre" (no obligatorio, no se guarda en el servidor).
   - Acciones: "Copiar texto" (primario; confirma en línea "Texto copiado", no un toast que desaparece) y "Abrir en mi correo" (secundario, mailto sin destinatario fijo).
   - Nota: "parejo no envía nada. Tú decides si lo mandas y a quién."

5. En vivo
   - Si llega un reporte que cambia un traslado (por ejemplo, se detiene el Ascensor A), aparece arriba del resultado el aviso Podotáctil del sistema: "El Ascensor A se detuvo. Tu cambio de sala de las 10:15 ya no alcanza." con "Ver detalle". Igual que el recálculo de /mapa.

ESCRITORIO (1440×900)
Dos columnas: a la izquierda (5/12) el formulario; a la derecha (7/12) el resultado y el ajuste razonable. Sin mapa: esta vista es de texto.

ENTRADAS DESDE OTRAS VISTAS (muéstralas)
- En Inicio, debajo del botón "Ver mi ruta": enlace con ícono Clock "¿Llegas a tu próxima clase? Revísalo aquí".
- En el panel de ruta de /mapa: enlace "¿Me alcanza el recreo?" que abre /horario con el origen y destino de la ruta ya puestos.

ESTADOS
- Sin clases todavía (pestaña horario): "Agrega al menos dos clases para revisar tus cambios de sala."
- Una sola clase: "Con una sola clase no hay cambios de sala que revisar."
- Dos clases en el mismo bloque: "Física y Cálculo están en el mismo bloque. Revisa tu horario."
- Clases no seguidas (hay un bloque libre entre medio): el traslado se muestra igual, con el tiempo real disponible.
- Mismo lugar de salida y llegada: "Elige una sala distinta para revisar el traslado."
- Sin ruta accesible ahora: la fila dice "No hay ruta sin escalones a Biblioteca en este momento" con el motivo, y el ajuste razonable sugiere el cambio de sala.
- Sin conexión: se muestra el último resultado con su hora: "Revisado a las 10:02. Sin conexión: puede haber cambiado."

ACCESIBILIDAD ESPECÍFICA
- El bloque se elige con un select nativo con etiqueta visible; nada de selectores de rueda propios.
- El resultado es una lista (ol) en orden de hora; cada fila se lee completa en una sola frase.
- Con texto A++ las filas de clase pasan a una columna (nombre, sala, inicio y término apilados).

DATOS QUE ENTREGA EL SERVIDOR (diseña con estos campos)
POST /api/horario { perfil, clases: [{ nombre, sala_id, bloque: "3-4" }] } (o con inicio y fin en "HH:MM" para el modo "Un cambio de sala")
  traslados: [{ desde, hasta, desde_nombre, hasta_nombre, minutos_disponibles, minutos_necesarios, minutos_estandar, margen, estado: alcanza|justo|no_alcanza|sin_ruta, motivo }]
  resumen: "Llegas a 2 de tus 3 cambios de sala."
  solicitud: texto base del ajuste razonable (la vista lo deja editar)
El modo "Un cambio de sala" usa el mismo endpoint con dos clases.

DATOS DE EJEMPLO (márcalos como tales)
Perfil Movilidad reducida. Clases: Cálculo, Edificio A piso 2, 08:15 a 09:25. Física, Biblioteca, 09:35 a 10:45. Programación, Sala A-201, 10:55 a 12:05. Almuerzo en el Casino desde 12:15.
Resultados: Edificio A piso 2 a Biblioteca, 10 min disponibles, 14 necesarios, no alcanza (Ascensor A fuera de servicio). Biblioteca a Sala A-201, 10 min, 9 necesarios, justo. Sala A-201 a Casino, 10 min, 3 necesarios, alcanza.

Entrega: móvil "Un cambio de sala" con resultado que no alcanza, móvil "Mi horario de hoy" con los tres estados, móvil con el bloque de ajuste razonable, móvil con el aviso en vivo, móvil alto contraste con texto A++, escritorio, y las dos entradas desde Inicio y /mapa.
```

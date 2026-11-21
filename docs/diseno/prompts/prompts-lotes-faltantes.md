# Prompts para Claude Design: los lotes que faltan (6, 7, 8 y 9)

Este archivo trae todo lo que hay que mandarle a Claude Design para terminar las vistas de parejo. Cada bloque de código se pega tal cual, en este orden:

1. **Contexto** (una sola vez al empezar). Sirve igual si el proyecto de Claude Design es el mismo donde ya están los Lotes 0 a 5 y el 10, o si es uno nuevo.
2. **Lote 8** `/campus`
3. **Lote 9** `/horario`
4. **Lote 6** `/acerca`
5. **Lote 7** estados y pulido de todas las vistas. Va al final porque revisa todo lo anterior.

Cada lote se itera hasta que guste y se exporta a su carpeta, con la misma estructura que los lotes anteriores: `README.md`, `datos-ejemplo.json` y `referencia/` con las pantallas en .html y .png.

| Lote | Vista | Estado del diseño | Carpeta del export |
|---|---|---|---|
| 0 | Sistema parejo | Listo | `docs/diseno/vistas/lote-0-sistema/` |
| 1 a 5 | Inicio, Mapa, Comparar, Reportar, Punto QR | Listos | `lote-1-inicio/` a `lote-5-punto/` |
| 10 | `/plano` Plano de Casa Central | Listo (no se vuelve a mandar) | `docs/diseno/vistas/lote-10-plano/` |
| **8** | `/campus` ¿Qué arreglar primero? | **Falta** (la vista ya existe en código sin diseño; el diseño la ajusta) | `docs/diseno/vistas/lote-8-campus/` |
| **9** | `/horario` ¿Llegas a tu próxima clase? | **Falta** | `docs/diseno/vistas/lote-9-horario/` |
| **6** | `/acerca` Acerca de parejo | **Falta** | `docs/diseno/vistas/lote-6-acerca/` |
| **7** | Estados y pulido (todas) | **Falta** | `docs/diseno/vistas/lote-7-estados/` |

Este archivo reemplaza a los Lotes 6 y 7 de `prompts-claude-design.md`, que todavía usan la paleta vieja (azul USM, Roboto, mapa con teselas), y actualiza `prompts-lotes-8-9.md` con los datos reales de `data/obras.json` y el contrato de `docs/contratos.md` §7.

---

## CONTEXTO (pegar primero, una sola vez)

```
Vamos a terminar las vistas que faltan de parejo. Antes de diseñar, lee este contexto completo. Si en este proyecto ya está el sistema del Lote 0, úsalo tal cual y no cambies ningún componente existente: si necesitas uno nuevo, constrúyelo con las piezas del Lote 0 y muéstralo aparte.

QUÉ ES PAREJO
Parejo es una app web para el desafío "Campus sin barreras: movilidad y orientación para todos" (hackatón USM 2026, campus Casa Central, Av. España 1680, Valparaíso). Casa Central está en un cerro: tiene escaleras, patios con adoquín, pasarelas entre edificios y ascensores que a veces se detienen. Parejo le muestra a cada estudiante la ruta que sí puede recorrer según cómo se mueve, la recalcula en vivo cuando alguien reporta una barrera (un ascensor detenido, una rampa bloqueada) y le dice a la universidad qué arreglar primero. Idea central: el mismo campus no es el mismo para todos, y eso se puede medir.

A QUIÉN AYUDA (los 4 perfiles, siempre con este nombre)
- Silla de ruedas: necesita rutas sin escalones, con rampa o ascensor.
- Movilidad reducida: muletas, bastón, lesión temporal o embarazo. Puede subir pocos escalones, se cansa con pendientes.
- Baja visión: necesita piso parejo, guía podotáctil y buen contraste. El adoquín y el piso irregular son barreras.
- Estándar: camina sin restricciones. Sirve para comparar.
Personas de ejemplo: Camila (silla de ruedas), Tomás (muletas por 6 semanas tras una lesión), Ana (baja visión), y estudiantes nuevos que no conocen el campus.

SISTEMA DE DISEÑO PAREJO (Lote 0)
Colores de cerro, definidos como tokens con tema claro, oscuro y alto contraste:
- Niebla #EFF2F1: fondo. Superficie #FCFDFD: paneles.
- Pacífico #0D2B3E: tinta principal. Tinta 2 #3E5566: texto secundario.
- Cobalto #2443D0: único acento de interfaz (enlaces, botón primario, foco del mapa, ruta).
- Calamina #F4B6C2: solo en la marca, nunca en la interfaz.
- Podotáctil #FFC72C: solo para barreras y recálculo, siempre con su textura de domos (no basta el color).
- Alto #C4122F: bloqueado o sin ruta.
- Paso #0E7A57: accesible o resuelto.
Tipografía: una sola familia, Atkinson Hyperlegible Next, pesos 400 a 800. Tamaño de texto elegible A, A+ y A++.
Formas: botones con escalón (sombra sólida inferior, sin desenfoque). Lo elegido se invierte a Pacífico con un check. Áreas táctiles de 48 px como mínimo, 60 px para el botón primario y los campos. Radios 12, 20, 28 y píldora. Foco doble: anillo Pacífico más anillo Podotáctil, visible en todos los temas.
Íconos: Phosphor, peso bold.
Tono: de señalética. Frases cortas, verbos claros, segunda persona ("Tu ruta", "Llegas a"). Nada de jerga técnica.
Prohibido: guion largo y guion medio (escribe con punto o coma), el punto medio "·", flechas "→" en textos, degradados, brillos, tarjetas dentro de tarjetas, etiquetas en mayúsculas, emojis, cifras precisas inventadas presentadas como reales, y comunicar algo solo con color (siempre forma, ícono o texto además del color).

ACCESIBILIDAD (es parte del desafío y de la nota)
Contraste AA como mínimo (AAA en texto de cuerpo cuando se pueda), todo se maneja con teclado en orden lógico, etiquetas visibles en cada campo, nombres claros para lector de pantalla, aria-live para lo que cambia en vivo, zoom al 200 % sin scroll horizontal, prefers-reduced-motion respetado. Todo lo que se hace tocando el mapa también se puede hacer desde una lista o tabla.

LA APP Y SUS RUTAS
- / Inicio: eliges perfil y destino.
- /mapa: tu ruta en el plano, con pasos, y el recálculo en vivo.
- /comparar: la misma ruta para dos perfiles lado a lado.
- /reportar: reportar una barrera y ver las barreras activas.
- /punto/:id: lo abre un código QR pegado en el campus; dice dónde estás y lo lee en voz alta.
- /plano: plano de Casa Central con edificios y pisos.
- /campus: ¿Qué arreglar primero? (Lote 8).
- /horario: ¿Llegas a tu próxima clase? (Lote 9).
- /acerca: Acerca de parejo (Lote 6).
Navegación: en escritorio, cabecera con Ruta, Comparar, Reportar, Mejorar el campus y Acerca. En móvil, barra inferior de 4 ítems: Ruta, Comparar, Reportar y Más. "Más" abre un panel con Mejorar el campus, ¿Llegas a tu próxima clase?, Plano y Acerca.

EL MAPA
Es un plano vectorial de Casa Central dibujado con datos de OpenStreetMap (edificios, senderos, escaleras), con colores de los tokens. No hay teselas ni imágenes de mapa: mientras carga, se ve el contorno del campus. La atribución "© colaboradores de OpenStreetMap" va siempre visible.

PALABRAS (úsalas siempre igual)
- Lugar: entrada, edificio, sala o baño.
- Trayecto: ir de un lugar a otro. La ida y la vuelta cuentan aparte.
- Trayecto con barrera: en Silla de ruedas, no tiene ruta; en Movilidad reducida, su ruta obliga a subir escalones; en Baja visión, su ruta pasa por adoquín o piso irregular, o sin guía podotáctil. En Estándar no existe.
- Obra: cambio permanente al campus (rampa, ascensor nuevo, superficie lisa, guía podotáctil, techado). Nunca "intervención" ni "mejora".
- Barrera: algo temporal que alguien reporta (ascensor fuera de servicio, obstáculo, rampa bloqueada, piso mojado).
- Traslado: el cambio de sala entre dos clases seguidas.
- Ajuste razonable: lo que un estudiante con discapacidad puede pedir (llegar unos minutos después, cambiar la clase de sala).

DATOS
Todo lo que se muestre como cifra viene del motor de rutas sobre el grafo del campus que levantó el equipo en terreno. Donde falte medir, las cifras son de ejemplo y se marcan "Datos de ejemplo" en la misma vista. Los costos de las obras son relativos (bajo, medio, alto), estimados por el equipo, nunca montos en pesos. Pie fijo en las vistas de informe: "Prototipo estudiantil. No es un servicio oficial de la USM."

Confírmame en 4 líneas cómo vas a resolver las vistas que faltan sin salirte del sistema y espera el Lote 8.
```

---

## LOTE 8: `/campus` ¿Qué arreglar primero? (simulador de obras)

```
Lote 8: "/campus", vista "¿Qué arreglar primero?" (en la navegación se llama "Mejorar el campus"). Usa solo el sistema del Lote 0 más los componentes nuevos que se piden aquí.

Para quién: la universidad (Programa de Inclusión, área de infraestructura) y el jurado, que la verá en el proyector.

Objetivo: en 10 segundos, alguien de la universidad (o un juez) entiende cuántos trayectos del campus tienen barrera para un perfil, cuál es la obra que más barreras quita y cómo cambia el campus si la hace. Es una herramienta de decisión, no un dashboard: pocas cifras, grandes, con una frase que las explica. Las obras se miden contra el campus tal como está construido: los reportes del momento no cuentan aquí.

Formato principal: escritorio 1440×900 y proyector (se lee a 5 m). Móvil es secundario pero tiene que funcionar.

ESTRUCTURA (escritorio, de arriba hacia abajo)

1. Encabezado
   - Título: "¿Qué arreglar primero?"
   - Bajada en Cuerpo: "Simulamos obras sobre el mapa accesible de Casa Central y medimos cuántos trayectos dejan de tener barrera para cada perfil."
   - Selector de perfil compacto: los chips Silla de ruedas, Movilidad reducida y Baja visión en una fila (radiogroup con flechas), más un cuarto chip "Todos los perfiles", que cuenta los trayectos con barrera para al menos uno de los tres. Por defecto "Silla de ruedas". El perfil Estándar no va como chip (nunca tiene barrera); si se llega con él desde la URL, se muestra el estado de "Perfil Estándar" (ver ESTADOS).
   - Debajo del selector, en Detalle, qué significa "barrera" para el perfil elegido. Silla de ruedas: "Un trayecto tiene barrera cuando no hay ruta sin escalones." Movilidad reducida: "Un trayecto tiene barrera cuando su ruta obliga a subir escalones." Baja visión: "Un trayecto tiene barrera cuando su ruta pasa por adoquín, piso irregular o sin guía podotáctil." Todos: "Un trayecto tiene barrera cuando la tiene para al menos uno de los tres perfiles."
   - Marca "Datos de ejemplo" visible junto al título mientras corresponda.

2. Estado de hoy (franja de cifras, sin tarjetas, separadas por líneas finas verticales como las métricas de ruta)
   - "14 de 56 trayectos con barrera" (cifra grande en Alto con ícono Prohibit; la palabra lo dice, no solo el color).
   - "+3,1 min de desvío promedio" en los trayectos que sí tienen ruta. Con "Todos los perfiles" esta cifra no existe: la franja muestra solo las otras.
   - Tercera cifra opcional, solo si el servidor la trae: "6 traslados entre salas no alcanzan en 10 min de recreo" (conecta con el Lote 9). Diseña la franja con y sin ella.
   - Debajo, una frase resumen en Subtítulo generada desde los datos: "Hoy, 1 de cada 4 trayectos de Casa Central no se puede hacer en silla de ruedas." Es la frase del pitch. Para otros perfiles cambia el verbo: "En movilidad reducida, 1 de cada 3 trayectos obliga a subir escalones."

3. Cuerpo en dos columnas asimétricas
   Izquierda (7/12): mapa de zonas.
   - El mismo plano vectorial de Casa Central que /mapa (OpenStreetMap, sin teselas), con cada lugar marcado según qué tan accesible es llegar a él desde el resto, para el perfil elegido. Tres niveles, cada uno con forma, ícono y texto propios (nunca solo color):
     a) Accesible: círculo con check, color Paso.
     b) Con desvío: rombo con la cifra "+4 min" dentro de una etiqueta, color Cobalto.
     c) Con barrera: cuadrado con Prohibit, color Alto, con la cantidad: "5 trayectos con barrera". En Silla de ruedas la etiqueta dice "Sin ruta"; en Movilidad reducida, "Con escalones"; en Baja visión, "Sin guía".
   - Las obras que se pueden simular aparecen sobre el mapa como un pictograma en un cuadrado Pacífico con borde blanco (rampa, ascensor, superficie, guía podotáctil, techado). Al seleccionar una en la lista, se resalta en el mapa y viceversa.
   - Leyenda fija abajo a la izquierda con las tres formas, el pictograma de obra y su texto.
   - Interruptor "Ver como lista", igual que en /mapa: muestra los lugares en una tabla (Lugar, Trayectos con barrera que llegan, Desvío promedio, Estado) para lector de pantalla y baja visión. Es parte del diseño, no un extra.

   Derecha (5/12): ranking de obras.
   - Título: "Obras que más ayudan". Bajada en Detalle: "Ordenadas por trayectos que dejan de tener barrera."
   - Lista ordenada (ol) de obras. Cada fila, sin tarjeta, separada por línea fina:
     - posición (1, 2, 3) en cifra mediana,
     - título de la obra en Cuerpo 700: "Rampa en la escalera del patio central hacia la Biblioteca",
     - pictograma del tipo y el lugar en Detalle,
     - el impacto como texto, sin barras: "9 trayectos sin barrera", "1,2 min menos en promedio",
     - perfiles beneficiados como íconos de perfil con su nombre (no solo íconos),
     - costo relativo en texto con ícono: "Costo bajo", "Costo medio", "Costo alto",
     - un interruptor "Simular" (switch accesible con etiqueta completa: "Simular rampa en la escalera del patio central").
   - Una obra que no quita barreras para el perfil elegido igual aparece al final, con "No quita barreras para Silla de ruedas" en Detalle (por ejemplo el techado, útil con lluvia).
   - Arriba de la lista, un selector "Ordenar por: Trayectos sin barrera / Minutos ahorrados / Costo".

4. Simulación (el momento clave de la vista)
   Cuando se activa una o más obras:
   - Aparece arriba del cuerpo una franja "Con las obras simuladas" que compara Hoy y Con obras lado a lado, en cifras grandes: "Hoy: 14 con barrera. Con 2 obras: 3 con barrera." y, por perfil: "Silla de ruedas: 11 trayectos más con ruta. Movilidad reducida: 7 trayectos más sin escalones. Baja visión: 4 trayectos más sin barrera." No uses flechas ni barras: dos columnas con encabezado "Hoy" y "Con obras".
   - En el mapa, los lugares que cambian de nivel se redibujan con su nueva forma y una marca "Nuevo" en Paso durante unos segundos (sin animación si prefers-reduced-motion).
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
   "Armar informe" abre una vista lista para imprimir o guardar como PDF, en blanco y negro legible, una página A4 vertical:
   - Título "Propuesta de obras para un campus parejo", fecha y perfil evaluado.
   - Las cifras Hoy y Con obras.
   - La tabla de obras elegidas con impacto, perfiles beneficiados y costo relativo.
   - El mapa en miniatura con las formas de la leyenda (debe entenderse impreso en gris).
   - Los supuestos y el pie "Prototipo estudiantil. No es un servicio oficial de la USM."

MÓVIL (390×844)
- Encabezado y selector de perfil (los chips en scroll horizontal con snap).
- La franja de cifras pasa a una columna.
- Pestañas "Obras" y "Mapa" (tablist accesible) en lugar de dos columnas. "Obras" va primero.
- La franja "Con las obras simuladas" queda fija arriba mientras haya obras activas, compacta: "Con 2 obras: 3 con barrera (hoy 14)".
- Ajuste del shell: la barra inferior pasa a Ruta, Comparar, Reportar y Más. Diseña el panel "Más" (hoja inferior con Mejorar el campus, ¿Llegas a tu próxima clase?, Plano y Acerca, cada uno con su ícono y 56 px de alto; se cierra con Escape y devuelve el foco al botón Más).

PROYECTOR
Con el modo proyector del Lote 7: tipografía +20 %, solo las cifras de estado, el mapa y las 3 primeras obras. Es lo que se muestra en el pitch al activar una obra en vivo.

ESTADOS
- Carga: esqueletos con la forma de las cifras y de las filas de obras.
- Perfil Estándar: "Para el perfil Estándar ningún trayecto tiene barrera. Elige otro perfil para ver dónde está." (con los chips a la mano).
- Ninguna obra mejora nada para el perfil elegido: "Ninguna de las obras de la lista quita barreras para Baja visión."
- Todas las obras activas y siguen trayectos con barrera: la franja lo dice, en Alto con ícono: "Aún quedan 2 trayectos con barrera: necesitan obras que no están en la lista."
- Error de servidor: mensaje en línea con "Reintentar".

COMPONENTES NUEVOS (muéstralos aparte, con sus estados)
- Fila de obra (normal, hover, foco, simulada).
- Switch "Simular" (apagado, encendido, foco, deshabilitado con motivo).
- Marcadores de zona: Accesible, Con desvío, Con barrera, Nuevo, Obra.
- Franja comparativa Hoy / Con obras.
- Panel "Más" del shell móvil.

DATOS QUE ENTREGA EL SERVIDOR (GET /api/simulador?perfil=silla_ruedas&obras=id1,id2; diseña con estos campos)
perfil: silla_ruedas | movilidad_reducida | baja_vision | todos
hoy: { trayectos_evaluados, trayectos_con_barrera, minutos_extra_prom }   (minutos_extra_prom es null con "todos")
con_obras: null si no hay obras activas; si hay: { trayectos_evaluados, trayectos_con_barrera, minutos_extra_prom, trayectos_sin_barrera_por_perfil: { silla_ruedas, movilidad_reducida, baja_vision } }
obras: [{ id, tipo: rampa|ascensor|superficie|guia_tactil|techado, titulo, lugar, costo_relativo: bajo|medio|alto, perfiles_beneficiados: [ids], trayectos_sin_barrera, minutos_ahorrados_prom }]   (cada obra se mide sola contra hoy, para el perfil pedido)
zonas: [{ nodo_id, nombre, lat, lng, estado: accesible|desvio|con_barrera, trayectos_con_barrera, minutos_extra }]   (con las obras activas aplicadas)

OBRAS REALES (las definió el equipo con el levantamiento; úsalas con estos títulos. Las cifras de impacto que muestres son de ejemplo: márcalas como tales)
1. Rampa en la escalera del patio central hacia la Biblioteca. Rampa. Lugar: Patio central. Costo medio. Beneficia a Silla de ruedas, Movilidad reducida y Baja visión.
2. Piso liso y guía táctil en el camino lateral a la Biblioteca. Superficie. Lugar: Biblioteca. Costo medio. Beneficia a Baja visión.
3. Guía táctil entre la entrada principal y el Casino. Guía podotáctil. Lugar: Casino. Costo bajo. Beneficia a Baja visión.
4. Guía táctil desde el Edificio B hasta la pasarela al Edificio A. Guía podotáctil. Lugar: Edificio B. Costo medio. Beneficia a Baja visión.
5. Ascensor nuevo en el Edificio B hacia el piso 2 del Edificio A. Ascensor. Lugar: Edificio B. Costo alto. Beneficia a Silla de ruedas y Baja visión.
6. Techo en el camino del patio central al Casino. Techado. Lugar: Casino. Costo bajo. Beneficia a los tres perfiles con lluvia; puede no quitar barreras.
Cifras de ejemplo: hoy 14 de 56 trayectos con barrera en Silla de ruedas, +3,1 min de desvío promedio. La rampa del patio deja 9 trayectos sin barrera; el ascensor del Edificio B, 6.
Lugares: Entrada principal, Patio central, Ascensor A, Edificio A piso 2, Sala A-201, Biblioteca, Edificio B, Baño accesible B, Casino.

Entrega: escritorio sin obras, escritorio con una obra, escritorio con tres obras, escritorio "Ver como lista", escritorio con "Todos los perfiles", móvil pestaña Obras con simulación activa, móvil pestaña Mapa, móvil con el panel "Más" abierto, proyector, página del informe impreso y la hoja de componentes nuevos. Modo oscuro y alto contraste de la vista principal de escritorio.
```

---

## LOTE 9: `/horario` ¿Llegas a tu próxima clase?

```
Lote 9: "/horario", vista "¿Llegas a tu próxima clase?". Es un accesorio de parejo: rápido, de una sola pantalla, pensado para el celular entre clases. No es una agenda ni un gestor de horario: es una revisión rápida.

Usuarios principales: Tomás (muletas por 6 semanas) y Camila (silla de ruedas). Tienen 10 minutos entre una clase en el Edificio A piso 2 y otra en la Biblioteca. Para el perfil Estándar sobra tiempo; para ellos, con el ascensor detenido, no.

Objetivo: en 20 segundos saber si alcanzan, cuánto les falta y qué hacer.

Prioridad: lo primero que se va a implementar es la pestaña "Un cambio de sala" con su resultado. Diseña eso con más cuidado; lo demás se implementa si queda tiempo.

ESTRUCTURA EN MÓVIL (390×844)

1. Encabezado
   - Título: "¿Llegas a tu próxima clase?"
   - Bajada: "Revisa si el tiempo entre clases te alcanza según cómo te mueves."
   - Chip del perfil actual (el que se eligió en Inicio) con la acción "Cambiar".

2. Dos maneras de revisar (tablist accesible, dos pestañas):
   a) "Un cambio de sala" (por defecto)
      - "Salgo de": selector de lugar (salas y edificios), el mismo campo de lugar de Inicio.
      - "Voy a": selector de lugar.
      - "Tengo": control segmentado 5 min / 10 min / 15 min / 20 min, más "Otro" que abre un campo numérico. Por defecto 10 min.
      - Botón primario "Revisar".
   b) "Mi horario de hoy"
      - Lista de clases del día, cada una en una fila editable: nombre de la clase (opcional, ej. "Cálculo"), sala y bloque. El bloque se elige de una lista (Bloque 1-2, 08:15 a 09:25; Bloque 3-4, 09:35 a 10:45; Bloque 5-6, 10:55 a 12:05; y así), no se escribe la hora. La lista es un select nativo grande con la hora escrita en cada opción.
      - "Agregar clase" (secundario) hasta 6 clases. Cada fila se puede quitar.
      - Botón primario "Revisar mi día".
      - Nota en Detalle: "Tu horario se queda en este teléfono. No lo enviamos a nadie."

3. Resultado (aparece debajo, se anuncia por aria-live, y el foco salta a su título)
   - Una frase resumen en Subtítulo: "Llegas a 2 de tus 3 cambios de sala." o, en modo rápido, "No alcanzas: te faltan 4 minutos."
   - Una fila por traslado, ordenadas por hora, cada una con su estado. Los estados se distinguen por ícono, texto y forma:
     - Alcanza (ícono CheckCircle, Paso): "Sala A-201 a Casino. Tienes 10 min, necesitas 3 min. Te sobran 7 min."
     - Justo (aviso Podotáctil con textura, ícono Warning): "Tienes 10 min, necesitas 9 min. Sal apenas termine la clase."
     - No alcanza (ícono Prohibit, Alto): "Edificio A piso 2 a Biblioteca. Tienes 10 min, necesitas 14 min. Te faltan 4 min."
     - Sin ruta (ícono Prohibit, Alto): "No hay ruta sin escalones a Biblioteca en este momento."
   - Cada fila muestra el motivo en Detalle cuando lo hay: "El Ascensor A está fuera de servicio. El desvío por la rampa del Edificio B suma 6 min."
   - Cada fila muestra la comparación con el perfil Estándar en Detalle: "Con el perfil Estándar: 4 min." Es lo que hace visible la diferencia.
   - Acción por fila: "Ver ruta" (abre /mapa con origen, destino y perfil puestos).
   - "Justo" es cuando sobran 2 min o menos. Decláralo en la vista como supuesto.
   - Supuesto visible bajo el resultado: "Los minutos consideran que con muletas o en silla de ruedas se avanza más lento que a paso normal. Es una estimación del equipo."

4. Pide un ajuste razonable (solo si algún traslado no alcanza o no tiene ruta)
   - Título: "Pide un ajuste razonable"
   - Bajada: "Puedes pedir llegar unos minutos después, salir antes o que la clase cambie de sala. Te dejamos el texto listo."
   - Selector de destinatario: "Docente" o "Programa de Inclusión USM". Cambia el saludo del texto.
   - Vista previa del texto en un textarea editable (Cuerpo, buen interlineado), ya redactado con los datos: clases, salas, minutos disponibles y necesarios, motivo. Ejemplo:
     "Hola. Me muevo con muletas por una lesión temporal. Entre Cálculo (Edificio A, piso 2, termina 09:25) y Física (Biblioteca, empieza 09:35) tengo 10 minutos, y el trayecto sin escaleras me toma 14. Les pido poder llegar hasta 5 minutos después a Física mientras dure la lesión. Gracias."
   - Campo opcional "Tu nombre" (no obligatorio, no se guarda en ningún servidor).
   - Acciones: "Copiar texto" (primario; confirma en línea "Texto copiado", no un aviso que desaparece solo) y "Abrir en mi correo" (secundario, sin destinatario fijo).
   - Nota: "parejo no envía nada. Tú decides si lo mandas y a quién."

5. En vivo
   - Si llega un reporte que cambia un traslado (por ejemplo, se detiene el Ascensor A), aparece arriba del resultado el aviso Podotáctil del sistema: "El Ascensor A se detuvo. Tu cambio de sala de las 09:25 ya no alcanza." con "Ver detalle". Igual que el recálculo de /mapa.

ESCRITORIO (1440×900)
Dos columnas: a la izquierda (5/12) el formulario; a la derecha (7/12) el resultado y el ajuste razonable. Sin mapa: esta vista es de texto.

ENTRADAS DESDE OTRAS VISTAS (muéstralas)
- En Inicio, debajo del botón "Ver mi ruta": enlace con ícono Clock "¿Llegas a tu próxima clase? Revísalo aquí".
- En el panel de ruta de /mapa: enlace "¿Me alcanza el recreo?" que abre /horario con el origen y el destino de la ruta ya puestos.
- En el panel "Más" del móvil (Lote 8).

ESTADOS
- Sin clases todavía (pestaña horario): "Agrega al menos dos clases para revisar tus cambios de sala."
- Una sola clase: "Con una sola clase no hay cambios de sala que revisar."
- Dos clases en el mismo bloque: "Física y Cálculo están en el mismo bloque. Revisa tu horario."
- Clases no seguidas (hay un bloque libre entre medio): el traslado se muestra igual, con el tiempo real disponible.
- Mismo lugar de salida y llegada: "Elige una sala distinta para revisar el traslado."
- Sin ruta accesible ahora: la fila dice "No hay ruta sin escalones a Biblioteca en este momento" con el motivo, y el ajuste razonable sugiere el cambio de sala.
- Cargando: esqueleto con la forma de la frase resumen y de las filas.
- Error de servidor: mensaje en línea con "Reintentar", sin borrar lo escrito.
- Sin conexión: se muestra el último resultado con su hora: "Revisado a las 10:02. Sin conexión: puede haber cambiado."

ACCESIBILIDAD ESPECÍFICA
- El bloque se elige con un select nativo con etiqueta visible; nada de selectores de rueda propios.
- El resultado es una lista (ol) en orden de hora; cada fila se lee completa en una sola frase.
- Con texto A++ las filas de clase pasan a una columna (nombre, sala, inicio y término apilados).

DATOS (diseña con estos campos; el cálculo usa el mismo motor de rutas de /mapa)
Entrada: perfil, y dos o más clases con { nombre, sala, bloque } (o, en "Un cambio de sala", salgo de, voy a y minutos disponibles).
Por traslado: desde_nombre, hasta_nombre, minutos_disponibles, minutos_necesarios, minutos_estandar, margen, estado: alcanza | justo | no_alcanza | sin_ruta, motivo.
Resumen: "Llegas a 2 de tus 3 cambios de sala."
Solicitud: texto base del ajuste razonable (la vista lo deja editar).

DATOS DE EJEMPLO (márcalos como tales)
Perfil Movilidad reducida. Clases: Cálculo, Edificio A piso 2, 08:15 a 09:25. Física, Biblioteca, 09:35 a 10:45. Programación, Sala A-201, 10:55 a 12:05. Almuerzo en el Casino desde 12:15.
Resultados: Edificio A piso 2 a Biblioteca, 10 min disponibles, 14 necesarios, no alcanza (Ascensor A fuera de servicio). Biblioteca a Sala A-201, 10 min, 9 necesarios, justo. Sala A-201 a Casino, 10 min, 3 necesarios, alcanza.

Entrega: móvil "Un cambio de sala" con resultado que no alcanza, móvil "Un cambio de sala" con resultado que alcanza, móvil "Mi horario de hoy" con los tres estados, móvil con el bloque de ajuste razonable, móvil con el aviso en vivo, móvil alto contraste con texto A++, escritorio, y las dos entradas desde Inicio y /mapa.
```

---

## LOTE 6: `/acerca` Acerca de parejo

```
Lote 6: "/acerca", vista "Acerca de parejo". Es la vista que explica el proyecto: la mira el jurado, la universidad y cualquier estudiante que quiera saber de dónde salen los datos. Usa solo el sistema del Lote 0.

Objetivo: en 1 minuto de lectura, alguien entiende qué dificultad resuelve parejo, a quién ayuda, cómo funciona y con qué supuestos. Es una página de texto bien jerarquizada, no una landing de marketing: sin héroe gigante, sin fotos de banco, sin cifras infladas.

Formato: escritorio 1440×900 (columna de lectura de 68 caracteres como máximo, centrada, con un índice lateral fijo a la izquierda en escritorio) y móvil 390×844 (una columna, el índice pasa a una lista de enlaces arriba).

ESTRUCTURA (en este orden, cada sección con su h2 y su ancla para el índice)

1. Encabezado
   - Marca parejo (aquí sí va Calamina, solo en la marca).
   - h1: "Acerca de parejo"
   - Bajada en Subtítulo: "El mismo campus no es el mismo para todos. Parejo lo hace visible y ayuda a recorrerlo."
   - Enlace primario "Planificar una ruta" que lleva a /.

2. La dificultad
   - Texto: "Casa Central está en un cerro. Para llegar de una sala a otra hay escaleras, patios de adoquín, pasarelas entre edificios y ascensores que a veces se detienen. Quien usa silla de ruedas, muletas o tiene baja visión no sabe de antemano qué camino puede recorrer, y lo descubre cuando ya está frente a la escalera. Los estudiantes nuevos tampoco conocen el campus."
   - Un espacio para una foto del campus (una escalera del patio central), con su texto alternativo escrito y la leyenda "Escalera del patio central, Casa Central USM." Si no hay foto, un recuadro con el contorno del plano del campus y la leyenda "Foto pendiente". No uses fotos de banco.

3. A quién ayuda
   - Los 4 perfiles en una rejilla de 2×2 (en móvil, una columna), cada uno con su ícono de perfil, su nombre y una frase de qué necesita:
     - Silla de ruedas: "Rutas sin escalones, con rampa o ascensor que funcione."
     - Movilidad reducida: "Pocos escalones y pendientes suaves. Incluye lesiones temporales, como unas muletas por seis semanas."
     - Baja visión: "Piso parejo, guía podotáctil y lugares fáciles de reconocer."
     - Estudiantes nuevos: "Orientarse en un campus que todavía no conocen, con códigos QR en los puntos clave."
   - Sin tarjetas dentro de tarjetas: cada perfil es un bloque con línea fina, no una tarjeta con sombra.

4. Cómo funciona
   - Tres verbos con su ícono y una frase, sin numerarlos como "Paso 1, 2, 3":
     - Elige: "Dices cómo te mueves y a dónde vas. Parejo calcula la ruta que puedes recorrer, no la más corta."
     - Recorre: "La ruta se recalcula en vivo cuando alguien reporta una barrera, como un ascensor detenido. En los puntos clave hay un código QR que te dice dónde estás y lo lee en voz alta."
     - Mejora: "Con los mismos datos, la universidad puede simular obras y ver cuál quita más barreras primero."
   - Debajo, enlaces a cada parte: "Planificar una ruta", "Comparar perfiles", "Reportar una barrera", "¿Qué arreglar primero?".

5. De dónde salen los datos (supuestos y límites, siempre visibles)
   - "El plano de Casa Central viene de OpenStreetMap (© colaboradores de OpenStreetMap)."
   - "Los tramos (escalones, pendientes, superficie, guía podotáctil, ascensores) los levantó el equipo en terreno el 21-11-2026. Donde no alcanzamos a medir, usamos datos de ejemplo y lo marcamos en cada vista."
   - "Los minutos de cada ruta son una estimación del equipo: con silla de ruedas o muletas se avanza más lento que a paso normal."
   - "Los reportes de barreras duran lo que indica quien reporta (hasta 4 horas) y cualquiera puede marcarlos como resueltos."
   - "El costo de las obras es relativo (bajo, medio, alto), no un presupuesto."
   - "Prototipo estudiantil. No es un servicio oficial de la USM."

6. Para qué sirve (Objetivos de Desarrollo Sostenible)
   - Tres filas, cada una con el número del objetivo en una insignia simple (sin los colores ni logos oficiales de la ONU) y una frase de cómo aporta parejo:
     - ODS 10 Reducción de las desigualdades: "El mismo campus, con las mismas oportunidades de llegar a clase."
     - ODS 11 Ciudades y comunidades sostenibles (meta 11.7, espacios públicos accesibles): "Hace visibles las barreras del espacio común y propone cuáles quitar."
     - ODS 4 Educación de calidad (meta 4.a, instalaciones educativas accesibles): "Llegar a clase no debería depender de cómo te mueves."

7. Accesibilidad de esta app
   - Texto corto: "Parejo se maneja con teclado y lector de pantalla, tiene tema oscuro y de alto contraste, y tres tamaños de texto. Si algo no te funciona, repórtalo." con el enlace a /reportar.
   - Los controles de tema y tamaño de texto del sistema, a la mano.

8. Equipo
   - "Hecho en la hackatón USM 2026 por un equipo de estudiantes." con el enlace al repositorio del proyecto. No pongas nombres ni correos.

Cifras: no pongas cifras de prevalencia de discapacidad ni estadísticas sin fuente. Si una cifra ayuda y no tiene fuente confirmada, déjala como un hueco marcado "Cifra con fuente pendiente".

ACCESIBILIDAD
- Un solo h1, h2 por sección, en orden. El índice es un nav con aria-label "En esta página" y marca la sección actual con aria-current.
- Los enlaces dicen a dónde llevan (nada de "aquí" suelto).
- La foto lleva texto alternativo; el recuadro de "Foto pendiente" es decorativo.

Entrega: escritorio completo (claro), móvil completo (claro), escritorio en oscuro, móvil en alto contraste con texto A++.
```

---

## LOTE 7: estados y pulido (todas las vistas)

```
Lote 7: estados y pulido. Revisa todas las vistas de parejo (/, /mapa, /comparar, /reportar, /punto/:id, /plano, /campus, /horario, /acerca, la cabecera, la navegación móvil y el panel "Más") y diseña lo que falta para que la app aguante la demo en vivo. Usa solo el sistema del Lote 0. Entrega todo en una página "Estados", agrupado por tipo, con cada estado mostrado en la vista real donde ocurre (no en abstracto).

1. Carga
   - Esqueletos con la forma real de lo que viene: la franja de métricas de ruta, la lista de pasos, las filas de barreras activas, las cifras y filas de obras de /campus, las filas de traslado de /horario.
   - El mapa muestra el contorno del campus mientras carga el plano (no hay teselas). Sin spinners que giran en el centro de la pantalla.
   - Con prefers-reduced-motion los esqueletos no pulsan.

2. Error de servidor
   - Mensaje en línea, en el lugar donde iba el contenido, con ícono, texto claro y el botón "Reintentar". Ejemplo en /mapa: "No pudimos calcular tu ruta. Revisa tu conexión y vuelve a intentarlo." Nunca un error técnico ni un código.
   - En formularios (/reportar, /horario) el error no borra lo que la persona escribió.
   - Muéstralo en /mapa, /reportar, /campus y /horario.

3. Sin conexión
   - La banda "En vivo" pasa a "Sin conexión" (ícono WifiSlash, texto, no solo color).
   - Se mantiene lo último que se vio, con su hora: "Ruta calculada a las 10:02. Sin conexión: las barreras pueden haber cambiado."
   - Cuando vuelve la conexión: "En vivo" otra vez y, si algo cambió, el aviso de recálculo normal.
   - Muéstralo en /mapa y /reportar.

4. Página no encontrada y punto QR desconocido
   - Ruta que no existe: "No encontramos esta página." con enlaces a "Planificar una ruta" y "Ver el plano".
   - /punto/:id con un código que no existe: "Este código QR no corresponde a un punto de parejo." con "Ver el plano de Casa Central" y "Planificar una ruta". Mismo tono, sin culpar a nadie.

5. Revisión cruzada (corrige y muestra el antes y después de lo que cambies)
   - Mismo nombre para lo mismo en todas las vistas: perfiles, lugares, "barrera", "obra", "trayecto", botones.
   - Cobalto es el único acento de interfaz; Podotáctil solo en barreras y recálculo, con textura; Alto solo en bloqueado o sin ruta; Paso solo en accesible o resuelto. Marca cualquier vista que se salga.
   - Ningún estado se comunica solo con color.
   - Áreas táctiles de 48 px o más; primario y campos de 60 px.
   - Foco doble visible en todos los elementos interactivos, en los 3 temas.
   - Sin guion largo, guion medio, punto medio ni flechas en los textos.
   - Zoom al 200 % sin scroll horizontal a 390 px y a 1440 px.

6. Modo proyector (?presentacion=1)
   - Es para el pitch: se proyecta y se lee a 5 m.
   - Tipografía +20 %, se ocultan los controles secundarios (tema, tamaño de texto, enlaces de ayuda), la línea de la ruta en el mapa es más gruesa y los marcadores más grandes.
   - Una marca discreta "Modo presentación" en la cabecera, con la forma de salir.
   - Muéstralo en /mapa con el recálculo en vivo, en /comparar y en /campus con una obra activa (cifras de estado, mapa y las 3 primeras obras).

7. Checklist final
   - Una lista de verificación de accesibilidad y consistencia para que el equipo revise antes de entregar: contraste AA en los 3 temas, teclado en cada vista, lectores de pantalla (nombres de botones y anuncios aria-live), zoom 200 %, texto A++, prefers-reduced-motion, atribución de OpenStreetMap visible en cada mapa, "Datos de ejemplo" donde corresponde.

Entrega: la página "Estados" con todo lo anterior, en claro, y una muestra de los estados de carga y error en oscuro y en alto contraste.
```

# Parejo · Pruebas de viaje por perfil

**Versión probada** `ce19106` de Hackaton-Lyoss-2026, el 21 de noviembre de 2026. Las personas son ficticias y cada una usa uno de los cuatro perfiles de Parejo. Se ejecutaron 20 casos con el motor, el modelo QR y las funciones que preparan los pasos y explicaciones para la interfaz. **17 pasaron y 3 incumplieron el criterio evaluado.** Los viajes usan el grafo simulado del repositorio. La transitabilidad física y el audio en un dispositivo quedan pendientes de validación.

Para repetir la auditoría desde `~/parejo-pruebas`, ejecutar `node integracion/auditoria-perfiles.mjs`. Cada caso imprime los datos observados. Los tres criterios incumplidos hacen que la auditoría devuelva código 1 mientras sigan pendientes. Los IDs del informe coinciden con los de la prueba.

## Elena · Estándar

Estoy en mi primera semana en Casa Central. Puedo usar escaleras y quiero encontrar el recorrido más corto que esté disponible. Uso el mapa desde el celular.

| Caso | Qué quise hacer | Criterio de aceptación | Resultado y qué falló |
| --- | --- | --- | --- |
| E1 | Llegar de la Entrada principal a mi clase en la Sala A-201. | Si la ruta más corta usa escaleras, debe conservar el destino y avisarme cuántos escalones hay. | **Pasó.** 320 m, 5,9 min y aviso explícito de 42 escalones. |
| E2 | Ir de la Entrada principal al Casino en la hora de almuerzo. | Respetar el sentido de la calle de servicio y usar el Patio central para la ida. | **Pasó.** 340 m por el patio, sin usar la calle de servicio al revés. |
| E3 | Volver del Casino a la Entrada principal cuando la calle de servicio está habilitada. | Usar el atajo en el sentido permitido si reduce la distancia. | **Pasó.** 235 m por la calle de servicio, 105 m menos que la ida. |
| E4 | Repetir la vuelta con un obstáculo en la calle de servicio. | Excluir el tramo bloqueado y mantener origen y destino. | **Pasó.** La vuelta cambió a 340 m por el patio. El prototipo simulado trae este obstáculo como ejemplo al arrancar. |
| E5 | Desde la vuelta Casino → Entrada principal, reportar un problema y volver al mismo viaje. | Al elegir «Ver en el mapa», recuperar Casino, Entrada principal y el perfil Estándar. | **Brecha por revisión de código.** El enlace desde la ruta envía solo `ruta`. El formulario lee `desde`, `hasta` y `perfil` y, sin esos campos, usa Entrada principal → Sala A-201. Falta reproducir en navegador. |

## Camila · Silla de ruedas

Uso silla de ruedas manual. Necesito evitar escalones y pendientes altas, saber si un acceso está verificado y contar con una salida si cambian las condiciones.

| Caso | Qué quise hacer | Criterio de aceptación | Resultado y qué falló |
| --- | --- | --- | --- |
| S1 | Ir de la Entrada principal a la Sala A-201 con el ascensor operativo. | Usar el Ascensor A y entregar un recorrido sin escalones. | **Pasó en el grafo.** 330 m y 0 escalones. La incertidumbre de la rampa de entrada se evalúa en S7. |
| S2 | Llegar a la misma sala con el Ascensor A fuera de servicio. | Evitar el ascensor, mantener el destino y elegir una alternativa sin escalones. | **Pasó.** Desvío de 450 m por el Edificio B, 120 m más, sin escalones. |
| S3 | Llegar cuando el ascensor y la pasarela B–A están bloqueados. | Mostrar que no hay ruta para mi perfil y evitar la escalera como alternativa. | **Pasó en el motor.** Devuelve «sin ruta accesible para este perfil». En `/mapa`, el código muestra ese motivo genérico. |
| S4 | Ir de la Entrada principal al Baño accesible B. | Evitar tanto la rampa de pendiente alta de la Biblioteca como el tramo de tres escalones. | **Pasó.** El motor devuelve «sin ruta». El baño puede ser accesible localmente aunque no pueda llegar desde esta entrada. |
| S5 | Ir al mismo baño cuando ya estoy en la Biblioteca. | Distinguir el lugar de partida y ofrecer el tramo de 5 m sin escalones. | **Pasó.** Ruta directa por `t8`. |
| S6 | Salir del vestíbulo del Ascensor A hacia el Patio central con el equipo averiado. | Bloquear el viaje vertical y mantener la salida del vestíbulo por el pasillo. | **Pasó.** 45 m por el pasillo techado, sin escalones. |
| S7 | Saber, antes de salir hacia la Sala A-201, si la rampa de entrada está comprobada. | El paso o las advertencias deben identificar la rampa de entrada como pendiente de verificación. | **Falló.** El paso dice «Rampa suave, piso liso» y el resultado solo advierte sobre el ascensor. El dato de `t1` y el QR `p1` sí indican que el acceso está por verificar. |
| S8 | Entender qué impide llegar a la Sala A-201 si se cierran el ascensor, la rampa B y la pasarela a la vez. | Explicar por qué están cortadas tanto la ruta por ascensor como la alternativa por B. | **Falló en la explicación de Comparar.** Solo menciona el Ascensor A. La rampa y la pasarela quedan fuera porque retirar cualquiera por separado sigue dejando un corte en el mismo desvío. |

## Diego · Movilidad reducida

Voy con bastón por una lesión temporal. Prefiero evitar pendientes fuertes. Puedo aceptar unos pocos escalones si estoy descansado, pero hoy no puedo bajar 42.

| Caso | Qué quise hacer | Criterio de aceptación | Resultado y qué falló |
| --- | --- | --- | --- |
| M1 | Ir de la Entrada principal a la Sala A-201. | Preferir el ascensor cuando está operativo y hay una opción sin escalones. | **Pasó.** 330 m y 0 escalones, aunque la ruta estándar mide 320 m. |
| M2 | Ir de la Entrada principal a la Biblioteca evitando pendientes altas. | Si indico que la pendiente alta es un límite, excluir ese tramo y mostrar otra ruta, con sus escalones, o indicar que no hay opción compatible. | **Brecha de producto.** Con el perfil actual devuelve la rampa empinada de 140 m, con aviso de pendiente alta y piso irregular. Está penalizada en el cálculo, pero no existe un ajuste de usuario para convertirla en un límite. |
| M3 | Bajar de la Sala A-201 al Patio central con el ascensor y la pasarela cerrados. | Mostrar la dirección real de los escalones. Si fijo un máximo de 3 para este viaje, excluir la escalera de 42. | **Resultado parcial.** El paso indica «Baja 42 escalones». El perfil ofrece esa ruta de 50 m y carece de un ajuste de máximo de escalones. |

## Valentina · Baja visión

Uso texto grande y me oriento con referencias táctiles. Quiero seguir los pasos sin depender del plano y saber de antemano cuándo cambia el piso o termina la guía.

| Caso | Qué quise hacer | Criterio de aceptación | Resultado y qué falló |
| --- | --- | --- | --- |
| V1 | Ir desde la Biblioteca al Baño accesible B con el móvil. | Mostrar un paso legible con distancia y presencia de guía táctil. | **Pasó en el modelo.** Ruta de 5 m y 0 escalones. El paso señala piso liso y guía táctil. |
| V2 | Ir de la Entrada principal a la Biblioteca por la rampa. | Identificar la pendiente alta y el piso irregular antes de recorrerla. | **Pasó.** La ruta de 140 m advierte ambas condiciones. La falta de guía se comprueba aparte en V5. |
| V3 | Ir de la Entrada principal a la Sala A-201 con el ascensor y la pasarela cerrados. | Advertir el sentido y la cantidad de escalones. Poder escuchar los pasos al salir del QR. | **Resultado parcial.** La ruta dice «Sube 42 escalones» y advierte la pendiente alta. La revisión de `ListaPasos` y `BarraVoz` muestra que los controles de voz están en el QR, sin un control equivalente en la ruta. Falta probar audio real. |
| V4 | Escanear el QR del Ascensor A con el perfil Baja visión ya seleccionado y el ascensor averiado. | Colocar el aviso antes de las indicaciones, marcar bloqueado el acceso vertical y conservar el perfil en el enlace. | **Pasó en el modelo QR.** El aviso es la primera frase y «Llévame» conserva `baja_vision`. |
| V5 | Saber si puedo seguir una guía táctil en la rampa Entrada → Biblioteca. | Cuando el dato del tramo indica ausencia de guía, decirlo expresamente en el paso. | **Falló.** El paso describe la rampa empinada y el piso irregular, pero omite que no hay guía táctil. |
| V6 | Escanear un QR por primera vez en un navegador sin preferencias guardadas. | Poder confirmar el perfil antes de iniciar el trayecto, manteniendo el origen del QR y el destino. | **Brecha por revisión del modelo.** El QR abre con contraste y texto grande por defecto. El enlace toma el perfil Estándar si no hay uno guardado, y el selector de perfil está fuera de la tarjeta de destino. Falta reproducir el cambio de contexto en navegador. |

## Historias de usuario pendientes

### HU-1 · Avisar cuando un acceso está por verificar — alta · S7

Como Camila, quiero saber si una rampa de mi viaje aún depende de datos simulados, para decidir si necesito confirmar el acceso antes de salir.

- Dado un tramo pendiente de verificación, la ruta muestra el nombre del tramo y su estado en el resumen de advertencias y en el paso correspondiente.
- Para Entrada → Sala A-201, el aviso distingue la rampa de entrada de las demás rampas. La lista de pasos y el QR comunican el mismo estado cuando describen el mismo acceso.
- Al reemplazar el dato por una verificación de campo, el aviso desaparece de ese tramo.

### HU-2 · Explicar las alternativas cerradas — alta · S3, S4 y S8

Como Camila, quiero entender por qué no puedo llegar y qué dato cambiaría esa situación, para elegir otro destino o esperar que se reabra un acceso.

- Con el ascensor, la rampa B y la pasarela bloqueados, Mapa y Comparar explican por qué están cerradas ambas alternativas. Si se reabre solo la rampa o solo la pasarela, la vista sigue indicando que el desvío está cortado.
- Desde la entrada hacia el baño, sin reportes activos en el trayecto, la explicación identifica los escalones y la pendiente alta como restricciones del recorrido. No atribuye el problema a una barrera activa.
- «Probar otro destino» conserva el punto de partida y el perfil.

### HU-3 · Ajustar restricciones para un viaje — alta · M2 y M3

Como Diego, quiero fijar el máximo de escalones que puedo afrontar y excluir pendientes altas, para tener una ruta compatible con mi lesión de hoy.

- Si activo «Evitar pendientes altas», Entrada → Biblioteca no usa `t7`. Si existe una alternativa, muestra sus escalones.
- Con máximo de 3 escalones y ambos accesos superiores cerrados, Sala A-201 → Patio central muestra que no hay ruta compatible. Si desactivo el límite, la opción vuelve con el aviso de 42 escalones de bajada.
- Los límites elegidos se ven al revisar el trayecto y se aplican también al recalcularlo por una barrera.

### HU-4 · Comunicar la continuidad de la guía táctil — alta · V1 y V5

Como Valentina, quiero saber en qué pasos hay guía táctil y dónde falta, para preparar una referencia alternativa.

- En el tramo Biblioteca → Baño accesible B el paso dice «con guía táctil». En la rampa Entrada → Biblioteca indica «sin guía táctil».
- Si el dato falta, se anuncia «guía táctil sin verificar». Un valor desconocido y un tramo sin guía se presentan con mensajes distintos.
- El estado se puede leer sin depender de color, iconos ni del plano.

### HU-5 · Escuchar los pasos del trayecto — media · V3

Como Valentina, quiero escuchar las instrucciones después de elegir un destino desde el QR, para continuar el viaje con la pantalla en segundo plano de mi atención.

- La lista de ruta ofrece reproducir, pausar y repetir un paso con controles etiquetados y operables por teclado.
- En el trayecto a la Sala A-201 por la escalera, la instrucción hablada dice que hay que subir 42 escalones. En el viaje inverso dice que hay que bajarlos.
- Si el equipo carece de voz en español, los pasos siguen disponibles en texto y el estado del control se explica.

### HU-6 · Confirmar el perfil desde el QR — media · V4 y V6

Como Valentina, quiero revisar qué perfil se aplicará al tocar «Llévame», para iniciar el trayecto con mis preferencias.

- En una sesión nueva, antes de calcular se ve el perfil propuesto y se puede elegir Baja visión conservando el origen y el destino del QR.
- Si ya guardé Baja visión, se conserva al pasar del QR a la ruta y puedo cambiarlo desde ese flujo.

### HU-7 · Retomar el trayecto después de reportar — media · E5

Como Elena, quiero volver al trayecto que estaba siguiendo después de publicar una barrera, para ver el desvío sin volver a introducir los datos.

- Desde Casino → Entrada principal en Estándar, al reportar y elegir «Ver en el mapa» vuelvo a ese origen, destino y perfil. Si el reporte afecta el trayecto, se muestra el recorrido recalculado.
- El acceso directo a `/reportar`, sin contexto de viaje, sigue permitiendo enviar un reporte.

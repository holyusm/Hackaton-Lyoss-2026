// Lógica pura para descartar respuestas fuera de orden o recibidas tras cancelar.
// Módulo ESM sin dependencias, importable desde Vite y desde pruebas en Node.

export function aceptarRespuesta(ultimaRespuesta, consulta, abortada = false) {
  if (abortada || consulta <= ultimaRespuesta) {
    return { aceptar: false, ultimaRespuesta };
  }
  return { aceptar: true, ultimaRespuesta: consulta };
}

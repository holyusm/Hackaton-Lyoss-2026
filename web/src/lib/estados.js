// Estados del sistema (Lote 7): textos exactos de docs/diseno/vistas/lote-7-estados/datos-ejemplo.json
// y ?estado=carga|error|sinconexion para forzar un estado en la demo o al probar.
const VALIDOS = ['carga', 'error', 'sinconexion'];

export function estadoForzado(search = globalThis.location?.search ?? '') {
  const e = new URLSearchParams(search).get('estado');
  return VALIDOS.includes(e) ? e : null;
}

export const horaCorta = (d) => (d ? new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Santiago' }) : '');
// "Ruta de las {hora}." con la hora de los datos. Sin hora, se quita la referencia.
export const conHora = (texto, d) => (d ? texto.replace('{hora}', horaCorta(d)) : texto.replace(/,? de las \{hora\}|,? a las \{hora\}| de las \{hora\}/g, ''));

export const TEXTOS = {
  bandaSinConexion: {
    inicio: 'Usando los lugares y barreras de las {hora}.',
    ruta: 'Ruta de las {hora}.',
    comparar: 'Mostrando la comparación de las {hora}.',
    reportar: 'Tu reporte se guarda y lo envías al volver.',
    punto: 'Puedes seguir escuchando lo que ya cargó.',
  },
  carga: {
    inicio: 'Cargando los lugares del campus.',
    ruta: 'Calculando tu ruta.',
    comparar: 'Comparando los cuatro perfiles.',
    reportar: 'Cargando las barreras activas.',
    punto: 'Cargando el punto.',
  },
  error: {
    inicio: { titulo: 'No pudimos cargar los lugares del campus.', texto: 'El servidor no respondió. Tu perfil sigue elegido.' },
    ruta: { titulo: 'No pudimos calcular tu ruta.', texto: 'El servidor no respondió. Tu perfil y tu destino siguen elegidos.', secundaria: 'Cambiar destino' },
    comparar: { titulo: 'No pudimos comparar los perfiles.', texto: 'El servidor no respondió. Vuelve a intentarlo en unos segundos.' },
    reportar: { titulo: 'No se pudo enviar tu reporte.', texto: 'El servidor no respondió. Lo que escribiste sigue aquí.', accion: 'Reintentar el envío' },
    punto: { titulo: 'No pudimos cargar este punto.', texto: 'El servidor no respondió. Inténtalo de nuevo o vuelve a escanear el código.', secundaria: 'Abrir el mapa del campus' },
  },
  sinConexion: {
    inicio: 'La ruta usará las barreras conocidas a las {hora}.',
    ruta: 'Es la última ruta conocida, de las {hora}. Puede haber barreras nuevas en el camino.',
    comparar: 'Datos de las {hora}. Se actualizan solos al volver la conexión.',
    reportarMotivo: 'Necesitas conexión para enviar. Tu reporte queda guardado en este teléfono.',
    reportarLista: 'a las {hora}',
  },
};

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const raiz = fileURLToPath(new URL('..', import.meta.url));

// Se lee en cada petición: si data/ cambia no hay que reiniciar.
export const leerDatos = async (archivo) => JSON.parse(await readFile(raiz + 'data/' + archivo, 'utf8'));

// Express 4 no captura promesas rechazadas: sin esto, un error en un manejador async tumba el proceso.
export const asincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

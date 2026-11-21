import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const raiz = fileURLToPath(new URL('..', import.meta.url));

// Se lee en cada petición: si data/ cambia no hay que reiniciar.
export const leerDatos = async (archivo) => JSON.parse(await readFile(raiz + 'data/' + archivo, 'utf8'));

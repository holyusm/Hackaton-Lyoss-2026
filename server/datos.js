import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const raiz = fileURLToPath(new URL('..', import.meta.url));

const rutaDatos = (archivo) =>
  (archivo === 'campus.json' && process.env.CAMPUS_PATH) || join(raiz, 'data', archivo);

// Se lee en cada petición: si data/ cambia no hay que reiniciar.
export const leerDatos = async (archivo) => JSON.parse(await readFile(rutaDatos(archivo), 'utf8'));
export const leerDatosSync = (archivo) => JSON.parse(readFileSync(rutaDatos(archivo), 'utf8'));

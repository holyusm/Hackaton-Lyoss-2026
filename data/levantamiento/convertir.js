// Convierte data/levantamiento/{nodos,tramos}.csv al formato de docs/contratos.md §1.
// Uso:  node data/levantamiento/convertir.js            (solo valida y muestra el resumen)
//       node data/levantamiento/convertir.js --escribir (valida y escribe data/campus.json)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = (f) => new URL(f, import.meta.url);
const TIPOS = ['entrada', 'edificio', 'sala', 'ascensor', 'bano', 'punto'];
const PENDIENTES = ['nula', 'baja', 'media', 'alta'];
const SUPERFICIES = ['lisa', 'irregular', 'adoquin'];
const COLUMNAS_NODOS = ['id', 'nombre', 'tipo', 'lat', 'lng', 'edificio', 'piso', 'descripcion'];
const COLUMNAS_TRAMOS = [
  'id', 'desde', 'hasta', 'metros', 'escalones', 'pendiente', 'rampa',
  'ascensor_id', 'techado', 'superficie', 'minutos_medidos', 'guia_tactil',
  'notas', 'foto', 'sentido_unico',
];

function csv(texto = '') {
  const filas = [];
  let fila = [], campo = '', q = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (q) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') q = false;
      else campo += c;
    } else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x.trim() !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x.trim() !== '')) filas.push(fila);
  if (!filas.length) return { cabeceras: [], filas: [] };
  const [cab, ...resto] = filas;
  const cabeceras = cab.map((k) => k.replace(/^\uFEFF/, '').trim());
  const registros = resto.map((f) => Object.fromEntries(cabeceras.map((k, i) => [k, (f[i] ?? '').trim()])));
  return { cabeceras, filas: registros };
}

function validarCabeceras(cabeceras, esperadas, archivo, err) {
  if (!cabeceras.length) return false;
  const normalizadas = cabeceras.map((c) => c.replace(/^\uFEFF/, '').trim());
  const presentes = new Set();
  const duplicadas = [];
  for (const c of normalizadas) {
    // Columnas sin nombre (comas de sobra al exportar desde una hoja de cálculo) no cuentan como duplicadas.
    if (c && presentes.has(c)) {
      if (!duplicadas.includes(c)) duplicadas.push(c);
    } else {
      presentes.add(c);
    }
  }
  let ok = true;
  if (duplicadas.length) {
    err(`${archivo}: columna${duplicadas.length > 1 ? 's duplicadas' : ' duplicada'}: ${duplicadas.join(', ')}`);
    ok = false;
  }
  const faltantes = esperadas.filter((c) => !presentes.has(c));
  if (faltantes.length) {
    err(`${archivo}: falta${faltantes.length > 1 ? 'n columnas obligatorias' : ' la columna obligatoria'}: ${faltantes.join(', ')}`);
    ok = false;
  }
  return ok;
}

export function num(v, campo, ctx, { entero = false, min = 0, err = () => {} } = {}) {
  const n = Number(String(v).replace(',', '.'));
  if (String(v).trim() === '' || !Number.isFinite(n)) {
    err(`${ctx}: ${campo} vacío, no numérico o no finito ("${v}")`);
    return 0;
  }
  if (entero && !Number.isInteger(n)) err(`${ctx}: ${campo} debe ser entero`);
  if (n < min) err(`${ctx}: ${campo} no puede ser menor que ${min}`);
  return n;
}
// Coordenada: número finito dentro de ±max, y aviso si cae lejos de Valparaíso.
const coord = (v, campo, ctx, max, err, avisos) => {
  const n = Number(String(v).replace(',', '.'));
  if (v === '' || !Number.isFinite(n)) { err(`${ctx}: ${campo} vacío o no numérico ("${v}")`); return 0; }
  if (n < -max || n > max) { err(`${ctx}: ${campo} fuera de rango (${n}); debe estar entre -${max} y ${max}`); return 0; }
  const [lo, hi] = campo === 'lat' ? [-33.2, -32.9] : [-71.8, -71.5];
  if (n < lo || n > hi) avisos.push(`${ctx}: ${campo} ${n} está lejos de Valparaíso (esperado entre ${lo} y ${hi}); revisa el signo y los decimales`);
  return n;
};
const bool = (v, campo, ctx, err) => {
  const s = String(v ?? '').toLowerCase();
  if (['si', 'sí', 's', 'true', '1'].includes(s)) return true;
  if (['no', 'n', 'false', '0', ''].includes(s)) return false;
  err(`${ctx}: ${campo} debe ser si/no ("${v}")`);
  return false;
};
const enumv = (v, campo, ctx, valores, err) => {
  if (!valores.includes(v)) err(`${ctx}: ${campo} "${v}" no es válido (${valores.join(' | ')})`);
  return v;
};

export function convertir(nodosCsv, tramosCsv, { existeFoto = (foto) => existsSync(aqui(`../${foto}`)) } = {}) {
  const errores = [];
  const avisos = [];
  const err = (m) => errores.push(m);

  const parsedNodos = csv(nodosCsv);
  const parsedTramos = csv(tramosCsv);

  const cabNodosOk = validarCabeceras(parsedNodos.cabeceras, COLUMNAS_NODOS, 'nodos.csv', err);
  if (!parsedNodos.filas.length) err('nodos.csv no contiene nodos');

  const nodos = cabNodosOk ? parsedNodos.filas.map((r) => {
    const ctx = `nodo ${r.id || '(sin id)'}`;
    if (!r.id) err(`${ctx}: falta id`);
    return {
      id: r.id, nombre: r.nombre, tipo: enumv(r.tipo, 'tipo', ctx, TIPOS, err),
      lat: coord(r.lat, 'lat', ctx, 90, err, avisos), lng: coord(r.lng, 'lng', ctx, 180, err, avisos),
      edificio: r.edificio, piso: num(r.piso, 'piso', ctx, { entero: true, min: -5, err }), descripcion: r.descripcion,
    };
  }) : [];
  const nodosPorId = new Map(nodos.map((n) => [n.id, n]));
  if (nodosPorId.size !== nodos.length) err('hay ids de nodo repetidos');

  const cabTramosOk = validarCabeceras(parsedTramos.cabeceras, COLUMNAS_TRAMOS, 'tramos.csv', err);
  if (!parsedTramos.filas.length) err('tramos.csv no contiene tramos');

  const tramos = cabTramosOk ? parsedTramos.filas.map((r) => {
    const ctx = `tramo ${r.id || '(sin id)'}`;
    if (!r.id) err(`${ctx}: falta id`);
    if (!nodosPorId.has(r.desde)) err(`${ctx}: desde "${r.desde}" no existe en nodos.csv`);
    if (!nodosPorId.has(r.hasta)) err(`${ctx}: hasta "${r.hasta}" no existe en nodos.csv`);
    const asc = r.ascensor_id || null;
    if (asc) {
      const nodoAsc = nodosPorId.get(asc);
      if (!nodoAsc) err(`${ctx}: ascensor_id "${asc}" no existe`);
      else if (nodoAsc.tipo !== 'ascensor') err(`${ctx}: ascensor_id "${asc}" no es un nodo tipo ascensor`);
    }
    const foto = r.foto || null;
    if (foto && !existeFoto(foto)) err(`${ctx}: la foto "${foto}" no está en data/`);
    return {
      id: r.id, desde: r.desde, hasta: r.hasta, metros: num(r.metros, 'metros', ctx, { err }),
      escalones: num(r.escalones, 'escalones', ctx, { entero: true, err }),
      pendiente: enumv(r.pendiente, 'pendiente', ctx, PENDIENTES, err), rampa: bool(r.rampa, 'rampa', ctx, err),
      ascensor_id: asc, techado: bool(r.techado, 'techado', ctx, err),
      superficie: enumv(r.superficie, 'superficie', ctx, SUPERFICIES, err),
      minutos_medidos: num(r.minutos_medidos, 'minutos_medidos', ctx, { err }), guia_tactil: bool(r.guia_tactil, 'guia_tactil', ctx, err),
      notas: r.notas, foto, sentido_unico: bool(r.sentido_unico, 'sentido_unico', ctx, err),
    };
  }) : [];
  if (new Set(tramos.map((t) => t.id)).size !== tramos.length) err('hay ids de tramo repetidos');

  // Conectividad: avisa de nodos aislados (ignora el sentido único).
  const vistos = new Set(nodos.length ? [nodos[0].id] : []);
  for (let cambio = true; cambio; ) {
    cambio = false;
    for (const t of tramos) {
      if (vistos.has(t.desde) !== vistos.has(t.hasta)) { vistos.add(t.desde); vistos.add(t.hasta); cambio = true; }
    }
  }
  const aislados = nodos.filter((n) => !vistos.has(n.id)).map((n) => n.id);

  return { nodos, tramos, errores, avisos, aislados };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { nodos, tramos, errores, avisos, aislados } = convertir(
    readFileSync(aqui('nodos.csv'), 'utf8'),
    readFileSync(aqui('tramos.csv'), 'utf8'),
  );
  console.log(`${nodos.length} nodos, ${tramos.length} tramos`);
  if (aislados.length) console.log(`AVISO: nodos sin conexión con el resto: ${aislados.join(', ')}`);
  for (const a of avisos) console.log(`AVISO: ${a}`);
  if (errores.length) {
    console.error(`\n${errores.length} error(es):\n- ${errores.join('\n- ')}`);
    process.exit(1);
  }
  if (process.argv.includes('--escribir')) {
    writeFileSync(aqui('../campus.json'), JSON.stringify({ nodos, tramos }, null, 2) + '\n');
    console.log('Escrito data/campus.json');
  } else console.log('Todo válido. Usa --escribir para generar data/campus.json');
}

// Convierte data/levantamiento/{nodos,tramos}.csv al formato de docs/contratos.md §1.
// Uso:  node data/levantamiento/convertir.js            (solo valida y muestra el resumen)
//       node data/levantamiento/convertir.js --escribir (valida y escribe data/campus.json)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const aqui = (f) => new URL(f, import.meta.url);
const TIPOS = ['entrada', 'edificio', 'sala', 'ascensor', 'bano', 'punto'];
const PENDIENTES = ['nula', 'baja', 'media', 'alta'];
const SUPERFICIES = ['lisa', 'irregular', 'adoquin'];

function csv(texto) {
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
  const [cab, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cab.map((k, i) => [k.trim(), (f[i] ?? '').trim()])));
}

const errores = [];
const err = (m) => errores.push(m);
const num = (v, campo, ctx, { entero = false, min = 0 } = {}) => {
  const n = Number(String(v).replace(',', '.'));
  if (v === '' || Number.isNaN(n)) { err(`${ctx}: ${campo} vacío o no numérico ("${v}")`); return 0; }
  if (entero && !Number.isInteger(n)) err(`${ctx}: ${campo} debe ser entero`);
  if (n < min) err(`${ctx}: ${campo} no puede ser menor que ${min}`);
  return n;
};
const bool = (v, campo, ctx) => {
  const s = v.toLowerCase();
  if (['si', 'sí', 's', 'true', '1'].includes(s)) return true;
  if (['no', 'n', 'false', '0', ''].includes(s)) return false;
  err(`${ctx}: ${campo} debe ser si/no ("${v}")`);
  return false;
};
const enumv = (v, campo, ctx, valores) => {
  if (!valores.includes(v)) err(`${ctx}: ${campo} "${v}" no es válido (${valores.join(' | ')})`);
  return v;
};

const nodos = csv(readFileSync(aqui('nodos.csv'), 'utf8')).map((r) => {
  const ctx = `nodo ${r.id || '(sin id)'}`;
  if (!r.id) err(`${ctx}: falta id`);
  return {
    id: r.id, nombre: r.nombre, tipo: enumv(r.tipo, 'tipo', ctx, TIPOS),
    lat: num(r.lat, 'lat', ctx, { min: -90 }), lng: num(r.lng, 'lng', ctx, { min: -180 }),
    edificio: r.edificio, piso: num(r.piso, 'piso', ctx, { entero: true, min: -5 }), descripcion: r.descripcion,
  };
});
const ids = new Set(nodos.map((n) => n.id));
if (ids.size !== nodos.length) err('hay ids de nodo repetidos');

const tramos = csv(readFileSync(aqui('tramos.csv'), 'utf8')).map((r) => {
  const ctx = `tramo ${r.id || '(sin id)'}`;
  if (!r.id) err(`${ctx}: falta id`);
  if (!ids.has(r.desde)) err(`${ctx}: desde "${r.desde}" no existe en nodos.csv`);
  if (!ids.has(r.hasta)) err(`${ctx}: hasta "${r.hasta}" no existe en nodos.csv`);
  const asc = r.ascensor_id || null;
  if (asc && !ids.has(asc)) err(`${ctx}: ascensor_id "${asc}" no existe`);
  if (asc && nodos.find((n) => n.id === asc)?.tipo !== 'ascensor') err(`${ctx}: ascensor_id "${asc}" no es un nodo tipo ascensor`);
  const foto = r.foto || null;
  if (foto && !existsSync(aqui(`../${foto}`))) err(`${ctx}: la foto "${foto}" no está en data/`);
  return {
    id: r.id, desde: r.desde, hasta: r.hasta, metros: num(r.metros, 'metros', ctx),
    escalones: num(r.escalones, 'escalones', ctx, { entero: true }),
    pendiente: enumv(r.pendiente, 'pendiente', ctx, PENDIENTES), rampa: bool(r.rampa, 'rampa', ctx),
    ascensor_id: asc, techado: bool(r.techado, 'techado', ctx),
    superficie: enumv(r.superficie, 'superficie', ctx, SUPERFICIES),
    minutos_medidos: num(r.minutos_medidos, 'minutos_medidos', ctx), guia_tactil: bool(r.guia_tactil, 'guia_tactil', ctx),
    notas: r.notas, foto, sentido_unico: bool(r.sentido_unico, 'sentido_unico', ctx),
  };
});
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

console.log(`${nodos.length} nodos, ${tramos.length} tramos`);
if (aislados.length) console.log(`AVISO: nodos sin conexión con el resto: ${aislados.join(', ')}`);
if (errores.length) {
  console.error(`\n${errores.length} error(es):\n- ${errores.join('\n- ')}`);
  process.exit(1);
}
if (process.argv.includes('--escribir')) {
  writeFileSync(aqui('../campus.json'), JSON.stringify({ nodos, tramos }, null, 2) + '\n');
  console.log('Escrito data/campus.json');
} else console.log('Todo válido. Usa --escribir para generar data/campus.json');

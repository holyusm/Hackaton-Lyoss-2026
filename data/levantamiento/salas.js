// Salas, baños y pisos interiores: fusiona data/levantamiento/salas.csv y edificios.csv con data/campus.json.
// Uso:  node data/levantamiento/salas.js            (valida y muestra el resumen)
//       node data/levantamiento/salas.js --escribir (valida y reescribe data/campus.json)
// Es idempotente: todo lo que genera lleva "generado": "salas" y se vuelve a crear en cada corrida; lo escrito a mano
// en campus.json no se toca. Después recalcula metros y minutos (motor/recalcular-metros.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { csv } from './convertir.js';
import { largoTramo, formatearCampus } from '../../motor/recalcular-metros.js';

const MARCA = 'salas';
const ESCALONES_POR_PISO = 20;
const COLUMNAS_SALAS = ['id', 'nombre', 'tipo', 'edificio', 'piso', 'departamento', 'lat', 'lng', 'notas'];
const COLUMNAS_EDIFICIOS = ['letra', 'entrada_lat', 'entrada_lng', 'conecta_a', 'ascensor', 'pisos'];
const GRADO_LAT = 1 / 111320; // ~1 m en latitud

const aNumero = (v) => (String(v ?? '').trim() === '' ? NaN : Number(String(v).replace(',', '.')));
const tramoBase = (id, desde, hasta) => ({
  id, desde, hasta, metros: 5, escalones: 0, pendiente: 'nula', rampa: false, ascensor_id: null, techado: true,
  superficie: 'lisa', minutos_medidos: 0.1, guia_tactil: false, notas: 'Interior simulado', foto: null, sentido_unico: false,
  trazado: [], generado: MARCA,
});

/**
 * @param base         campus.json ya parseado (con o sin lo generado antes)
 * @param salasCsv     texto de salas.csv
 * @param edificiosCsv texto de edificios.csv
 * @returns { grafo, errores, resumen }
 */
export function generarSalas(base, salasCsv, edificiosCsv) {
  const errores = [];
  const err = (m) => errores.push(m);
  const nodos = base.nodos.filter((n) => n.generado !== MARCA);
  const tramos = base.tramos.filter((t) => t.generado !== MARCA);
  const ids = new Set([...nodos.map((n) => n.id), ...tramos.map((t) => t.id)]);
  const nuevosNodos = [];
  const nuevosTramos = [];
  const nodo = (n) => {
    if (ids.has(n.id)) { err(`id repetido: ${n.id}`); return; }
    ids.add(n.id); nuevosNodos.push({ ...n, generado: MARCA });
  };
  const tramo = (t) => {
    if (ids.has(t.id)) { err(`id repetido: ${t.id}`); return; }
    ids.add(t.id); nuevosTramos.push(t);
  };

  const pe = csv(edificiosCsv, 'edificios.csv', err);
  const ps = csv(salasCsv, 'salas.csv', err);
  for (const [cols, p, nombre] of [[COLUMNAS_EDIFICIOS, pe, 'edificios.csv'], [COLUMNAS_SALAS, ps, 'salas.csv']]) {
    const faltan = cols.filter((c) => !p.cabeceras.includes(c));
    if (faltan.length) err(`${nombre}: faltan las columnas ${faltan.join(', ')}`);
  }
  if (errores.length) return { grafo: base, errores, resumen: {} };

  const existentes = new Map(nodos.map((n) => [n.id, n]));
  const resumen = { edificios: 0, salas: 0, banos: 0 };

  for (const e of pe.filas) {
    const letra = e.letra.toUpperCase();
    const ctx = `edificios.csv ${letra || '(sin letra)'}`;
    if (!/^[A-Z][A-Z0-9]*$/.test(letra)) { err(`${ctx}: letra inválida`); continue; }
    const lat = aNumero(e.entrada_lat), lng = aNumero(e.entrada_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { err(`${ctx}: entrada_lat y entrada_lng deben ser números`); continue; }
    if (!['si', 'no', 'por_levantar'].includes(e.ascensor)) { err(`${ctx}: ascensor debe ser si, no o por_levantar ("${e.ascensor}")`); continue; }
    const pisos = e.pisos.split(/[;|]/).map((x) => Number(x.trim())).filter((x) => Number.isInteger(x));
    if (!pisos.length || new Set(pisos).size !== pisos.length) { err(`${ctx}: pisos debe ser una lista de enteros distintos, p. ej. 1;2`); continue; }
    pisos.sort((a, b) => a - b);
    const minuscula = letra.toLowerCase();
    const conecta = existentes.get(e.conecta_a);
    if (!conecta) { err(`${ctx}: conecta_a "${e.conecta_a}" no existe en campus.json`); continue; }

    const salasDe = ps.filas.filter((s) => s.edificio.toUpperCase() === letra);
    const conCoord = salasDe.map((s) => [aNumero(s.lat), aNumero(s.lng)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    const centro = conCoord.length
      ? { lat: conCoord.reduce((s, c) => s + c[0], 0) / conCoord.length, lng: conCoord.reduce((s, c) => s + c[1], 0) / conCoord.length }
      : { lat, lng };

    // Entrada del edificio: si ya hay un nodo edificio-<x> escrito a mano se reutiliza.
    const idEdificio = `edificio-${minuscula}`;
    if (!existentes.has(idEdificio)) {
      nodo({ id: idEdificio, nombre: `Edificio ${letra}`, tipo: 'edificio', lat, lng, edificio: letra, piso: pisos[0], descripcion: `Acceso al Edificio ${letra}` });
    }

    // Un pasillo por piso, corrido un par de metros por piso para que no se tapen.
    const pasillo = (piso) => `${minuscula}-p${piso}`;
    pisos.forEach((piso, i) => nodo({
      id: pasillo(piso), nombre: `Pasillo del piso ${piso}, Edificio ${letra}`, tipo: 'punto', oculto: true,
      lat: Number((centro.lat + i * 2 * GRADO_LAT).toFixed(6)), lng: Number(centro.lng.toFixed(6)), edificio: letra, piso,
      descripcion: `Pasillo del piso ${piso} del Edificio ${letra} (simulado)`,
    }));

    tramo({ ...tramoBase(`${minuscula}-entrada`, idEdificio, pasillo(pisos[0])), notas: 'Interior simulado: de la puerta al pasillo del primer piso' });
    tramo({ ...tramoBase(`${minuscula}-acceso`, e.conecta_a, idEdificio), techado: false, superficie: 'lisa', notas: 'Acceso simulado al edificio', trazado: [] });

    // Escaleras entre pisos consecutivos.
    for (let i = 0; i < pisos.length - 1; i++) {
      const [a, b] = [pisos[i], pisos[i + 1]];
      tramo({ ...tramoBase(`${minuscula}-esc-${a}-${b}`, pasillo(a), pasillo(b)), escalones: ESCALONES_POR_PISO * (b - a), pendiente: 'alta', notas: 'Escalera simulada, 20 escalones por piso' });
    }
    // Ascensor: solo si el CSV lo dice. Sin él, silla de ruedas no llega a los pisos altos (eso es justo la barrera).
    if (e.ascensor === 'si' && pisos.length > 1) {
      const idAsc = `ascensor-${minuscula}`;
      nodo({ id: idAsc, nombre: `Ascensor ${letra}`, tipo: 'ascensor', lat: Number((centro.lat - 2 * GRADO_LAT).toFixed(6)), lng: Number(centro.lng.toFixed(6)), edificio: letra, piso: pisos[0], descripcion: `Ascensor del Edificio ${letra} (simulado)` });
      tramo({ ...tramoBase(`${minuscula}-asc-acceso`, pasillo(pisos[0]), idAsc), notas: 'Interior simulado' });
      for (const piso of pisos.slice(1)) {
        tramo({ ...tramoBase(`${minuscula}-asc-${piso}`, idAsc, pasillo(piso)), metros: 10, minutos_medidos: 1, ascensor_id: idAsc, notas: 'Ascensor simulado: conecta los pisos' });
      }
    }
    resumen.edificios += 1;
  }

  const letrasConEdificio = new Set(pe.filas.map((e) => e.letra.toUpperCase()));
  for (const s of ps.filas) {
    const ctx = `salas.csv ${s.id || '(sin id)'}`;
    if (!s.id) { err(`${ctx}: falta id`); continue; }
    if (!['sala', 'bano'].includes(s.tipo)) { err(`${ctx}: tipo debe ser sala o bano ("${s.tipo}")`); continue; }
    const letra = s.edificio.toUpperCase();
    if (!letrasConEdificio.has(letra)) { err(`${ctx}: el edificio "${s.edificio}" no está en edificios.csv`); continue; }
    const piso = Number(s.piso);
    const fila = pe.filas.find((e) => e.letra.toUpperCase() === letra);
    const pisosDe = fila.pisos.split(/[;|]/).map((x) => Number(x.trim()));
    if (!Number.isInteger(piso) || !pisosDe.includes(piso)) { err(`${ctx}: el piso ${s.piso} no está en los pisos de ${letra} (${fila.pisos})`); continue; }
    const centroPasillo = nuevosNodos.find((n) => n.id === `${letra.toLowerCase()}-p${piso}`);
    let lat = aNumero(s.lat), lng = aNumero(s.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      // Sin coordenadas: junto al pasillo del piso, repartidas en círculo para que no se tapen.
      const k = resumen.salas + resumen.banos;
      lat = centroPasillo.lat + 6 * GRADO_LAT * Math.sin(k * 2.4);
      lng = centroPasillo.lng + (6 * GRADO_LAT * Math.cos(k * 2.4)) / Math.cos((centroPasillo.lat * Math.PI) / 180);
    }
    nodo({
      id: s.id, nombre: s.nombre || s.id, tipo: s.tipo, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), edificio: letra, piso,
      descripcion: `${s.tipo === 'bano' ? 'Baño' : 'Sala'} del Edificio ${letra}, piso ${piso}${s.departamento ? `. ${s.departamento}` : ''}${s.notas ? ` (${s.notas})` : ''}`,
      ...(s.departamento ? { departamento: s.departamento } : {}),
    });
    tramo({ ...tramoBase(`${s.id}-pasillo`, `${letra.toLowerCase()}-p${piso}`, s.id), notas: 'Interior simulado: del pasillo a la puerta' });
    resumen[s.tipo === 'bano' ? 'banos' : 'salas'] += 1;
  }

  const grafo = { ...base, nodos: [...nodos, ...nuevosNodos], tramos: [...tramos, ...nuevosTramos] };
  // Metros y minutos de lo generado, con el largo real de cada línea.
  const porId = new Map(grafo.nodos.map((n) => [n.id, n]));
  grafo.tramos = grafo.tramos.map((t) => {
    if (t.generado !== MARCA) return t;
    const a = porId.get(t.desde), b = porId.get(t.hasta);
    if (!a || !b) { err(`tramo ${t.id}: ${!a ? t.desde : t.hasta} no existe`); return t; }
    if (t.ascensor_id) return t;
    const metros = Math.max(5, Math.round(largoTramo(t, a, b) / 5) * 5);
    return { ...t, metros, minutos_medidos: Math.round((metros / 72 + t.escalones * (2 / 60)) * 10) / 10 };
  });
  return { grafo, errores, resumen };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const aqui = (f) => new URL(f, import.meta.url);
  const base = JSON.parse(readFileSync(aqui('../campus.json'), 'utf8'));
  const { grafo, errores, resumen } = generarSalas(base, readFileSync(aqui('salas.csv'), 'utf8'), readFileSync(aqui('edificios.csv'), 'utf8'));
  if (errores.length) {
    console.error(`${errores.length} error(es):\n- ${errores.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`${resumen.edificios} edificio(s), ${resumen.salas} salas, ${resumen.banos} baños`);
  if (process.argv.includes('--escribir')) {
    writeFileSync(aqui('../campus.json'), formatearCampus(grafo));
    console.log('Escrito data/campus.json');
  } else console.log('Todo válido. Usa --escribir para actualizar data/campus.json');
}

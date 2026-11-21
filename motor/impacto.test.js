import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compararPerfiles } from './ruta.js';
import { filas, tablaMarkdown, resumen, informe } from './impacto.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const grafo = leer('campus.json');
const perfiles = leer('perfiles.json');

test('las filas coinciden con compararPerfiles para cada par', () => {
  const rows = filas(grafo, perfiles);
  assert.ok(rows.length >= 3);
  for (const f of rows) {
    assert.deepEqual(f.resultados, compararPerfiles(grafo, perfiles, { desde: f.desde, hasta: f.hasta, bloqueos: f.bloqueos }));
  }
});

test('la tabla muestra metros, minutos y escalones, o sin ruta accesible', () => {
  const rows = filas(grafo, perfiles);
  const tabla = tablaMarkdown(rows, perfiles);
  const r = compararPerfiles(grafo, perfiles, { desde: 'entrada-principal', hasta: 'sala-a201' }).estandar;
  assert.ok(tabla.includes(`${r.metros} m · ${String(r.minutos).replace('.', ',')} min · ${r.escalones} esc.`));
  assert.ok(tabla.includes('sin ruta accesible'));
  assert.equal(tabla.split('\n').length, rows.length + 2);
});

test('el resumen cuenta los pares imposibles en silla de ruedas', () => {
  const rows = filas(grafo, perfiles);
  const s = resumen(rows, 'silla_ruedas');
  const esperado = rows.filter((f) => !compararPerfiles(grafo, perfiles, { desde: f.desde, hasta: f.hasta, bloqueos: f.bloqueos }).silla_ruedas.ok);
  assert.equal(s.imposibles.length, esperado.length);
  assert.ok(s.imposibles.length >= 1);
});

test('el escenario con ascensor-a bloqueado alarga la ruta en silla de ruedas', () => {
  const [libre, bloqueado] = [
    filas(grafo, perfiles, [{ desde: 'entrada-principal', hasta: 'sala-a201' }])[0],
    filas(grafo, perfiles, [{ desde: 'entrada-principal', hasta: 'sala-a201', bloqueos: ['ascensor-a'] }])[0],
  ];
  assert.ok(bloqueado.resultados.silla_ruedas.metros > libre.resultados.silla_ruedas.metros);
});

test('el informe se arma sin errores', () => {
  assert.match(informe(), /Origen → destino/);
});

test('la tabla publicada para el pitch coincide con el grafo vigente', () => {
  const documento = readFileSync(new URL('../docs/levantamiento.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n'); // en Windows el checkout puede traer CRLF
  assert.ok(documento.includes(tablaMarkdown(filas(grafo, perfiles), perfiles)));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TIPOS_REPORTE, DURACIONES, validarReporte, cuerpoReporte, tituloReporte, lugarReporte, metaReporte, haceCuanto,
  ERROR_TIPO, ERROR_LUGAR,
} from './reportes.js';

const grafo = JSON.parse(readFileSync(new URL('../../../data/campus.json', import.meta.url), 'utf8'));
const TIPOS_CONTRATO = ['ascensor_fuera_servicio', 'obstaculo', 'rampa_bloqueada', 'piso_mojado', 'otro'];

test('los tipos del diseño se traducen a los del contrato', () => {
  assert.deepEqual(TIPOS_REPORTE.map((t) => t.tipo), TIPOS_CONTRATO);
  assert.deepEqual(TIPOS_REPORTE.map((t) => t.id), ['ascensor', 'obstaculo', 'rampa', 'mojado', 'otro']);
});

test('las duraciones llegan a 4 h, el máximo del servidor', () => {
  assert.deepEqual(DURACIONES.map((d) => d.minutos), [30, 60, 120, 240]);
});

test('validarReporte pide tipo y lugar, y borra cada error al corregirlo', () => {
  assert.deepEqual(validarReporte({}), { tipo: ERROR_TIPO, lugar: ERROR_LUGAR });
  assert.deepEqual(validarReporte({ tipo: 'ascensor' }), { lugar: ERROR_LUGAR });
  assert.deepEqual(validarReporte({ lugar: 'casino' }), { tipo: ERROR_TIPO });
  assert.deepEqual(validarReporte({ tipo: 'mojado', lugar: 'casino' }), {});
  assert.equal(validarReporte({ tipo: 'inventado', lugar: 'casino' }).tipo, ERROR_TIPO);
});

test('cuerpoReporte arma el body del contrato', () => {
  const b = cuerpoReporte({ tipo: 'ascensor', lugar: 'ascensor-a', detalle: '  No abre la puerta.  ', duracion: '4h' }, grafo);
  assert.deepEqual(b, { tipo: 'ascensor_fuera_servicio', nodo_id: 'ascensor-a', descripcion: 'No abre la puerta.', duracion_min: 240 });
});

test('sin detalle, la descripcion es el título armado', () => {
  assert.equal(cuerpoReporte({ tipo: 'ascensor', lugar: 'ascensor-a' }, grafo).descripcion, 'Ascensor A detenido');
  assert.equal(cuerpoReporte({ tipo: 'mojado', lugar: 'casino', detalle: '   ' }, grafo).descripcion, 'Piso mojado');
  assert.equal(cuerpoReporte({ tipo: 'mojado', lugar: 'casino' }, grafo).duracion_min, 120);
});

test('el título de un ascensor en un lugar que no es ascensor es el nombre del tipo', () => {
  assert.equal(tituloReporte({ tipo: 'ascensor_fuera_servicio', nodo_id: 'casino' }, grafo), 'Ascensor fuera de servicio');
  assert.equal(tituloReporte({ tipo: 'rampa_bloqueada', nodo_id: 'rampa-b' }, grafo), 'Rampa bloqueada');
});

test('el lugar sale del nodo, o del tramo si el reporte es de un tramo', () => {
  assert.equal(lugarReporte({ nodo_id: 'ascensor-a' }, grafo), 'Ascensor A');
  assert.equal(lugarReporte({ tramo_id: 't10' }, grafo), 'Entre Casino y Entrada principal');
  assert.equal(lugarReporte({ nodo_id: 'no-existe' }, grafo), 'Lugar del campus');
});

test('metaReporte dice hace cuánto y a qué hora vence, sin separadores raros', () => {
  const ahora = new Date('2026-11-21T15:12:00Z').getTime();
  const r = { creado: '2026-11-21T15:00:00Z', expira: '2026-11-21T17:00:00Z' };
  const m = metaReporte(r, ahora);
  assert.match(m, /^Reportado hace 12 min\. Vence a las \d{2}:\d{2}\.$/);
  assert.doesNotMatch(m, /[·—–]/);
});

test('haceCuanto: mínimo 1 min y pasa a horas', () => {
  const t0 = new Date('2026-11-21T15:00:00Z').getTime();
  assert.equal(haceCuanto('2026-11-21T15:00:00Z', t0), '1 min');
  assert.equal(haceCuanto('2026-11-21T14:00:00Z', t0), '1 h');
  assert.equal(haceCuanto('2026-11-21T13:55:00Z', t0), '1 h 5 min');
});

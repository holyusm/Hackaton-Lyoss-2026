import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR_DESDE, ERROR_HASTA, ERROR_IGUAL, validarViaje } from './validarViaje.js';

const IDS = ['entrada-principal', 'sala-a201', 'biblioteca'];

test('viaje válido con origen y destino distintos en el grafo', () => {
  const res = validarViaje({ desde: 'entrada-principal', hasta: 'sala-a201', cargando: false, ids: IDS });
  assert.deepEqual(res, { errorDesde: null, errorHasta: null, igual: false, motivo: null });
});

test('origen igual a destino bloquea con motivo aunque no se hayan tocado los campos', () => {
  const res = validarViaje({ desde: 'entrada-principal', hasta: 'entrada-principal', cargando: false, ids: new Set(IDS) });
  assert.deepEqual(res, { errorDesde: null, errorHasta: null, igual: true, motivo: ERROR_IGUAL });
});

test('hasta inexistente reporta errorHasta y bloquea la navegación', () => {
  const res = validarViaje({ desde: 'entrada-principal', hasta: 'sala-fantasma', cargando: false, ids: IDS });
  assert.deepEqual(res, { errorDesde: null, errorHasta: ERROR_HASTA, igual: false, motivo: ERROR_HASTA });
});

test('desde inexistente reporta errorDesde y tiene prioridad sobre sin destino o errorHasta', () => {
  const sinDestino = validarViaje({ desde: 'origen-fantasma', hasta: null, cargando: false, ids: IDS });
  assert.deepEqual(sinDestino, { errorDesde: ERROR_DESDE, errorHasta: null, igual: false, motivo: ERROR_DESDE });

  const ambosInvalidos = validarViaje({ desde: 'fantasma', hasta: 'fantasma', cargando: false, ids: IDS });
  assert.deepEqual(ambosInvalidos, { errorDesde: ERROR_DESDE, errorHasta: ERROR_HASTA, igual: true, motivo: ERROR_DESDE });
});

test('sin destino bloquea sin marcar errorHasta', () => {
  const res = validarViaje({ desde: 'entrada-principal', hasta: null, cargando: false, ids: IDS });
  assert.deepEqual(res, {
    errorDesde: null,
    errorHasta: null,
    igual: false,
    motivo: 'Elige a dónde vas para ver tu ruta.',
  });
});

test('mientras carga no marca errores de IDs y prioriza el motivo de carga', () => {
  const res = validarViaje({ desde: 'fantasma', hasta: 'fantasma', cargando: true, ids: null });
  assert.deepEqual(res, {
    errorDesde: null,
    errorHasta: null,
    igual: true,
    motivo: 'Cargando lugares del campus…',
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { nivelReporte, bloqueosDe } from './barreras.js';
import { calcularRuta } from './ruta.js';

const TIPOS = ['ascensor_fuera_servicio', 'obstaculo', 'rampa_bloqueada', 'piso_mojado', 'otro'];

const grafoPrueba = {
  nodos: [
    { id: 'a', nombre: 'Inicio' },
    { id: 'b', nombre: 'Destino' },
    { id: 'c', nombre: 'Desvío' },
  ],
  tramos: [
    {
      id: 't-directo', desde: 'a', hasta: 'b', metros: 20, escalones: 0,
      pendiente: 'nula', superficie: 'lisa', minutos_medidos: 0.5,
      guia_tactil: true, ascensor_id: null, sentido_unico: false,
    },
    {
      id: 't-desvio-1', desde: 'a', hasta: 'c', metros: 30, escalones: 0,
      pendiente: 'nula', superficie: 'lisa', minutos_medidos: 0.8,
      guia_tactil: true, ascensor_id: null, sentido_unico: false,
    },
    {
      id: 't-desvio-2', desde: 'c', hasta: 'b', metros: 30, escalones: 0,
      pendiente: 'nula', superficie: 'lisa', minutos_medidos: 0.8,
      guia_tactil: true, ascensor_id: null, sentido_unico: false,
    },
  ],
};

const perfilesPrueba = [
  { id: 'estandar', nombre: 'Estándar', prohibido: {}, costos: {} },
];

test('nivelReporte devuelve bloqueo para todos los tipos salvo piso_mojado, que es solo alerta', () => {
  for (const tipo of TIPOS) {
    assert.equal(nivelReporte({ tipo, tramo_id: 't-directo' }), tipo === 'piso_mojado' ? 'alerta' : 'bloqueo', `tipo ${tipo}`);
  }
});

test('bloqueosDe devuelve tramo_id o nodo_id de todos los reportes con nivel bloqueo', () => {
  const reportes = [
    { tipo: 'obstaculo', tramo_id: 't-directo', nodo_id: null },
    { tipo: 'piso_mojado', tramo_id: 't-desvio-1', nodo_id: null },
    { tipo: 'obstaculo', tramo_id: 't-desvio-2', nodo_id: null },
    { tipo: 'ascensor_fuera_servicio', tramo_id: null, nodo_id: 'ascensor-a' },
    { tipo: 'rampa_bloqueada', tramo_id: 't-rampa', nodo_id: null },
    { tipo: 'otro', tramo_id: null, nodo_id: 'c' },
  ];
  assert.deepEqual(bloqueosDe(reportes), ['t-directo', 't-desvio-2', 'ascensor-a', 't-rampa', 'c']);
});

test('un reporte obstaculo bloquea el tramo en el mapa y en calcularRuta', () => {
  const reporte = { tipo: 'obstaculo', tramo_id: 't-directo', nodo_id: null };
  assert.equal(nivelReporte(reporte), 'bloqueo');

  const sinBloqueos = calcularRuta(grafoPrueba, perfilesPrueba, { desde: 'a', hasta: 'b', perfil: 'estandar' });
  assert.deepEqual(sinBloqueos.tramos, ['t-directo']);

  const conBloqueo = calcularRuta(grafoPrueba, perfilesPrueba, {
    desde: 'a', hasta: 'b', perfil: 'estandar', bloqueos: bloqueosDe([reporte]),
  });
  assert.equal(conBloqueo.ok, true);
  assert.equal(conBloqueo.tramos.includes('t-directo'), false);
  assert.deepEqual(conBloqueo.tramos, ['t-desvio-1', 't-desvio-2']);
});

test('un reporte piso_mojado no bloquea: la ruta directa sigue y el destino no queda sin ruta', () => {
  const enTramo = { tipo: 'piso_mojado', tramo_id: 't-directo', nodo_id: null };
  const enDestino = { tipo: 'piso_mojado', tramo_id: null, nodo_id: 'b' };
  assert.equal(nivelReporte(enTramo), 'alerta');
  assert.deepEqual(bloqueosDe([enTramo, enDestino]), []);
  const r = calcularRuta(grafoPrueba, perfilesPrueba, {
    desde: 'a', hasta: 'b', perfil: 'estandar', bloqueos: bloqueosDe([enTramo, enDestino]),
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.tramos, ['t-directo']);
});

test('una barrera que bloquea (obstaculo) en el destino da un motivo que lo nombra', () => {
  const r = calcularRuta(grafoPrueba, perfilesPrueba, {
    desde: 'a', hasta: 'b', perfil: 'estandar', bloqueos: bloqueosDe([{ tipo: 'obstaculo', tramo_id: null, nodo_id: 'b' }]),
  });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'hay una barrera reportada en Destino');
});

test('bloquear por nodo_id con obstaculo evita ese nodo en calcularRuta', () => {
  const reportes = [
    { tipo: 'obstaculo', tramo_id: 't-directo', nodo_id: null },
    { tipo: 'obstaculo', tramo_id: null, nodo_id: 'c' },
  ];
  assert.deepEqual(bloqueosDe(reportes), ['t-directo', 'c']);
  const r = calcularRuta(grafoPrueba, perfilesPrueba, {
    desde: 'a', hasta: 'b', perfil: 'estandar', bloqueos: bloqueosDe(reportes),
  });
  assert.equal(r.ok, false);
});

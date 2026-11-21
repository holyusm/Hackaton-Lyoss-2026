import test from 'node:test';
import assert from 'node:assert/strict';
import { LETRAS, geojson } from '../plano/plano.js';
import { crearEdificios } from '../plano/edificios-lib.js';

function distanciaMetros([lat1, lng1], [lat2, lng2]) {
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lng2 - lng1) * 111320 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

const edificiosConLetra = crearEdificios(geojson).filter((e) => e.letra);
const porLetra = new Map(LETRAS.map((l) => [l.letra, l.latlng]));

test('los centros de LETRAS en plano.js coinciden con edificios-lib.js (< 0,5 m)', () => {
  assert.equal(LETRAS.length, edificiosConLetra.length, 'misma cantidad de edificios con letra');
  for (const edificio of edificiosConLetra) {
    const latlng = porLetra.get(edificio.letra);
    assert.ok(latlng, `falta la letra ${edificio.letra} en plano.js`);
    const dist = distanciaMetros(latlng, edificio.centro);
    assert.ok(dist < 0.5, `Edificio ${edificio.letra}: diferencia de ${dist.toFixed(2)} m`);
  }
});

test('la letra B (definida en EXTRA) aparece en las letras del plano', () => {
  const bPlano = porLetra.get('B');
  const bLib = edificiosConLetra.find((e) => e.letra === 'B');
  assert.ok(bPlano, 'la letra B debe estar en LETRAS');
  assert.ok(bLib, 'el Edificio B debe existir en edificios-lib');
  assert.ok(distanciaMetros(bPlano, bLib.centro) < 0.5);
});

// node --test server/*.test.js — levanta el servidor real y verifica que un reporte bloquea la ruta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let offsetPuerto = 0;

async function iniciarServidor(t, envExtra = {}) {
  const puerto = 3900 + ((process.pid + offsetPuerto++) % 90);
  const reportesPath = join(tmpdir(), `rutas-test-${process.pid}-${offsetPuerto}.json`);
  const srv = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: String(puerto), REPORTES_PATH: reportesPath, ...envExtra },
  });
  t.after(() => {
    srv.kill();
    rmSync(reportesPath, { force: true });
  });
  await new Promise((ok, err) => {
    srv.stdout.once('data', ok);
    srv.once('exit', (code) => err(new Error(`servidor terminó antes de escuchar (código ${code})`)));
  });
  return `http://localhost:${puerto}/api`;
}

const grafoRealConT6 = {
  nodos: [
    { id: 'n1', nombre: 'Entrada Real', tipo: 'entrada', lat: -33.034, lng: -71.595, edificio: 'A', piso: 0, descripcion: '' },
    { id: 'n2', nombre: 'Destino Real', tipo: 'edificio', lat: -33.035, lng: -71.596, edificio: 'B', piso: 0, descripcion: '' },
  ],
  tramos: [
    {
      id: 't6', desde: 'n1', hasta: 'n2', metros: 30, escalones: 0, pendiente: 'nula', rampa: true,
      ascensor_id: null, techado: false, superficie: 'lisa', minutos_medidos: 0.6, guia_tactil: true,
      notas: '', foto: null, sentido_unico: false,
    },
  ],
};

test('reportar el ascensor deja sin ruta a silla de ruedas', async (t) => {
  const api = await iniciarServidor(t);
  const ruta = () => fetch(`${api}/ruta?desde=entrada-principal&hasta=sala-a201&perfil=silla_ruedas`).then((r) => r.json());

  assert.equal((await ruta()).ok, true);
  const r = await fetch(`${api}/reportes`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tipo: 'ascensor_fuera_servicio', nodo_id: 'ascensor-a', descripcion: 'Detenido' }),
  }).then((r) => r.json());
  assert.equal((await ruta()).ok, false);
  assert.equal((await fetch(`${api}/comparar?desde=entrada-principal&hasta=sala-a201`).then((r) => r.json())).estandar.ok, true);

  await fetch(`${api}/reportes/${r.id}/resolver`, { method: 'POST' });
  assert.equal((await ruta()).ok, true);
  assert.equal((await fetch(`${api}/ruta?desde=x`)).status, 400);
  assert.equal((await fetch(`${api}/puntos/no-existe`)).status, 404);
});

test('grafo real con t6 arranca sin ejemplos y no bloquea la ruta de silla de ruedas', async (t) => {
  const campusPath = join(tmpdir(), `campus-real-${process.pid}.json`);
  writeFileSync(campusPath, JSON.stringify(grafoRealConT6, null, 2));
  t.after(() => rmSync(campusPath, { force: true }));

  const api = await iniciarServidor(t, { CAMPUS_PATH: campusPath });
  const reportes = await fetch(`${api}/reportes`).then((r) => r.json());
  assert.deepEqual(reportes, []);

  const ruta = await fetch(`${api}/ruta?desde=n1&hasta=n2&perfil=silla_ruedas`).then((r) => r.json());
  assert.equal(ruta.ok, true);
  assert.deepEqual(ruta.tramos, ['t6']);
});

test('grafo simulado con t6 precarga los ejemplos de demo', async (t) => {
  const campusPath = join(tmpdir(), `campus-simulado-${process.pid}.json`);
  writeFileSync(campusPath, JSON.stringify({ simulado: true, ...grafoRealConT6 }, null, 2));
  t.after(() => rmSync(campusPath, { force: true }));

  const api = await iniciarServidor(t, { CAMPUS_PATH: campusPath });
  const reportes = await fetch(`${api}/reportes`).then((r) => r.json());
  assert.ok(reportes.length > 0, 'precarga ejemplos cuando simulado === true');
  assert.ok(reportes.some((r) => r.tramo_id === 't6' && r.ejemplo === true));

  const ruta = await fetch(`${api}/ruta?desde=n1&hasta=n2&perfil=silla_ruedas`).then((r) => r.json());
  assert.equal(ruta.ok, false);
});

test('archivo persistido con ejemplo en t6 y reporte real: grafo real descarta el ejemplo y libera t6; simulado conserva ambos', async (t) => {
  const campusRealPath = join(tmpdir(), `campus-real-pers-${process.pid}.json`);
  const campusSimPath = join(tmpdir(), `campus-sim-pers-${process.pid}.json`);
  const reportesPath = join(tmpdir(), `reportes-pers-${process.pid}.json`);
  const ahora = new Date().toISOString();
  const expira = new Date(Date.now() + 60 * 60_000).toISOString();

  writeFileSync(campusRealPath, JSON.stringify(grafoRealConT6, null, 2));
  writeFileSync(campusSimPath, JSON.stringify({ simulado: true, ...grafoRealConT6 }, null, 2));
  writeFileSync(reportesPath, JSON.stringify([
    { id: 'r1', tipo: 'obstaculo', tramo_id: 't6', nodo_id: null, descripcion: 'Andamio ficticio', creado: ahora, expira, resuelto: false, ejemplo: true },
    { id: 'r3', tipo: 'piso_mojado', tramo_id: 't99', nodo_id: null, descripcion: 'Reporte real', creado: ahora, expira, resuelto: false },
  ], null, 2));
  t.after(() => {
    rmSync(campusRealPath, { force: true });
    rmSync(campusSimPath, { force: true });
    rmSync(reportesPath, { force: true });
  });

  const apiReal = await iniciarServidor(t, { CAMPUS_PATH: campusRealPath, REPORTES_PATH: reportesPath });
  const reportesReal = await fetch(`${apiReal}/reportes`).then((r) => r.json());
  assert.deepEqual(reportesReal.map((r) => r.id), ['r3']);
  const rutaReal = await fetch(`${apiReal}/ruta?desde=n1&hasta=n2&perfil=silla_ruedas`).then((r) => r.json());
  assert.equal(rutaReal.ok, true);
  assert.deepEqual(rutaReal.tramos, ['t6']);

  const apiSim = await iniciarServidor(t, { CAMPUS_PATH: campusSimPath, REPORTES_PATH: reportesPath });
  const reportesSim = await fetch(`${apiSim}/reportes`).then((r) => r.json());
  assert.deepEqual(reportesSim.map((r) => r.id), ['r1', 'r3']);
});

// node --test server/*.test.js: el servidor arranca aunque el archivo de reportes esté dañado (#91).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'reportes-archivo-'));

async function arrancarCon(contenido, t) {
  const archivo = join(dir, `${Math.random()}.json`);
  writeFileSync(archivo, contenido);
  const puerto = 3800 + Math.floor(Math.random() * 90);
  const srv = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: puerto, REPORTES_PATH: archivo } });
  t.after(() => srv.kill());
  await new Promise((ok, mal) => { srv.stdout.once('data', ok); srv.once('exit', (c) => mal(new Error(`el servidor salió con ${c}`))); });
  return fetch(`http://localhost:${puerto}/api/reportes`);
}

test('arranca con {} en el archivo de reportes', async (t) => {
  const r = await arrancarCon('{}', t);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(await r.json()));
});

test('arranca con entradas inválidas y conserva las válidas', async (t) => {
  const buena = { id: 'r7', tipo: 'obstaculo', tramo_id: 't1', nodo_id: null, descripcion: 'x',
    creado: new Date().toISOString(), expira: new Date(Date.now() + 3600e3).toISOString(), resuelto: false };
  const r = await arrancarCon(JSON.stringify([null, 3, { id: 5 }, { id: 'r9' }, buena]), t);
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).map((x) => x.id), ['r7']);
});

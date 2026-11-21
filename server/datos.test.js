// node --test server/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { asincrono } from './datos.js';

test('un error en un manejador async responde 500 y no tumba el servidor', async (t) => {
  const app = express();
  app.get('/falla', asincrono(async () => { [].x.y; }));
  app.get('/ok', (req, res) => res.json({ ok: true }));
  app.use((err, req, res, next) => res.status(500).json({ error: 'error interno' }));
  const servidor = app.listen(0);
  t.after(() => { servidor.closeAllConnections(); servidor.close(); });
  const base = `http://localhost:${servidor.address().port}`;

  const r = await fetch(`${base}/falla`, { signal: AbortSignal.timeout(2000) });
  assert.equal(r.status, 500);
  assert.equal((await fetch(`${base}/ok`)).status, 200);
});

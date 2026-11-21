// npm run qr — un PNG por punto de data/puntos.json en docs/qr/, apuntando a <BASE_URL>/punto/<id>.
// BASE_URL=http://192.168.x.x:3000 npm run qr  para probar con el celular en la red local.
import QRCode from 'qrcode';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const base = (process.env.BASE_URL || 'https://hackaton-lyoss-2026.onrender.com').replace(/\/$/, '');
const puntos = JSON.parse(readFileSync('data/puntos.json', 'utf8'));
mkdirSync('docs/qr', { recursive: true });

const filas = [];
for (const p of puntos) {
  const url = `${base}/punto/${encodeURIComponent(p.id)}`;
  await QRCode.toFile(`docs/qr/${p.id}.png`, url, { width: 1200, margin: 4, errorCorrectionLevel: 'H' });
  filas.push(`## ${p.titulo}\n\n![QR ${p.titulo}](${p.id}.png)\n\n${url}\n`);
  console.log(`docs/qr/${p.id}.png → ${url}`);
}

// Hoja para imprimir: GitHub la muestra con cada QR y su nombre.
writeFileSync('docs/qr/README.md', `# Códigos QR de los puntos\n\nGenerados con \`npm run qr\` (BASE_URL=${base}).\n\n${filas.join('\n')}`);

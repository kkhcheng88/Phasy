// Serves the teaching-without-video prototype (ticket 13).
// Usage: node server.mjs [--port 8772]
// Reuses session-flow/library.json and 3d-muscle-view models; does not copy them.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const pi = process.argv.indexOf('--port');
const PORT = pi > 0 ? Number(process.argv[pi + 1]) : 8772;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/octet-stream', '.glb': 'model/gltf-binary',
};

const ALIASES = {
  '/library.json': path.resolve(ROOT, '../session-flow/library.json'),
  '/model/body-low.wasm': path.resolve(ROOT, '../3d-muscle-view/body-low.wasm'),
  '/model/body.wasm': path.resolve(ROOT, '../3d-muscle-view/body.wasm'),
};

const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
    const alias = ALIASES[url.pathname];
    let file = alias ?? path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (!alias && file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'forbidden');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return send(res, 404, 'not found');
    send(res, 200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  } catch (e) {
    send(res, 500, String(e.message || e));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Phasy teaching-without-video prototype — open on the phone (same Wi-Fi):');
  const rank = ip => (ip.startsWith('192.168.') ? 0 : ip.startsWith('169.254.') ? 2 : 1);
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(a => a && a.family === 'IPv4' && !a.internal).map(a => a.address).sort((x, y) => rank(x) - rank(y));
  ips.forEach((ip, i) => console.log(`  http://${ip}:${PORT}/${i === 0 ? '   <- try this first' : ''}`));
  console.log(`  http://localhost:${PORT}/  (this PC)`);
});

// server.mjs — serves the Session prototype to phones on the home Wi-Fi and saves Session logs.
// Usage: node server.mjs [--port 8770] [--mock]
//   --mock  also serves a fake OpenAI-compatible endpoint at /mock/chat/completions (tests only).
//           Flags: GET /mock/flags?unknownId=1&rejectEffort=1&badJsonOnce=1&extraCheck=<id>&extraItem=<id,id>
//                  &checkSeq=<id|side,id|side> (n-th next_check reply, by checks done)&slowTask=<task>&slowMs=<ms>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(ROOT, '../../.scratch/phasy/session-logs');
const MOCK = process.argv.includes('--mock');
const pi = process.argv.indexOf('--port');
const PORT = pi > 0 ? Number(process.argv[pi + 1]) : 8770;
const MAX_LOG = 2 * 1024 * 1024;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function saveLog(req, res) {
  let text;
  try { text = await readBody(req, MAX_LOG); } catch { return send(res, 413, { ok: false, error: 'log larger than 2 MB' }); }
  let data;
  try { data = JSON.parse(text); } catch { return send(res, 400, { ok: false, error: 'not JSON' }); }
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const base = stamp() + (MOCK ? '-mock' : '');
  let name = base + '.json';
  for (let i = 2; fs.existsSync(path.join(LOG_DIR, name)); i++) name = `${base}-${i}.json`;
  fs.writeFileSync(path.join(LOG_DIR, name), JSON.stringify(data, null, 2), 'utf8');
  console.log('saved log', name);
  send(res, 200, { ok: true, file: name });
}

// ---------- fake LLM for tests: canned replies per step, built from the ids the app offers

let flags = {};
function mockContent(body) {
  let u;
  try { u = JSON.parse(body.messages.at(-1).content); } catch { return '{}'; }
  const d = u.data ?? {};
  const side0 = d.complaint?.sides?.[0] ?? '右';
  switch (u.task) {
    case 'ping': return { ok: true };
    case 'map_situation': return { situations: [d.situations[0].id], reading: `受助者描述的情況最接近「${d.situations[0].name}」。` };
    case 'pick_test': return { test: d.tests[0].id, reason: '這個動作最能測試不適的位置。' };
    case 'follow_up': return { question: ['這種攰通常在一天中甚麼時候最明顯？', '最近有沒有比平時多用電腦或手機？'][d.asked.length] ?? null };
    case 'rank_candidates': return {
      ranking: d.candidates.map(c => ({ muscle: c.muscle, side: c.side, reason: `${c.name}的牽涉痛範圍與不適位置相近。` })),
      added: [
        ...(d.others[0] ? [{ muscle: d.others[0].muscle, side: side0, reason: '這條肌肉也常與肩頸攰有關。' }] : []),
        ...(flags.unknownId ? [{ muscle: 'm-not-in-library', side: side0, reason: '測試用的未知肌肉。' }] : []),
      ],
    };
    case 'next_check':
      if (flags.unknownId) return { check: 'c-not-in-library', side: side0, reason: 'c-not-in-library 最可疑。', stop: false };
      if (flags.extraCheck) return { check: flags.extraCheck, side: side0, reason: '先查這一個。', stop: false };
      if (flags.checkSeq) {
        const e = flags.checkSeq.split(',')[d.checksDone];
        if (e) { const [check, side] = e.split('|'); return { check, side, reason: '按測試次序，查這一個。', stop: false }; }
      }
      return { check: d.allowed[0].check, side: d.allowed[0].side, reason: `${d.allowed[0].name}排在最前。`, stop: false };
    case 'plan': return {
      items: [
        ...d.allowed.map(a => ({ id: a.id, reason: `這一項適合${a.muscle}。` })),
        ...String(flags.extraItem ?? '').split(',').filter(Boolean).map(id => ({ id, reason: '也可以做這一項。' })),
        ...(flags.unknownId ? [{ id: 'st-not-in-library', reason: '測試用的未知項目。' }] : []),
      ],
    };
    case 'summary': return { summary: '今次找到與平時那種痛有關的肌肉，並做了處理。處理後再檢查，測試動作的分數有變化。下次可以再比較。' };
    default: return {};
  }
}

async function mockChat(req, res) {
  if (!/^Bearer \S+/.test(req.headers.authorization ?? '')) return send(res, 401, { error: { message: 'missing key' } });
  const body = JSON.parse(await readBody(req, MAX_LOG));
  if (flags.slowTask && body.messages?.at(-1)?.content?.includes(`"task":"${flags.slowTask}"`)) {
    await new Promise(r => setTimeout(r, Number(flags.slowMs) || 20000));
    if (res.destroyed || res.socket?.destroyed) return; // the app gave up waiting
  }
  if (flags.rejectEffort && 'reasoning_effort' in body)
    return send(res, 400, { error: { message: 'Unrecognized request argument supplied: reasoning_effort', type: 'invalid_request_error', param: 'reasoning_effort' } });
  let content;
  if (flags.badJsonOnce) { flags.badJsonOnce = false; content = '這不是 JSON {'; }
  else { const c = mockContent(body); content = typeof c === 'string' ? c : JSON.stringify(c); }
  send(res, 200, { id: 'mock', object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: body.model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
}

// ---------- server

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && url.pathname === '/log') return await saveLog(req, res);
    if (MOCK && url.pathname === '/mock/flags') { flags = Object.fromEntries(url.searchParams); return send(res, 200, flags); }
    if (MOCK && req.method === 'POST' && url.pathname === '/mock/chat/completions') return await mockChat(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
    let file = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'forbidden', 'text/plain');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Phasy session prototype${MOCK ? ' (mock LLM on)' : ''} - open on the phone (same Wi-Fi):`);
  // Home Wi-Fi addresses (192.168.x) first; link-local (169.254) and VPN / virtual adapters last.
  const rank = (ip) => ip.startsWith('192.168.') ? 0 : ip.startsWith('169.254.') ? 2 : 1;
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address).sort((x, y) => rank(x) - rank(y));
  ips.forEach((ip, i) => console.log(`  http://${ip}:${PORT}/${i === 0 ? '   <- try this first' : ''}`));
  console.log(`  http://localhost:${PORT}/  (this PC)`);
  console.log(`Session logs -> ${LOG_DIR}`);
});

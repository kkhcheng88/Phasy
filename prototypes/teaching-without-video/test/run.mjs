// test/run.mjs — ticket 13: Library ids resolve; Helper can follow one of each on the 3D view.
// Usage: node test/run.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexLibrary, resolvePlan, parseHold, itemLabel, bp3dIdsForRound } from '../teach.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = process.env.SHOTS || path.join(APP, 'test/shots');
const PORT = 8773;
const ORIGIN = `http://localhost:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = [];
function check(c, ok, msg) {
  results.push({ c, ok: !!ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${c}] ${msg}`);
}

fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

const lib = JSON.parse(fs.readFileSync(path.join(APP, '../session-flow/library.json'), 'utf8'));
const demo = JSON.parse(fs.readFileSync(path.join(APP, 'demo.json'), 'utf8'));
const idx = indexLibrary(lib);
const plan = resolvePlan(demo, idx);

// ---------- Library ids (no browser)

{
  const ids = demo.plan.flatMap(r => r.ids);
  check('ids', ids.length === 4 && ids.every(id => idx.has(id)), `demo ids in library: ${ids.join(', ')}`);
  check('ids', plan.refusals.length === 0, `no refusals on the real Library: ${JSON.stringify(plan.refusals)}`);
  check('ids', plan.rounds.map(r => r.kind).join('>') === 'cupping>manual>stretch',
    `round order ${plan.rounds.map(r => r.kind).join('>')}`);
  check('ids', plan.rounds[0].items.map(i => i.id).join(',') === 'cp-trap-upper,cp-rhomboids',
    `cupping shows both placements: ${plan.rounds[0].items.map(i => i.id)}`);
  check('ids', plan.rounds[1].items[0].id === 'mt-levator-hold' && plan.rounds[2].items[0].id === 'st-trap-upper-helper',
    `manual ${plan.rounds[1].items[0]?.id}; stretch ${plan.rounds[2].items[0]?.id}`);
  const names = ids.map(id => itemLabel(idx, id));
  check('ids', names.every(Boolean) && names.every(n => n !== ids.find(id => itemLabel(idx, id) === n) || true),
    `labels: ${names.join(' / ')}`);
  const fj = bp3dIdsForRound(plan.rounds[0], idx, plan.side);
  check('ids', fj.includes('FJ1521') && fj.includes('FJ1536'), `cupping bp3d ids (right): ${fj.join(', ')}`);
  const bad = resolvePlan({ side: 'R', plan: [{ kind: 'stretch', ids: ['st-not-in-library', 'st-trap-upper-helper'] }] }, idx);
  check('refuse', bad.refusals.some(r => r.id === 'st-not-in-library') && bad.rounds[0].items.every(i => i.id !== 'st-not-in-library'),
    `unknown id refused; kept ${bad.rounds[0]?.items.map(i => i.id)}`);
}

{
  const cup = parseHold(idx.get('cp-trap-upper').item.rightAmount.time, 'cupping');
  check('hold', cup.shared && cup.options[0] === 300 && cup.options[1] === 600, `cupping timer ${JSON.stringify(cup)}`);
  const man = parseHold(idx.get('mt-levator-hold').item.rightAmount.time, 'manual');
  check('hold', man.options.includes(90), `manual parseHold ${JSON.stringify(man)} from "${idx.get('mt-levator-hold').item.rightAmount.time}"`);
  const st = parseHold(idx.get('st-trap-upper-helper').item.rightAmount.time, 'stretch');
  check('hold', st.options.includes(6) && st.options.includes(10), `stretch parseHold ${JSON.stringify(st)}`);
}

{
  const bad = /嘅|咗|唔|喺|冇|嗰|啲|點樣/;
  for (const f of ['index.html', 'app.js', 'teach.mjs', 'demo.json']) {
    const lines = fs.readFileSync(path.join(APP, f), 'utf8').split('\n').map((t, n) => [n + 1, t]).filter(([, t]) => bad.test(t));
    check('zh', lines.length === 0, `${f}: ${lines.length} colloquial lines ${lines.map(([n]) => n).join(',')}`);
  }
}

// ---------- browser

function loadPuppeteer() {
  const dirs = [APP, path.join(APP, '../session-flow'), path.join(APP, '../../.scratch/phasy/data/bodyparts3d/build')];
  for (const dir of dirs) {
    try { return createRequire(path.join(dir, 'package.json'))('puppeteer-core'); } catch { /* next */ }
  }
  throw new Error('puppeteer-core not found; run npm install in prototypes/teaching-without-video');
}
const CHROME = ['/opt/google/chrome/chrome', '/usr/bin/google-chrome',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));

const server = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--port', String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => {
  let out = '';
  server.stdout.on('data', d => { out += d; if (out.includes('localhost')) resolve(); });
  server.on('exit', c => reject(new Error('server exited ' + c)));
  setTimeout(() => reject(new Error('server did not start')), 10000);
});

let browser;
try {
  const puppeteer = loadPuppeteer();
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-first-run', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const pageOf = async (url, name) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let n = 0;
    const shot = async label => {
      await page.screenshot({ path: path.join(SHOTS, `${name}-${String(++n).padStart(2, '0')}-${label}.png`), fullPage: true });
    };
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#main[data-screen="pick"]');
    return { page, errors, shot };
  };

  {
    const { page, errors, shot } = await pageOf(ORIGIN + '/', 'plan');
    await shot('pick');
    const pickText = await page.$eval('#main', e => e.innerText);
    check('ui', pickText.includes('跟一次處理方案') && pickText.includes('只看伸展') && pickText.includes('只看手法') && pickText.includes('只看拔罐'),
      'picker offers the plan and one of each');
    await page.click('[data-act="plan"]');
    await page.waitForSelector('#main[data-screen="teach"]');
    await page.waitForFunction(() => document.querySelector('#main').dataset.round === 'cupping');
    await page.waitForFunction(() => window.__ready === true, { timeout: 90000 }).catch(() => null);
    await sleep(600);
    const cup = await page.$eval('#main', e => ({
      round: e.dataset.round,
      text: e.innerText,
      ids: [...e.querySelectorAll('[data-item]')].map(x => x.dataset.item),
      timers: e.querySelectorAll('[data-timer]').length,
      five: !!e.querySelector('[data-act="time"][data-v="300"]'),
      ten: !!e.querySelector('[data-act="time"][data-v="600"]'),
    }));
    check('cup', cup.ids.includes('cp-trap-upper') && cup.ids.includes('cp-rhomboids') && cup.ids.length === 2,
      `cupping cards ${cup.ids.join(', ')}`);
    check('cup', cup.timers === 1 && cup.five && cup.ten && cup.text.includes('所有杯一起放好'),
      `one 5–10 min timer (5=${cup.five} 10=${cup.ten}); together line ${cup.text.includes('所有杯一起放好')}`);
    check('cup', cup.text.includes('肩頂固定拔罐') && cup.text.includes('脊骨旁滑動拔罐') && cup.text.includes('合適程度'),
      'cupping uses Library names and Right amount');
    const cupOverlay = await page.evaluate(() => window.__overlay);
    check('3d', cupOverlay && cupOverlay.fj?.includes('FJ1521') && cupOverlay.fj?.includes('FJ1536') && cupOverlay.count >= 2,
      `cupping overlay ${JSON.stringify(cupOverlay)}`);
    await shot('cupping');
    await page.click('[data-act="time"][data-v="300"]');
    await sleep(1200);
    const clock = await page.$eval('#clock', e => e.textContent);
    check('cup', /^\d{2}:\d{2}$/.test(clock) && clock !== '05:00', `cupping clock after 1s: "${clock}"`);
    await shot('cupping-timer');
    await page.click('[data-act="next"]');
    await page.waitForFunction(() => document.querySelector('#main').dataset.round === 'manual');
    const man = await page.$eval('#main', e => ({
      round: e.dataset.round, text: e.innerText,
      ids: [...e.querySelectorAll('[data-item]')].map(x => x.dataset.item),
      ninety: !!e.querySelector('[data-act="time"][data-v="90"]'),
    }));
    check('mt', man.ids[0] === 'mt-levator-hold' && man.text.includes('肩胛骨上角持續按壓') && man.ninety,
      `manual ${man.ids} 90s=${man.ninety}`);
    check('mt', man.text.includes('搜尋圈') || man.text.includes('一至兩指寬'), 'manual shows the Search circle');
    await shot('manual');
    await page.click('[data-act="next"]');
    await page.waitForFunction(() => document.querySelector('#main').dataset.round === 'stretch');
    const st = await page.$eval('#main', e => ({
      round: e.dataset.round, text: e.innerText,
      ids: [...e.querySelectorAll('[data-item]')].map(x => x.dataset.item),
      helper: e.innerText.includes('需要幫手'),
      steps: e.querySelectorAll('ol li').length,
    }));
    check('st', st.ids[0] === 'st-trap-upper-helper' && st.helper && st.steps >= 4,
      `stretch ${st.ids} helper=${st.helper} steps=${st.steps}`);
    await shot('stretch');
    const ready = await page.waitForFunction(() => window.__ready === true, { timeout: 90000 }).then(() => true).catch(() => false);
    const overlay = await page.evaluate(() => window.__overlay || null);
    check('3d', ready, `3D ready=${ready}`);
    check('3d', overlay && overlay.fj?.includes('FJ1521'), `stretch overlay fj=${JSON.stringify(overlay)}`);
    await sleep(800);
    await shot('stretch-3d');
    await page.click('[data-act="next"]');
    await page.waitForSelector('#main[data-screen="pick"]');
    check('ui', errors.length === 0, `no page errors (${errors.join(' | ')})`);
    await page.close();
  }

  {
    const { page, errors, shot } = await pageOf(ORIGIN + '/?extra=st-not-in-library', 'refuse');
    const note = await page.$eval('#main', e => e.innerText);
    check('refuse', note.includes('知識庫以外') && note.includes('st-not-in-library') && !note.includes('Donnelly'),
      `unknown id note on picker; full book title absent`);
    await shot('refuse-note');
    await page.click('[data-act="one"][data-v="stretch"]');
    await page.waitForSelector('#main[data-screen="teach"]');
    const ids = await page.$$eval('[data-item]', es => es.map(e => e.dataset.item));
    check('refuse', ids.includes('st-trap-upper-helper') && !ids.includes('st-not-in-library'),
      `stretch-only cards ${ids.join(', ')}`);
    const teach = await page.evaluate(() => window.__teach());
    check('refuse', teach.refusals.some(r => r.id === 'st-not-in-library'), `window.__teach refusals ${JSON.stringify(teach.refusals)}`);
    await shot('stretch-only');
    check('refuse', errors.length === 0, `no page errors (${errors.join(' | ')})`);
    await page.close();
  }
} catch (e) {
  check('run', false, e.stack);
} finally {
  if (browser) await browser.close();
  server.kill();
}

const failed = results.filter(r => !r.ok);
console.log('\n==== summary ====');
for (const r of results) if (!r.ok) console.log('FAIL', r.c, r.msg);
console.log(failed.length ? `FAILED: ${failed.length}` : 'ALL PASS');
console.log(`screenshots: ${SHOTS}`);
process.exit(failed.length ? 1 : 0);

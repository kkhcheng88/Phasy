// test/run.mjs — end-to-end check of the Session prototype: headless Edge + the mock LLM in server.mjs.
// Usage: node test/run.mjs [--real]
// Runs Sessions A–D, F–H against test/library.stub.json (acceptance criteria 1–8 plus the 2026-09-24 rules).
// With --real, and if check-library.mjs passes, one more mock Session (E) against the real library.json.
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadPuppeteer() {
  const dirs = [
    'C:/projects/Phasy/.scratch/phasy/data/bodyparts3d/build/',
    path.join(APP, '../../.scratch/phasy/data/bodyparts3d/build/'),
    path.join(APP, '../teaching-without-video/'),
  ];
  for (const dir of dirs) {
    try { return createRequire(path.join(dir, 'package.json'))('puppeteer-core'); } catch { /* next */ }
  }
  return createRequire('C:/projects/Phasy/.scratch/phasy/data/bodyparts3d/build/')('puppeteer-core');
}
const puppeteer = loadPuppeteer();

const LOG_DIR = path.resolve(APP, '../../.scratch/phasy/session-logs');
const SHOTS_WIN = 'C:/Users/Kaho/AppData/Local/Temp/claude/C--projects-Phasy/203379e5-af3f-4aae-8c6a-ee18fcb02392/scratchpad/shots/session';
const SHOTS = fs.existsSync(path.dirname(SHOTS_WIN)) ? SHOTS_WIN : path.join(APP, 'test/shots');
const EDGE_WIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE = [EDGE_WIN, '/opt/google/chrome/chrome', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
const PORT = 8771, ORIGIN = `http://localhost:${PORT}`;
const KEY = 'sk-test-DO-NOT-LOG-123';
const STUB = 'test/library.stub.json';
const stub = JSON.parse(fs.readFileSync(path.join(APP, STUB), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = {};
function check(c, ok, msg) {
  (results[c] ??= []).push({ ok: !!ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${c}] ${msg}`);
}

fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

// ---------- server + browser

const server = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--mock', '--port', String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => {
  let out = '';
  server.stdout.on('data', d => { out += d; if (out.includes('localhost')) resolve(); });
  server.on('exit', c => reject(new Error('server exited ' + c)));
  setTimeout(() => reject(new Error('server did not start')), 10000);
});
const setFlags = flags => fetch(`${ORIGIN}/mock/flags?${new URLSearchParams(flags)}`).then(r => r.json());
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: true,
  args: ['--no-first-run', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'],
});
const allLogPosts = [], allLogFiles = [], allChat = [];

async function openPage(name, url) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const net = { chat: [], logPosts: [], logFiles: [], errors: [] };
  page.on('pageerror', e => net.errors.push(e.message));
  page.on('request', r => {
    if (r.url().endsWith('/mock/chat/completions')) { net.chat.push(r); allChat.push(r); }
    if (r.url().endsWith('/log') && r.method() === 'POST') { net.logPosts.push(r.postData()); allLogPosts.push(r.postData()); }
  });
  fs.mkdirSync(LOG_DIR, { recursive: true });
  net.dirBefore = new Set(fs.readdirSync(LOG_DIR));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#main[data-screen="start"]');
  return { ctx, page, net, d: driver(page, name) };
}

function driver(page, name) {
  let n = 0;
  const d = {
    forbid: [], leaks: [],
    screen: () => page.$eval('#main', m => m.dataset.screen),
    async shot(label) {
      const s = label || await d.screen();
      await page.screenshot({ path: path.join(SHOTS, `${name}-${String(++n).padStart(2, '0')}-${s}.png`), fullPage: true });
    },
    tap: sel => page.click(sel),
    async act(sel) {
      const before = await page.$eval('#main', m => m.dataset.n);
      await page.click(sel);
      await page.waitForFunction(b => { const m = document.querySelector('#main'); return m.dataset.n !== b && m.dataset.screen !== 'loading'; }, { timeout: 30000 }, before);
      for (const f of d.forbid) if ((await page.content()).includes(f)) d.leaks.push(`${f} on screen "${await d.screen()}"`);
      return d.screen();
    },
    text: sel => page.$eval(sel, e => e.innerText),
    has: sel => page.$(sel).then(Boolean),
    notes: () => page.$$eval('.note', ns => ns.map(x => x.textContent)),
  };
  return d;
}

async function setSettingsUI(page, s) {
  await page.click('#open-settings');
  await page.waitForSelector('#settings:not([hidden])');
  for (const [id, v] of [['#set-base', s.base], ['#set-model', s.model], ['#set-key', '']])
    await page.$eval(id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await page.select('#set-effort', s.effort);
  if (s.key) await page.type('#set-key', s.key);
}
async function readSettingsUI(page) {
  await page.click('#open-settings');
  await page.waitForSelector('#settings:not([hidden])');
  const v = await page.evaluate(k => ({
    base: document.querySelector('#set-base').value, model: document.querySelector('#set-model').value,
    effort: document.querySelector('#set-effort').value, keyMatches: document.querySelector('#set-key').value === k,
    keyEmpty: document.querySelector('#set-key').value === '', keyMasked: document.querySelector('#set-key').type === 'password',
  }), KEY);
  await page.click('#set-close');
  return v;
}

// ---------- one Session through all 8 steps

// Steps 1–3: from the start screen to the candidate list.
async function toCandidates(d, page, p, out) {
  const grabNotes = async () => out.notes.push(...await d.notes());
  await d.tap('[data-act="who"][data-v="0"]');
  await d.tap(`[data-act="helper"][data-v="${p.helper ? 1 : 0}"]`);
  await d.shot();
  let s = await d.act('[data-act="go"]');
  await d.tap(`[data-act="side"][data-v="${p.side}"]`);
  for (const z of p.zones) await d.tap(`[data-act="zone"][data-v="${z}"]`);
  await d.tap('[data-act="kind"][data-v="疲累"]');
  await d.shot();
  s = await d.act('[data-act="next"]');
  await page.type('textarea', p.text);
  await d.shot();
  s = await d.act('[data-act="next"]');
  out.screens.push(s); await grabNotes();
  await d.shot();
  if (s === 'situation-confirm') s = await d.act('[data-act="yes"]');
  else {
    if (p.situation) await d.tap(`[data-act="sit"][data-v="${p.situation}"]`);
    s = await d.act('[data-act="ok"]');
  }
  if (s === 'test') {
    await d.tap(`[data-act="score"][data-v="${p.testScore}"]`);
    await d.shot();
    s = await d.act('[data-act="next"]');
  }
  out.questions = 0;
  while (s === 'question') {
    await d.shot();
    if (out.questions++ === 0) { await page.type('textarea', '下午對着電腦之後最明顯'); s = await d.act('[data-act="answer"]'); }
    else s = await d.act('[data-act="skip"]');
  }
  out.screens.push(s); await grabNotes();
  out.candidatesText = await d.text('#main');
  await d.shot();
  return s;
}

async function runFlow(d, page, p) {
  const out = { checks: [], plan: [], rounds: [], notes: [], recheck: {}, screens: [] };
  const grabNotes = async () => out.notes.push(...await d.notes());
  await toCandidates(d, page, p, out);
  let s = await d.act('[data-act="go"]');
  let i = 0, last = null;
  while (s === 'check' || s === 'other-side') {
    if (s === 'check') {
      out.checks.push(await page.$eval('[data-check]', e => ({ id: e.dataset.check, text: e.innerText, heading: document.querySelector('#main h2')?.textContent })));
      await grabNotes();
      last = p.checks[i++] ?? { score: 2, familiar: false, shape: 'point' };
      if (last.finish) { await d.shot(); s = await d.act('[data-act="finish"]'); break; }
      await d.tap(`[data-act="score"][data-v="${last.score}"]`);
      await d.tap(`[data-act="fam"][data-v="${last.familiar ? 1 : 0}"]`);
      await d.tap(`[data-act="shape"][data-v="${last.shape}"]`);
      await d.shot();
      s = await d.act('[data-act="save"]');
    } else {
      await d.shot();
      if (last.other != null) { await d.tap(`[data-act="score"][data-v="${last.other}"]`); s = await d.act('[data-act="save"]'); }
      else s = await d.act('[data-act="skip"]');
    }
  }
  out.stopScreen = s;
  out.stopText = await d.text('#main');
  await d.shot();
  if (!(await d.has('[data-act="next"]'))) {
    s = await d.act('[data-act="end"]');
  } else {
    s = await d.act('[data-act="next"]');
    out.picked = await page.$$eval('[data-act="tick"]', bs => bs.map(b => ({ key: b.dataset.v, on: b.getAttribute('aria-pressed') === 'true' })));
    await d.shot();
    s = await d.act('[data-act="next"]');
    out.plan = await page.$$eval('[data-item]', es => es.map(e => e.dataset.item));
    out.planText = await d.text('#main');
    await grabNotes();
    await d.shot();
    s = await d.act('[data-act="go"]');
    let r = 0;
    while (s === 'round') {
      out.rounds.push(...await page.$$eval('[data-item]', es => es.map(e => e.dataset.item)));
      if (r++ === 0) { await d.tap('[data-act="time"][data-v="30"]'); await sleep(1300); out.clock = await d.text('#clock'); }
      await d.shot();
      s = await d.act('[data-act="next"]');
    }
    const cards = await page.$$eval('[data-recheck]', es => es.map(e => ({ key: e.dataset.recheck, before: +e.dataset.before })));
    let k = 0;
    for (const c of cards) {
      const after = c.key === 'test' ? p.testAfter : Math.min(10, c.before + (p.rises[k++] ?? 0));
      await d.tap(`[data-act="after"][data-k="${c.key}"][data-v="${after}"]`);
      out.recheck[c.key] = { before: c.before, after, stopNote: await page.$eval(`[data-recheck="${c.key}"]`, e => !!e.querySelector('.stopnote')) };
    }
    await d.shot();
    s = await d.act('[data-act="done"]');
  }
  out.end = s;
  await page.waitForFunction(() => { const e = document.querySelector('#sent'); return e && !e.textContent.startsWith('正在'); }, { timeout: 10000 });
  out.sent = await d.text('#sent');
  out.endText = await d.text('#main');
  out.localSessions = await page.evaluate(() => localStorage.getItem('phasy.sessions') || '');
  await d.shot();
  return out;
}

const readLog = f => JSON.parse(fs.readFileSync(path.join(LOG_DIR, f), 'utf8'));
async function logOf(net) { // the log file this Session saved = the new file in LOG_DIR
  for (let i = 0; i < 50 && !net.logFiles.length; i++) {
    net.logFiles = fs.readdirSync(LOG_DIR).filter(f => !net.dirBefore.has(f));
    if (!net.logFiles.length) await sleep(100);
  }
  if (!net.logFiles.length) throw new Error('no saved log file');
  allLogFiles.push(...net.logFiles);
  return readLog(net.logFiles[0]);
}
const stubPlan = { helper: true, side: 'R', zones: ['z-neck-back-upper', 'z-neck-back-lower', 'z-shoulder-top'], text: '開長途車之後，肩頸很攰', testScore: 6 };

try {
  // ---------- A: helper, full AI (mock), endpoint rejects reasoning_effort
  {
    await setFlags({ rejectEffort: 1 });
    const { ctx, page, net, d } = await openPage('A', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: 'high', key: KEY });
    await d.shot('settings');
    await page.click('#set-test');
    await page.waitForFunction(() => { const t = document.querySelector('#set-result').textContent; return t && t !== '正在測試…'; });
    const pingResult = await page.$eval('#set-result', e => e.textContent);
    await d.shot('settings-tested');
    await page.click('#set-close');
    check(8, pingResult.includes('連線成功') && pingResult.includes('推理深度'), `「測試連線」 with 400 on reasoning_effort -> "${pingResult}"`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#main[data-screen="start"]');
    const kept = await readSettingsUI(page);
    check(7, kept.base === `${ORIGIN}/mock` && kept.model === 'mock-model' && kept.effort === 'high' && kept.keyMatches && kept.keyMasked,
      `settings with key survive reload: ${JSON.stringify(kept)}`);
    check(7, await page.$eval('#noai', e => e.hidden), 'with a key the 「未連接 AI」 banner is hidden');
    d.forbid = ['Donnelly'];
    const out = await runFlow(d, page, { ...stubPlan,
      checks: [{ score: 7, familiar: true, shape: 'area', other: 5 }, { score: 6, familiar: true, shape: 'along', other: null }],
      rises: [2, 1], testAfter: 3 });
    check('src', out.checks[0]?.id === 'c-trap-upper-pinch' && out.checks[0].text.includes('來源：Travell 第 3 版，頁 257') && d.leaks.length === 0,
      `source line "${out.checks[0]?.text.split('\n').find(t => t.startsWith('來源'))}"; full book title on screen: ${d.leaks.join('; ') || 'never'}`);
    const allItems = stub.muscles.flatMap(m => [...m.stretches, ...m.manual, ...m.cupping]);
    const named = ['cp-trap-upper', 'mt-levator-hold', 'st-trap-upper-seated', 'st-levator-seated'].map(id => allItems.find(x => x.id === id).name);
    check('name', named.every(n => out.planText.includes(n)), `plan shows item names: ${named.map(n => `${n}=${out.planText.includes(n)}`).join(', ')}`);
    // criterion 8: 400 then success without the parameter
    const bodies = net.chat.map(r => ({ effort: 'reasoning_effort' in JSON.parse(r.postData()), status: r.response()?.status(), task: JSON.parse(JSON.parse(r.postData()).messages.at(-1).content).task }));
    const first = bodies.findIndex(b => b.effort && b.task !== 'ping');
    check(8, first >= 0 && bodies[first].status === 400 && bodies[first + 1] && !bodies[first + 1].effort && bodies[first + 1].status === 200 && bodies[first + 1].task === bodies[first].task,
      `flow: ${bodies[first]?.task} sent reasoning_effort -> ${bodies[first]?.status}; retry without it -> ${bodies[first + 1]?.status}; later calls with effort: ${bodies.slice(first + 2).filter(b => b.effort).length}`);
    check(8, out.screens[0] === 'situation-confirm', `AI answer used after the retry (screen "${out.screens[0]}")`);
    // criterion 4
    check(4, out.checks.length === 2 && out.stopScreen === 'stop' && out.stopText.includes('兩條肌肉'),
      `after 2 Familiar-pain muscles: ${out.checks.length} checks shown, next screen "${out.stopScreen}" (mock always suggests one more)`);
    // criterion 5
    const t = out.recheck['m-trap-upper|R'], l = out.recheck['m-levator-scapulae|R'];
    check(5, t?.after - t?.before === 2 && t.stopNote, `rise +2 (${t?.before}->${t?.after}) shows the stop note: ${t?.stopNote}`);
    check(5, l?.after - l?.before === 1 && !l.stopNote, `rise +1 (${l?.before}->${l?.after}) shows no stop note: ${!l?.stopNote}`);
    const log = await logOf(net);
    const e400 = log.llm.filter(x => x.status === 400).length;
    check(8, e400 >= 1 && log.notes.some(n => n.text.includes('推理深度')), `Session log records ${e400} rejected call(s) and the note`);
    check('A', out.end === 'end' && out.sent === '紀錄已送到電腦', `A reaches step 8: "${out.sent}"`);
    const [c1, c2] = out.checks;
    check('light', c1?.id === 'c-trap-upper-pinch' && c1.text.includes('慢慢按，找最痛的一點') && c2?.id === 'c-levator-press' && c2.text.includes('範圍內輕輕按，找最敏感的一點') && !c2.text.includes('最痛'),
      `standard check ${c1?.id}: 「找最痛的一點」 ${c1?.text.includes('找最痛的一點')}; light check ${c2?.id}: 「輕輕按，找最敏感的一點」 ${c2?.text.includes('輕輕按，找最敏感的一點')}, 「最痛」 ${c2?.text.includes('最痛')}`);
    check('cup', out.plan.includes('cp-trap-upper') && !out.plan.includes('mt-trap-upper-hold') && !out.rounds.includes('mt-trap-upper-hold') && out.plan.includes('mt-levator-hold'),
      `mock picked cp-trap-upper + mt-trap-upper-hold; plan shows ${out.plan.join(', ')}`);
    check('cup', out.notes.some(n => n.includes('這條肌肉已經拔罐，這一節不再按壓')) && log.planDrops?.some(x => x.id === 'mt-trap-upper-hold') && !log.refusals.some(r => r.id === 'mt-trap-upper-hold'),
      `note shown; log.planDrops ${JSON.stringify(log.planDrops)}; not in refusals`);
    console.log('   A extra:', JSON.stringify({ questions: out.questions, checks: out.checks.map(c => c.id), plan: out.plan, clock: out.clock, picked: out.picked, llmCalls: log.llm.length, file: net.logFiles[0], errors: net.errors }));
    check('A', out.candidatesText.includes('AI 加入'), 'AI-added muscle carries the 「AI 加入」 tag');
    check('A', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- B: mock returns unknown ids and one invalid JSON reply
  {
    await setFlags({ unknownId: 1, badJsonOnce: 1 });
    const { ctx, page, net, d } = await openPage('B', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: '', key: KEY });
    await page.click('#set-close');
    d.forbid = ['not-in-library'];
    const out = await runFlow(d, page, { ...stubPlan, checks: [{ score: 6, familiar: true, shape: 'point', other: null }, { finish: true }], rises: [0], testAfter: 4 });
    check(1, d.leaks.length === 0 && !(await page.content()).includes('not-in-library'), `unknown ids never in the page (checked after every screen): ${d.leaks.join('; ') || 'none'}`);
    check(1, out.notes.some(n => n.includes('AI 回覆了知識庫以外的項目，已略過')), 'refusal note shown');
    const log = await logOf(net);
    const refused = log.refusals.map(r => r.id);
    check(1, ['c-not-in-library', 'm-not-in-library', 'st-not-in-library'].every(x => refused.includes(x)), `log.refusals = ${JSON.stringify([...new Set(refused)])}`);
    check(1, out.checks.length >= 1 && out.checks.every(c => stub.muscles.some(m => m.checks.some(x => x.id === c.id))), `fallback filled the gap: checks shown ${out.checks.map(c => c.id).join(', ')}`);
    const ms = log.llm.filter(x => x.task === 'map_situation');
    check('B', ms.length === 2 && ms[0].reply === '這不是 JSON {' && out.screens[0] === 'situation-confirm', `invalid JSON retried once, then used (${ms.length} map_situation calls)`);
    check('B', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- C: no Helper; mock suggests a Helper-only check and Helper-only treatments
  {
    await setFlags({ extraCheck: 'c-levator-press', extraItem: 'st-trap-upper-assisted,cp-trap-upper,mt-trap-upper-hold' });
    const { ctx, page, net, d } = await openPage('C', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: '', key: KEY });
    await page.click('#set-close');
    const out = await runFlow(d, page, { ...stubPlan, helper: false,
      checks: [{ score: 7, familiar: true, shape: 'area', other: 4 }, { score: 6, familiar: true, shape: 'point', other: null }], rises: [1, 0], testAfter: 4 });
    const aloneIds = new Set(stub.muscles.flatMap(m => m.checks.filter(c => c.alone).map(c => c.id)));
    const soloStretch = new Set(stub.muscles.flatMap(m => m.stretches.filter(x => x.helper === false).map(x => x.id)));
    check(3, out.checks.length > 0 && out.checks.every(c => aloneIds.has(c.id) && c.text.includes('自己做的方法')), `checks shown with no Helper: ${out.checks.map(c => c.id).join(', ')}`);
    const items = [...out.plan, ...out.rounds];
    check(3, items.length > 0 && items.every(id => soloStretch.has(id)), `plan items: ${[...new Set(items)].join(', ')}`);
    const log = await logOf(net);
    check(3, ['c-levator-press', 'st-trap-upper-assisted', 'cp-trap-upper'].every(x => log.refusals.some(r => r.id === x)), 'Helper-only ids suggested by the mock were refused');
    check(4, out.checks.length === 2 && out.stopScreen === 'stop', `no Helper: stop after 2 Familiar-pain muscles (${out.checks.length} checks)`);
    const np = out.checks.find(c => c.id === 'c-splenius-press');
    check('noPress', np && np.text.includes('只用手指輕輕認位，不要向內按') && !/最痛|按哪裏|力度/.test(np.text) && np.heading === '不適分數',
      `noPress point card: 認位 line ${np?.text.includes('只用手指輕輕認位')}; 「最痛」/「按哪裏」/「力度」 ${np && /最痛|按哪裏|力度/.test(np.text)}; score heading 「${np?.heading}」`);
    check('C', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- D: no key -> 「未連接 AI」, fallbacks only
  {
    await setFlags({});
    const { ctx, page, net, d } = await openPage('D', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: 'low', key: '' });
    await page.click('#set-close');
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#main[data-screen="start"]');
    const kept = await readSettingsUI(page);
    check(7, kept.base === `${ORIGIN}/mock` && kept.model === 'mock-model' && kept.effort === 'low' && kept.keyEmpty, `settings without key survive reload: ${JSON.stringify(kept)}`);
    const banner = await page.$eval('#noai', e => !e.hidden && e.textContent.includes('未連接 AI'));
    check(7, banner, 'banner 「未連接 AI」 visible');
    const out = await runFlow(d, page, { ...stubPlan, situation: 's-phone-head-down',
      checks: [{ score: 6, familiar: true, shape: 'area', other: 2 }, { score: 5, familiar: false, shape: 'point' }, { finish: true }], rises: [0], testAfter: 5 });
    const log = await logOf(net);
    check(7, out.end === 'end' && out.sent === '紀錄已送到電腦' && net.chat.length === 0 && log.llm.length === 0,
      `no key: reached step 8 with ${net.chat.length} LLM calls; "${out.sent}"; picked ${JSON.stringify(out.picked)}; plan ${out.plan.join(',')}`);
    check('cup', out.plan.includes('cp-trap-upper') && !out.plan.includes('mt-trap-upper-hold') && out.notes.some(n => n.includes('這條肌肉已經拔罐')) && log.planDrops?.some(x => x.id === 'mt-trap-upper-hold' && x.by === 'fallback'),
      `no AI (fallback plan): ${out.plan.join(', ')}; note shown; dropped ${JSON.stringify(log.planDrops)}`);
    check('D', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- F: a Complaint whose only zone is a trigger point's `at` zone still makes that muscle a candidate
  {
    await setFlags({});
    const AT = 'z-neck-shoulder-angle';
    const inReferral = stub.muscles.some(m => m.triggerPoints.some(tp => tp.referral.includes(AT)));
    const owners = stub.muscles.filter(m => m.triggerPoints.some(tp => tp.at === AT)).map(m => m.id);
    const { ctx, page, d } = await openPage('F', `${ORIGIN}/?lib=${STUB}`); // fresh context = no key, so no AI additions
    const fresh = await readSettingsUI(page);
    const opts = await page.$$eval('#set-effort option', os => os.map(o => `${o.value || '(空)'}=${o.textContent}`));
    const hint = await page.$eval('#set-effort', e => e.closest('label').nextElementSibling.textContent);
    check('effort', fresh.effort === 'none' && opts.join(',') === '(空)=不傳送,none=關閉思考,low=low,medium=medium,high=high,max=max' && hint === '思考越深，每一步等得越久。',
      `fresh install effort "${fresh.effort}"; options ${opts.join(' ')}; hint "${hint}"`);
    await d.tap('[data-act="who"][data-v="1"]');
    await d.tap('[data-act="helper"][data-v="1"]');
    await d.act('[data-act="go"]');
    await d.tap('[data-act="side"][data-v="L"]');
    await d.tap(`[data-act="zone"][data-v="${AT}"]`);
    await d.tap('[data-act="kind"][data-v="緊"]');
    await d.act('[data-act="next"]');
    await d.act('[data-act="list"]'); // 「說不出來，直接從清單揀」, then confirm with no situation
    let s = await d.act('[data-act="ok"]');
    if (s === 'test') { await d.tap('[data-act="score"][data-v="4"]'); s = await d.act('[data-act="next"]'); }
    const cands = await page.$$eval('[data-muscle]', es => es.map(e => ({ id: e.dataset.muscle, text: e.innerText })));
    await d.shot();
    check('at', !inReferral && owners.length === 1 && s === 'candidates' && cands.length === 1 && cands[0].id === owners[0] && cands[0].text.includes('激痛點就在'),
      `Complaint = ${AT} only (in no referral list: ${!inReferral}; no situation confirmed): candidates ${JSON.stringify(cands.map(c => c.id))}; reason "${cands[0]?.text.split('\n').pop()}"`);
    await ctx.close();
  }

  // ---------- G: a muscle × side with Familiar pain leaves the check list; its other side stays
  {
    await setFlags({ checkSeq: 'c-trap-upper-pinch|右,c-trap-upper-sidebend|右' });
    const { ctx, page, net, d } = await openPage('G', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: '', key: KEY });
    await page.click('#set-close');
    const out = await runFlow(d, page, { ...stubPlan, side: 'B', zones: ['z-shoulder-top'],
      checks: [{ score: 7, familiar: true, shape: 'area', other: 3 }, { finish: true }], rises: [0], testAfter: 4 });
    const log = await logOf(net);
    const nc = net.chat.map(r => JSON.parse(JSON.parse(r.postData()).messages.at(-1).content)).filter(u => u.task === 'next_check');
    const after = nc.find(u => u.data.checksDone === 1)?.data.allowed ?? [];
    const trap = after.filter(a => a.muscle === 'm-trap-upper').map(a => `${a.check}|${a.side}`);
    check('found', out.checks[0]?.id === 'c-trap-upper-pinch' && out.checks[0].text.includes('斜方肌上部・右邊'), `check 1: ${out.checks[0]?.id} right side, Familiar pain`);
    check('found', log.refusals.some(r => r.id === 'c-trap-upper-sidebend|R') && out.notes.some(n => n.includes('AI 回覆了知識庫以外的項目')),
      `mock then suggests c-trap-upper-sidebend right -> refused (log.refusals ${JSON.stringify(log.refusals.map(r => r.id))}), note shown`);
    check('found', out.checks[1] && !out.checks[1].text.includes('斜方肌上部・右邊'), `check 2 shown: ${out.checks[1]?.id} ${out.checks[1]?.text.split('\n')[0]}`);
    check('found', trap.includes('c-trap-upper-sidebend|左') && trap.includes('c-trap-upper-pinch|左') && !trap.some(t => t.endsWith('|右')),
      `allowed trapezius checks after Familiar pain on the right: ${trap.join(', ')}`);
    check('G', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- H: waiting state: counter, 「不等了」 after 15 s aborts the call, fallback used, logged as aborted
  {
    await setFlags({});
    const { ctx, page, net, d } = await openPage('H', `${ORIGIN}/?lib=${STUB}`);
    await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: '', key: KEY });
    await page.click('#set-close');
    await toCandidates(d, page, stubPlan, { notes: [], screens: [] });
    await setFlags({ slowTask: 'next_check', slowMs: 30000 });
    const t0 = Date.now();
    await page.click('[data-act="go"]');
    await page.waitForSelector('#main[data-screen="loading"]');
    await sleep(2500);
    const w1 = await d.text('#waited');
    await sleep(3000);
    const w2 = await d.text('#waited');
    const hiddenEarly = await page.$eval('[data-act="giveup"]', b => b.hidden);
    await d.shot('waiting');
    await page.waitForSelector('[data-act="giveup"]:not([hidden])', { timeout: 20000 });
    const shownAt = (Date.now() - t0) / 1000;
    const label = await d.text('[data-act="giveup"]');
    await d.shot('waiting-15s');
    await page.click('[data-act="giveup"]');
    await page.waitForSelector('#main[data-screen="check"]', { timeout: 5000 });
    const gaveUpAt = (Date.now() - t0) / 1000;
    const checkText = await d.text('#main');
    await d.shot('after-giveup');
    check('wait', /^AI 思考中… \d+ 秒$/.test(w1) && w1 !== w2 && hiddenEarly, `counter "${w1}" then "${w2}"; button hidden at 5.5 s: ${hiddenEarly}`);
    check('wait', label === '不等了，用預設次序' && shownAt >= 14.5 && shownAt < 17, `「${label}」 shown after ${shownAt.toFixed(1)} s`);
    check('wait', gaveUpAt < 17 && checkText.includes('按可疑程度的次序') && checkText.includes('已停止等候 AI'),
      `after tap: check screen with the fallback choice at ${gaveUpAt.toFixed(1)} s (mock would answer at 30 s)`);
    await setFlags({});
    await d.act('[data-act="finish"]');
    await d.act((await d.has('[data-act="end"]')) ? '[data-act="end"]' : '[data-act="next"]');
    const log = await logOf(net);
    const ab = log.llm.filter(x => x.task === 'next_check');
    check('wait', ab.length === 1 && ab[0].aborted === true && ab[0].error === 'aborted',
      `Session log next_check entries: ${JSON.stringify(ab.map(x => ({ aborted: x.aborted, error: x.error, ms: x.ms })))}`);
    check('H', net.errors.length === 0, `no page errors (${net.errors.join(' | ')})`);
    await ctx.close();
  }

  // ---------- criterion 2: the key never leaves the Authorization header
  {
    const files = allLogFiles.map(f => fs.readFileSync(path.join(LOG_DIR, f), 'utf8'));
    check(2, allLogPosts.length >= 4 && allLogPosts.every(b => !b.includes(KEY)), `${allLogPosts.length} /log posts, none contain the key`);
    check(2, files.length >= 4 && files.every(t => !t.includes(KEY)), `${files.length} saved log files (${allLogFiles.join(', ')}), none contain the key`);
    check(2, allChat.every(r => !r.postData().includes(KEY) && r.headers().authorization === 'Bearer ' + KEY), `${allChat.length} LLM calls: key only in the Authorization header`);
  }

  // ---------- criterion 6: no Cantonese colloquial forms in the UI sources
  {
    const bad = /嘅|咗|唔|喺|冇|嗰|啲|點樣/;
    for (const f of ['index.html', 'app.js', 'llm.js']) {
      const lines = fs.readFileSync(path.join(APP, f), 'utf8').split('\n').map((t, n) => [n + 1, t]).filter(([, t]) => bad.test(t));
      check(6, lines.length === 0, `${f}: ${lines.length} matching lines ${lines.map(([n]) => n).join(',')}`);
    }
  }

  // ---------- E: one mock Session against the real library.json (only when it passes check-library.mjs)
  {
    const lib = path.join(APP, 'library.json'), checker = path.join(APP, 'check-library.mjs');
    if (!process.argv.includes('--real')) console.log('SKIP [E] real library not requested (use --real)');
    else if (!fs.existsSync(lib)) console.log('SKIP [E] library.json does not exist');
    else if (!fs.existsSync(checker)) console.log('SKIP [E] check-library.mjs does not exist');
    else {
      const r = spawnSync(process.execPath, [checker], { encoding: 'utf8', cwd: APP });
      if (r.status !== 0) console.log(`SKIP [E] check-library.mjs exit ${r.status}: ${(r.stdout + r.stderr).split('\n').slice(0, 8).join(' | ')}`);
      else {
        const real = JSON.parse(fs.readFileSync(lib, 'utf8'));
        const zones = real.zones.filter(z => ['neck', 'shoulder'].includes(z.region)).slice(0, 3).map(z => z.id);
        await setFlags({});
        const { ctx, page, net, d } = await openPage('E', `${ORIGIN}/`);
        await setSettingsUI(page, { base: `${ORIGIN}/mock`, model: 'mock-model', effort: '', key: KEY });
        await page.click('#set-close');
        const out = await runFlow(d, page, { helper: true, side: 'R', zones, text: '整天對着電腦，肩頸很攰', testScore: 6,
          situation: real.situations[0].id,
          checks: [{ score: 7, familiar: true, shape: 'area', other: 4 }, { score: 6, familiar: true, shape: 'along', other: null }], rises: [2, 1], testAfter: 3 });
        const log = await logOf(net).catch(() => null);
        check('E', out.end === 'end' && out.sent === '紀錄已送到電腦' && net.errors.length === 0,
          `real library (${real.muscles.length} muscles, zones ${zones.join(',')}): checks ${out.checks.map(c => c.id).join(', ')}; plan ${out.plan.length} items; refusals ${log?.refusals.length}; errors ${net.errors.length}; "${out.sent}"`);
        await ctx.close();
      }
    }
  }
} catch (e) {
  check('run', false, e.stack);
} finally {
  await browser.close();
  server.kill();
}

const failed = Object.entries(results).flatMap(([c, rs]) => rs.filter(r => !r.ok).map(r => `[${c}] ${r.msg}`));
console.log('\n==== summary ====');
for (const [c, rs] of Object.entries(results)) console.log(`criterion ${c}: ${rs.every(r => r.ok) ? 'PASS' : 'FAIL'} (${rs.length} checks)`);
console.log(failed.length ? `FAILED: ${failed.length}` : 'ALL PASS');
console.log(`screenshots: ${SHOTS}`);
process.exit(failed.length ? 1 : 0);

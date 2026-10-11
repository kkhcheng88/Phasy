// app.js — the Session flow (tickets 06 + 07). Fixed rules live here; every LLM call goes through llm.js.
import * as ai from './llm.js';

const $ = s => document.querySelector(s);
const main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SIDE = { L: '左', R: '右' };
const otherSide = s => (s === 'L' ? 'R' : 'L');
const sidesText = sides => (sides.length > 1 ? '左右兩邊' : SIDE[sides[0]] + '邊');
const STEPS = ['開始', '不適', '可疑肌肉', '檢查', '揀選肌肉', '處理方案', '再檢查', '總結'];
const REGION = { head: '頭部', neck: '頸部', shoulder: '肩膀', 'upper-back': '上背', arm: '手臂' };
const KINDS = ['緊', '酸', '痛', '疲累'];
const SHAPES = { point: '只在這一點', area: '一片範圍', along: '沿着肌肉', elsewhere: '其他地方' };
const KIND_ZH = { cupping: '抽真空拔罐', manual: '手法', stretch: '伸展' };
const ROUNDS = ['cupping', 'manual', 'stretch'];
const MAX_CHECKS = 8;
const SEARCH_CIRCLE = '在這一點附近約一至兩指寬的範圍內慢慢按，找最痛的一點。';
const SEARCH_CIRCLE_LIGHT = '在這一點附近約一至兩指寬的範圍內輕輕按，找最敏感的一點。';
const LOCATE_ONLY = '只用手指輕輕認位，不要向內按。';

// ---------- Library

const LIB = new URLSearchParams(location.search).get('lib') || 'library.json';
let L, idx;
const get = id => idx.get(id)?.item;
const parentOf = id => idx.get(id)?.muscle;
const list = (m, k) => m?.[k] ?? [];
const zoneName = id => get(id)?.name ?? '';
const mName = id => get(id)?.nameZh ?? '';
const referralOf = m => [...new Set(list(m, 'triggerPoints').flatMap(tp => tp.referral ?? []))];
const atOf = m => [...new Set(list(m, 'triggerPoints').map(tp => tp.at).filter(Boolean))];

function indexLibrary(lib) {
  const m = new Map();
  const put = (type, item, muscle) => m.set(item.id, { type, item, muscle });
  lib.zones.forEach(z => put('zone', z));
  lib.situations.forEach(s => put('situation', s));
  lib.pressureLevels.forEach(p => put('pressure', p));
  for (const mu of lib.muscles) {
    put('muscle', mu, mu);
    for (const [k, type] of [['triggerPoints', 'tp'], ['checks', 'check'], ['stretches', 'stretch'], ['manual', 'manual'], ['cupping', 'cupping']])
      list(mu, k).forEach(x => put(type, x, mu));
  }
  return m;
}

function itemLabel(id) {
  const e = idx.get(id);
  if (!e) return '';
  const { type, item, muscle } = e;
  if (type === 'muscle') return item.nameZh;
  if (item.name && (type === 'stretch' || type === 'manual' || type === 'cupping')) return item.name;
  if (type === 'stretch') return '伸展：' + (item.targets ?? [muscle.id]).map(mName).join('、');
  if (type === 'manual') return `手法（${item.kind}）：${muscle.nameZh}`;
  if (type === 'cupping') return `拔罐（${item.method === 'sliding' ? '走罐' : '定罐'}）：${muscle.nameZh}`;
  if (type === 'check') return muscle.nameZh + '的檢查';
  return item.name ?? '';
}

// ---------- storage

const loadMembers = () => { const m = ai.load('phasy.members', null); return Array.isArray(m) && m.length === 2 ? m : ['成員 A', '成員 B']; };
const saveMembers = m => ai.save('phasy.members', m);

// ---------- Session state

let S;
let pendingNotes = [];
function newSession() {
  S = {
    startedAt: new Date().toISOString(), receiver: null, helper: null,
    sides: [], zones: [], kind: null, description: '', reading: '', aiSituations: [], situations: [],
    test: null, testReason: '', testBefore: null,
    followups: [], candidates: [], checks: [], stopReason: '', picked: null, plan: [], planDrops: [],
    recheck: { muscles: {}, test: null }, summary: '', statuses: [],
    log: { llm: [], refusals: [], notes: [] },
  };
  const names = new Map([...idx.keys()].map(id => [id, itemLabel(id)]));
  ai.begin(S.log, names, t => { if (!pendingNotes.includes(t)) pendingNotes.push(t); });
  $('#who').textContent = '';
}

// ---------- rendering

let acts = {};
const timer = { id: 0 };
function show(name, step, html, handlers = {}, back = null) {
  clearInterval(timer.id);
  acts = { ...handlers, back };
  $('#steps').innerHTML = `第 ${step} / 8 步・${STEPS[step - 1]}<div class="bar">${STEPS.map((_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</div>`;
  main.dataset.screen = name;
  main.dataset.n = String(+main.dataset.n + 1);
  main.innerHTML = (back ? '<button class="back" data-act="back">‹ 上一步</button>' : '') +
    pendingNotes.map(t => `<p class="note" role="status">${esc(t)}</p>`).join('') + html;
  pendingNotes = [];
  window.scrollTo(0, 0);
}
const GIVE_UP_S = 15;
function loading(step, msg) {
  show('loading', step, `<div class="loading"><div class="spin"></div><p>${esc(msg)}</p><p class="hint" id="waited">AI 思考中… 0 秒</p>
    <button class="wide" data-act="giveup" hidden>不等了，用預設次序</button></div>`, { giveup: (_, b) => { b.disabled = true; ai.abort(); } });
  const t0 = Date.now();
  timer.id = setInterval(() => {
    const secs = Math.floor((Date.now() - t0) / 1000), w = $('#waited');
    if (!w) return;
    w.textContent = `AI 思考中… ${secs} 秒`;
    if (secs >= GIVE_UP_S) main.querySelector('[data-act="giveup"]').hidden = false;
  }, 1000);
}

main.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) acts[b.dataset.act]?.(b.dataset.v, b);
});
main.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (el) acts[el.dataset.input]?.(el.value, el);
});

// Single choice inside the button's own group; multi toggles.
function pick(b, multi = false) {
  if (multi) { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); return; }
  b.parentElement.querySelectorAll('[aria-pressed]').forEach(x => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true');
}
const pressed = v => (v ? 'true' : 'false');
const enable = (act, on) => { const b = main.querySelector(`[data-act="${act}"]`); if (b) b.disabled = !on; };

function scoreColor(s) {
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const g = [0x22, 0xc5, 0x5e], y = [0xfa, 0xcc, 0x15], r = [0xdc, 0x26, 0x26];
  const c = s <= 5 ? mix(g, y, s / 5) : mix(y, r, (s - 5) / 5);
  return `rgb(${c.join(',')})`;
}
const scale = (act, value, attrs = '') => `<div class="scale">${Array.from({ length: 11 }, (_, i) =>
  `<button data-act="${act}" data-v="${i}" ${attrs} aria-pressed="${pressed(value === i)}" style="--c:${scoreColor(i)}">${i}</button>`).join('')}</div>`;
const swatch = st => (st === 'unchecked' ? '<i class="sw un"></i>' : st === 'suspected' ? '<i class="sw su"></i>' : `<i class="sw" style="background:${scoreColor(st)}"></i>`);

const SRC_SHORT = { travell3: 'Travell 第 3 版' };
function srcLine(x) {
  if (!x?.source) return '';
  const page = String(x.source.page ?? '');
  return `<p class="src">來源：${esc(SRC_SHORT[x.source.ref] ?? x.source.ref)}${page ? '，' + esc(/^\d/.test(page) ? '頁 ' + page : page) : ''}</p>`;
}
const rightAmount = ra => (ra ? `<dl class="ra"><dt>力度</dt><dd>${esc(ra.strength)}</dd><dt>時間</dt><dd>${esc(ra.time)}</dd>
  <dt>正確感覺</dt><dd>${esc(ra.right)}</dd><dt>不對的感覺</dt><dd>${esc(ra.wrong)}</dd></dl>` : '');
const steps = a => (a?.length ? `<ol>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '');
const tpOf = target => (target?.startsWith('tp-') ? get(target) : null);
const noPressAt = target => !!tpOf(target)?.noPress;
// Where to put the fingers. noPress points (front / side of the neck) are only located; light checks search gently.
const pointText = (target, pressure) => {
  const tp = tpOf(target), light = pressure === 'light';
  if (tp) return `${esc(tp.landmark)}<br><span class="circle">${tp.noPress ? LOCATE_ONLY : light ? SEARCH_CIRCLE_LIGHT : SEARCH_CIRCLE}</span>`;
  return `${light ? '沿着這條肌肉輕輕按，找最敏感的一點。' : '沿着這條肌肉慢慢按，找最痛的一點。'}${esc(parentOf(target)?.attachments ?? get(target)?.attachments ?? '')}`;
};

// ---------- data the LLM sees (never the Member's name)

const complaintData = () => ({ sides: S.sides.map(s => SIDE[s]), zones: S.zones.map(zoneName), kind: S.kind });
const situationNames = () => S.situations.map(id => get(id).name);
const testData = () => (S.test ? { name: get(S.test).name, score: S.testBefore } : null);

// ---------- step 1: Start

function screenStart() {
  const members = loadMembers();
  show('start', 1, `
    <h1>開始一節</h1>
    <h2>今次誰是受助者？</h2>
    <div class="choices col">${members.map((m, i) => `<button data-act="who" data-v="${i}" aria-pressed="${pressed(S.receiver === i)}">${esc(m)}</button>`).join('')}</div>
    <details><summary>修改成員名稱</summary>
      ${members.map((m, i) => `<label>成員 ${'AB'[i]}<input data-input="rename" data-i="${i}" value="${esc(m)}" maxlength="20"></label>`).join('')}
    </details>
    <h2>有沒有人幫忙？</h2>
    <div class="choices col">
      <button data-act="helper" data-v="1" aria-pressed="${pressed(S.helper === true)}">有，有人幫忙按</button>
      <button data-act="helper" data-v="0" aria-pressed="${pressed(S.helper === false)}">沒有，自己做</button>
    </div>
    <p class="hint">沒有幫手時，只做自己可以做的檢查和伸展。</p>
    <button class="primary" data-act="go">開始</button>`, {
    who: (v, b) => { S.receiver = +v; pick(b); ready(); },
    helper: (v, b) => { S.helper = v === '1'; pick(b); ready(); },
    rename: (v, el) => {
      const i = +el.dataset.i;
      members[i] = v.trim() || `成員 ${'AB'[i]}`;
      saveMembers(members);
      main.querySelector(`[data-act="who"][data-v="${i}"]`).textContent = members[i];
    },
    go: () => { $('#who').textContent = '受助者：' + loadMembers()[S.receiver]; screenWhere(); },
  });
  const ready = () => enable('go', S.receiver != null && S.helper != null);
  ready();
}

// ---------- step 2: Complaint

function screenWhere() {
  const regions = [...new Set(L.zones.map(z => z.region))];
  const sideV = S.sides.length === 2 ? 'B' : S.sides[0];
  show('where', 2, `
    <h1>不適在哪裏？</h1>
    <h2>哪一邊？</h2>
    <div class="choices">${[['L', '左'], ['R', '右'], ['B', '兩邊']].map(([v, t]) => `<button data-act="side" data-v="${v}" aria-pressed="${pressed(sideV === v)}">${t}</button>`).join('')}</div>
    <h2>位置（可揀多個）</h2>
    ${regions.map(r => `<h3>${esc(REGION[r] ?? '其他')}</h3><div class="choices">${L.zones.filter(z => z.region === r).map(z =>
      `<button data-act="zone" data-v="${esc(z.id)}" aria-pressed="${pressed(S.zones.includes(z.id))}">${esc(z.name)}</button>`).join('')}</div>`).join('')}
    <h2>是哪一種感覺？</h2>
    <div class="choices">${KINDS.map(k => `<button data-act="kind" data-v="${k}" aria-pressed="${pressed(S.kind === k)}">${k}</button>`).join('')}</div>
    <button class="primary" data-act="next">下一步</button>`, {
    side: (v, b) => { S.sides = v === 'B' ? ['L', 'R'] : [v]; pick(b); ready(); },
    zone: (v, b) => { pick(b, true); S.zones = S.zones.includes(v) ? S.zones.filter(z => z !== v) : [...S.zones, v]; ready(); },
    kind: (v, b) => { S.kind = v; pick(b); ready(); },
    next: screenSituationText,
  }, screenStart);
  const ready = () => enable('next', S.sides.length && S.zones.length && S.kind);
  ready();
}

function screenSituationText() {
  show('situation-text', 2, `
    <h1>甚麼情況下會出現或加重？</h1>
    <p>用自己的話說。</p>
    <textarea data-input="text" placeholder="例如：坐巴士靠背時頂住、低頭看手機久了、一整天對着電腦">${esc(S.description)}</textarea>
    <button class="primary" data-act="next">下一步</button>
    <button class="wide" data-act="list">說不出來，直接從清單揀</button>`, {
    text: v => { S.description = v; enable('next', v.trim()); },
    next: async () => {
      if (!ai.enabled()) return screenSituationPick('未連接 AI，請從清單揀最接近的一至兩項；都不像可以不揀。');
      loading(2, 'AI 正在理解你的描述…');
      const allowed = new Set(L.situations.map(s => s.id));
      const r = await ai.mapSituation({
        complaint: complaintData(), description: S.description,
        situations: L.situations.map(s => ({ id: s.id, name: s.name, kind: s.kind, zones: (s.zones ?? []).map(zoneName), loads: (s.loads ?? []).map(mName) })),
      }, allowed);
      S.aiSituations = r?.ids ?? [];
      S.reading = r?.reading ?? '';
      if (r?.ids.length) return screenSituationConfirm();
      screenSituationPick(r ? 'AI 未能把你的描述對上清單，請自己揀最接近的一至兩項；都不像可以不揀。' : '請從清單揀最接近的一至兩項；都不像可以不揀。');
    },
    list: () => screenSituationPick('請從清單揀最接近的一至兩項；都不像可以不揀。'),
  }, screenWhere);
  enable('next', S.description.trim());
}

function screenSituationConfirm() {
  show('situation-confirm', 2, `
    <h1>AI 的理解</h1>
    <div class="card"><p class="why">${esc(S.reading || '你說的情況最接近以下一項。')}</p>
      <ul>${S.aiSituations.map(id => `<li>${esc(get(id).name)}</li>`).join('')}</ul></div>
    <button class="primary" data-act="yes">對，是這樣</button>
    <button class="wide" data-act="no">不對，我自己揀</button>`, {
    yes: () => { S.situations = [...S.aiSituations]; chooseTest(); },
    no: () => screenSituationPick('請從清單揀最接近的一至兩項；都不像可以不揀。'),
  }, screenSituationText);
}

function screenSituationPick(msg) {
  let chosen = [...(S.situations.length ? S.situations : S.aiSituations)];
  show('situation-pick', 2, `
    <h1>哪一種情況最接近？</h1>
    <p class="hint">${esc(msg)}</p>
    <div class="choices col">${L.situations.map(s => `<button data-act="sit" data-v="${esc(s.id)}" aria-pressed="${pressed(chosen.includes(s.id))}">${esc(s.name)}</button>`).join('')}</div>
    <button class="primary" data-act="ok">確定</button>`, {
    sit: (v, b) => {
      if (chosen.includes(v)) chosen = chosen.filter(x => x !== v);
      else if (chosen.length < 2) chosen.push(v);
      main.querySelectorAll('[data-act="sit"]').forEach(x => x.setAttribute('aria-pressed', pressed(chosen.includes(x.dataset.v))));
    },
    ok: () => { S.situations = chosen; chooseTest(); },
  }, screenSituationText);
}

async function chooseTest() {
  const direct = S.situations.map(get).find(s => s.onTheSpot && s.testMovement);
  if (direct) { S.test = direct.id; S.testReason = '這是你說的情況，可以即場做一次。'; return screenTest(); }
  const tests = L.situations.filter(s => s.testMovement);
  if (!tests.length) { S.test = null; return startFollowups(); }
  const overlap = s => (s.zones ?? []).filter(z => S.zones.includes(z)).length;
  const fallback = tests.reduce((best, s) => (overlap(s) > overlap(best) ? s : best), tests[0]);
  let r = null;
  if (ai.enabled()) {
    loading(2, 'AI 正在揀測試動作…');
    r = await ai.pickTest({ complaint: complaintData(), situations: situationNames(), tests: tests.map(s => ({ id: s.id, name: s.name, zones: (s.zones ?? []).map(zoneName) })) },
      new Set(tests.map(s => s.id)));
  }
  S.test = r?.id ?? fallback.id;
  S.testReason = r?.reason || '這個動作測試的位置與你的不適位置最接近。';
  screenTest();
}

function screenTest() {
  const t = get(S.test);
  show('test', 2, `
    <h1>測試動作：${esc(t.name)}</h1>
    <p class="why">${esc(S.testReason)}</p>
    <div class="card"><h3>怎樣做</h3><p>${esc(t.testHowTo)}</p></div>
    <h2>現在做一次，不適有多強？</h2>
    <p class="hint">0 = 完全沒有，10 = 最強。</p>
    ${scale('score', S.testBefore)}
    <button class="primary" data-act="next">下一步</button>`, {
    score: (v, b) => { S.testBefore = +v; pick(b); enable('next', true); },
    next: startFollowups,
  }, screenSituationText);
  enable('next', S.testBefore != null);
}

// ---------- step 3: Candidate list

// Fixed rule (LIBRARY-FORMAT.md): muscle × side is a candidate when the side is a Complaint side and a trigger
// point's referral zone or `at` zone is a Complaint zone, or the muscle is loaded by a confirmed situation.
// Complaint zones apply to every Complaint side, so matching by zone id covers sided and `sided: false` zones.
function buildCandidates() {
  const zones = new Set(S.zones);
  const loaded = new Set(S.situations.flatMap(id => get(id).loads ?? []));
  const out = [];
  for (const side of S.sides) for (const m of L.muscles) {
    const matchedRef = referralOf(m).filter(z => zones.has(z));
    const matchedAt = atOf(m).filter(z => zones.has(z));
    const matched = [...new Set([...matchedAt, ...matchedRef])];
    const byLoad = loaded.has(m.id);
    if (matched.length || byLoad) out.push({ muscle: m.id, side, matched, matchedAt, matchedRef, byLoad, aiAdded: false, reason: '', by: 'rule' });
  }
  // Fallback order: most matching zones first.
  return out.sort((a, b) => b.matched.length - a.matched.length || b.byLoad - a.byLoad);
}

function candidateData() {
  return S.candidates.map(c => {
    const m = get(c.muscle);
    return { muscle: m.id, name: m.nameZh, side: SIDE[c.side], triggerPointZones: atOf(m).map(zoneName), referral: referralOf(m).map(zoneName),
      matchedZones: c.matched.map(zoneName), loadedBySituation: c.byLoad };
  });
}

function startFollowups() {
  S.candidates = buildCandidates();
  askFollowup();
}

async function askFollowup() {
  if (!ai.enabled() || S.followups.length >= 3) return rank();
  loading(3, 'AI 正在想想要不要多問一句…');
  const q = await ai.followUp({
    complaint: complaintData(), situations: situationNames(), test: testData(), candidates: candidateData(),
    asked: S.followups.map(f => ({ question: f.q, answer: f.a ?? '（跳過）' })), left: 3 - S.followups.length,
  });
  if (!q) return rank();
  show('question', 3, `
    <h1>AI 想多問一句</h1>
    <p class="hint">第 ${S.followups.length + 1} 條，最多 3 條。</p>
    <div class="card"><p>${esc(q)}</p></div>
    <textarea data-input="typed" placeholder="用自己的話回答"></textarea>
    <button class="primary" data-act="answer">回答</button>
    <button class="wide" data-act="skip">跳過</button>`, {
    typed: v => enable('answer', v.trim()),
    answer: () => { S.followups.push({ q, a: main.querySelector('textarea').value.trim() }); askFollowup(); },
    skip: () => { S.followups.push({ q, a: null }); askFollowup(); },
  });
  enable('answer', false);
}

async function rank() {
  const candIds = new Set(S.candidates.map(c => c.muscle));
  const others = L.muscles.filter(m => !candIds.has(m.id));
  if (ai.enabled()) {
    loading(3, 'AI 正在排列可疑肌肉…');
    const r = await ai.rankCandidates({
      complaint: complaintData(), situations: situationNames(), test: testData(),
      answers: S.followups.map(f => ({ question: f.q, answer: f.a ?? '（跳過）' })),
      candidates: candidateData(),
      others: others.map(m => ({ muscle: m.id, name: m.nameZh, action: m.action, triggerPointZones: atOf(m).map(zoneName), referral: referralOf(m).map(zoneName) })),
    }, candIds, new Set(others.map(m => m.id)), S.sides);
    if (r) {
      const ordered = [];
      for (const x of r.ranking) for (const c of S.candidates)
        if (c.muscle === x.muscle && (!x.side || c.side === x.side) && !ordered.includes(c)) { c.reason = x.reason; c.by = 'ai'; ordered.push(c); }
      S.candidates = [...ordered, ...S.candidates.filter(c => !ordered.includes(c))];
      for (const a of r.added) for (const side of a.sides)
        S.candidates.push({ muscle: a.muscle, side, matched: [], matchedAt: [], matchedRef: [], byLoad: false, aiAdded: true, reason: a.reason, by: 'ai' });
    }
  }
  const zn = ids => ids.map(zoneName).join('、');
  for (const c of S.candidates) if (!c.reason) {
    const parts = [c.matchedAt.length && `激痛點就在${zn(c.matchedAt)}`, c.matchedRef.length && `激痛點會把痛引到${zn(c.matchedRef)}`].filter(Boolean);
    c.reason = parts.length ? `這條肌肉的${parts.join('，也')}。` : '你說的情況會用到這條肌肉。';
  }
  screenCandidates();
}

function screenCandidates() {
  if (!S.candidates.length) {
    return show('candidates', 3, `
      <h1>可疑肌肉</h1>
      <div class="card"><p>按照知識庫，沒有肌肉與你揀的位置和情況對得上。</p></div>
      <button class="primary" data-act="end">結束這一節</button>`, { end });
  }
  show('candidates', 3, `
    <h1>可疑肌肉</h1>
    <p class="hint"><i class="sw su"></i>斜紋 = 懷疑，未按壓。排得越前越可疑。</p>
    ${S.candidates.map((c, i) => `<div class="card" data-muscle="${esc(c.muscle)}">
      <h3><i class="sw su"></i>${i + 1}. ${esc(mName(c.muscle))}・${SIDE[c.side]}邊${c.aiAdded ? '<span class="tag">AI 加入</span>' : ''}</h3>
      <p class="en">${esc(get(c.muscle).nameEn)}</p>
      <p>${esc(c.reason)}</p></div>`).join('')}
    <button class="primary" data-act="go">開始檢查</button>`, { go: nextCheck });
}

// ---------- step 4: Checks

const familiarMuscles = () => new Set(S.checks.filter(r => r.familiar).map(r => r.muscle));

// Fixed rule: checks of candidate muscles not yet done; with no Helper only `alone: true`;
// a muscle × side that already gave Familiar pain is found, so its other checks leave the set.
function allowedChecks() {
  const out = [];
  const found = new Set(S.checks.filter(r => r.familiar).map(r => r.muscle + '|' + r.side));
  for (const c of S.candidates) for (const ch of list(get(c.muscle), 'checks')) {
    if (!S.helper && !ch.alone) continue;
    if (found.has(c.muscle + '|' + c.side)) continue;
    if (S.checks.some(r => r.check === ch.id && r.side === c.side)) continue;
    if (out.some(a => a.check === ch.id && a.side === c.side)) continue;
    out.push({ check: ch.id, side: c.side, muscle: c.muscle });
  }
  return out;
}

async function nextCheck() {
  // Fixed stop rules come first: the LLM is not asked once one applies.
  if (familiarMuscles().size >= 2) return screenStop('已有兩條肌肉出現平時那種痛，可以開始處理。');
  if (S.checks.length >= MAX_CHECKS) return screenStop(`已做滿 ${MAX_CHECKS} 個檢查。`);
  const allowed = allowedChecks();
  if (!allowed.length) return screenStop(S.checks.length ? '可疑肌肉的檢查已全部做完。' : '沒有可以做的檢查。');
  let next = null;
  if (ai.enabled()) {
    loading(4, 'AI 正在揀下一個檢查…');
    const r = await ai.nextCheck({
      complaint: complaintData(), test: testData(), helper: S.helper,
      candidates: S.candidates.map(c => ({ muscle: c.muscle, name: mName(c.muscle), side: SIDE[c.side], reason: c.reason })),
      done: S.checks.map(r => ({ check: r.check, name: mName(r.muscle), side: SIDE[r.side], score: r.score, familiarPain: r.familiar, painShape: SHAPES[r.shape], otherSideScore: r.other })),
      allowed: allowed.map(a => {
        const ch = get(a.check), tp = ch.target?.startsWith('tp-') ? get(ch.target) : null;
        return { check: a.check, side: SIDE[a.side], muscle: a.muscle, name: mName(a.muscle), kind: ch.kind, point: tp?.name ?? null,
          pointZone: tp?.at ? zoneName(tp.at) : null, referral: tp ? (tp.referral ?? []).map(zoneName) : [] };
      }),
      checksDone: S.checks.length, maxChecks: MAX_CHECKS,
    }, allowed);
    if (r?.stop) return screenStop(r.reason, true);
    if (r) next = { ...r, by: 'ai' };
  }
  // Fallback: candidate order, preferring a muscle × side not pressed yet.
  const fresh = allowed.find(a => !S.checks.some(r => r.muscle === a.muscle && r.side === a.side));
  if (!next) next = { ...(fresh ?? allowed[0]), reason: '按可疑程度的次序，下一個是這條肌肉。', by: 'fallback' };
  screenCheck(next);
}

function screenCheck(a) {
  const ch = get(a.check), m = get(a.muscle), p = get(ch.pressure);
  const r = { n: S.checks.length + 1, check: a.check, muscle: a.muscle, side: a.side, reason: a.reason, by: a.by, score: null, familiar: null, shape: null, other: null };
  const noPress = noPressAt(ch.target), isPress = ch.kind === 'press' && !noPress;
  show('check', 4, `
    <h1>檢查 ${r.n}</h1>
    <p class="hint">最多 ${MAX_CHECKS} 個。</p>
    <div class="card" data-check="${esc(a.check)}">
      <h3>${esc(m.nameZh)}・${SIDE[a.side]}邊</h3><p class="en">${esc(m.nameEn)}</p>
      ${a.reason ? `<p class="why">為甚麼查這裏：${esc(a.reason)}</p>` : ''}
      <dl>
        ${isPress ? `<dt>按哪裏</dt><dd>${pointText(ch.target, ch.pressure)}</dd>` : noPress ? `<dt>位置</dt><dd>${pointText(ch.target)}</dd>` : ''}
        <dt>受助者的姿勢</dt><dd>${esc(ch.receiverPosition)}</dd>
        <dt>${S.helper ? '幫手的做法' : '自己做的方法'}</dt><dd>${esc(S.helper ? ch.helperMethod : ch.aloneMethod)}</dd>
        ${p && !noPress ? `<dt>力度：${esc(p.name)}（${esc(p.force)}）</dt><dd>怎樣學：${esc(p.howToLearn)}</dd>` : ''}
      </dl>${srcLine(ch)}
    </div>
    <h2>${isPress ? '壓痛分' : '不適分數'}</h2>
    <p class="hint">0 = 不痛，10 = 最痛。兩人意見不同時，以受助者的分數為準。</p>
    ${scale('score', null)}
    <h2>是不是平時那種痛？</h2>
    <div class="choices"><button data-act="fam" data-v="1" aria-pressed="false">是</button><button data-act="fam" data-v="0" aria-pressed="false">不是</button></div>
    <h2>痛的形態</h2>
    <div class="choices col">${Object.entries(SHAPES).map(([k, t]) => `<button data-act="shape" data-v="${k}" aria-pressed="false">${t}</button>`).join('')}</div>
    <button class="primary" data-act="save">記錄</button>
    <button class="wide" data-act="finish">完成檢查</button>`, {
    score: (v, b) => { r.score = +v; pick(b); ready(); },
    fam: (v, b) => { r.familiar = v === '1'; pick(b); ready(); },
    shape: (v, b) => { r.shape = v; pick(b); ready(); },
    save: () => { S.checks.push(r); r.familiar ? screenOtherSide(r) : nextCheck(); },
    finish: () => screenStop('你按了「完成檢查」。'),
  });
  const ready = () => enable('save', r.score != null && r.familiar != null && r.shape);
  ready();
}

function screenOtherSide(r) {
  const ch = get(r.check), noPress = noPressAt(ch.target), isPress = ch.kind === 'press' && !noPress, o = SIDE[otherSide(r.side)];
  show('other-side', 4, `
    <h1>比較另一邊</h1>
    <p>這是平時那種痛。${isPress ? `請在${o}邊同一點按一下，用同樣的力度，比較一下。` : `請在${o}邊做同一個檢查，比較一下。`}</p>
    <div class="card"><h3>${esc(mName(r.muscle))}・${o}邊</h3>
      ${isPress || noPress ? `<p>${pointText(ch.target, ch.pressure)}</p>` : ''}</div>
    <h2>${o}邊的${isPress ? '壓痛分' : '不適分數'}</h2>
    ${scale('score', null)}
    <button class="primary" data-act="save">記錄</button>
    <button class="wide" data-act="skip">略過</button>`, {
    score: (v, b) => { r.other = +v; pick(b); enable('save', true); },
    save: nextCheck,
    skip: () => { r.other = null; nextCheck(); },
  });
  enable('save', false);
}

// muscle × side -> highest score this Session; Familiar pain if any Check on it said yes.
function results() {
  const map = new Map();
  const add = (muscle, side, score, familiar, check) => {
    const key = muscle + '|' + side;
    const e = map.get(key) ?? { key, muscle, side, score: -1, familiar: false, check };
    e.score = Math.max(e.score, score);
    e.familiar ||= familiar;
    map.set(key, e);
  };
  for (const r of S.checks) {
    add(r.muscle, r.side, r.score, r.familiar, r.check);
    if (r.other != null) add(r.muscle, otherSide(r.side), r.other, false, r.check);
  }
  return [...map.values()];
}

function screenStop(reason, byAI = false) {
  S.stopReason = (byAI ? 'AI：' : '') + reason;
  const res = results();
  const found = res.some(e => e.familiar || e.score >= 5);
  show('stop', 4, `
    <h1>檢查完成</h1>
    <p class="why">${byAI ? 'AI 建議停止檢查：' : ''}${esc(reason)}</p>
    ${res.length ? `<div class="card">${res.map(e => `<p class="row">${swatch(e.score)}<span>${esc(mName(e.muscle))}・${SIDE[e.side]}邊：${e.score} 分${e.familiar ? '<span class="tag plain">平時那種痛</span>' : ''}</span></p>`).join('')}</div>` : ''}
    ${found ? '<button class="primary" data-act="next">下一步：揀要處理的肌肉</button>'
    : `<div class="card"><p>今次按壓沒有找到平時那種痛，也沒有 5 分或以上的壓痛。</p><p>可以先結束這一節，下次再試。</p></div>
       <button class="primary" data-act="end">結束這一節</button>`}`, { next: screenPick, end });
}

// ---------- step 5: Pick muscles

function screenPick() {
  const res = results();
  const fam = res.filter(e => e.familiar);
  const rest = res.filter(e => !e.familiar && e.score >= 5).sort((a, b) => b.score - a.score);
  if (!S.picked) S.picked = fam.map(e => e.key);
  const row = e => `<button data-act="tick" data-v="${esc(e.key)}" aria-pressed="${pressed(S.picked.includes(e.key))}">
      <span class="row">${swatch(e.score)}<span>${esc(mName(e.muscle))}・${SIDE[e.side]}邊・${e.score} 分</span></span></button>`;
  show('pick', 5, `
    <h1>揀要處理的肌肉</h1>
    ${fam.length ? `<h2>出現平時那種痛</h2><div class="choices col">${fam.map(row).join('')}</div>` : ''}
    ${rest.length ? `<h2>有壓痛（5 分或以上），但不是平時那種痛</h2><div class="choices col">${rest.map(row).join('')}</div>` : ''}
    <button class="primary" data-act="next">下一步：處理方案</button>
    <button class="wide" data-act="end">不處理，直接結束</button>`, {
    tick: (v, b) => { pick(b, true); S.picked = S.picked.includes(v) ? S.picked.filter(k => k !== v) : [...S.picked, v]; ready(); },
    next: makePlan,
    end,
  });
  const ready = () => enable('next', S.picked.length);
  ready();
}

// ---------- step 6: Treatment plan

// Fixed rule: treatments of the ticked muscles; with no Helper only Stretches with `helper: false`.
function allowedTreatments() {
  const byId = new Map();
  for (const key of S.picked) {
    const [mid, side] = key.split('|');
    const m = get(mid);
    const items = [
      ...(S.helper ? list(m, 'cupping').map(x => ['cupping', x]) : []),
      ...(S.helper ? list(m, 'manual').map(x => ['manual', x]) : []),
      ...list(m, 'stretches').filter(x => S.helper || x.helper === false).map(x => ['stretch', x]),
    ];
    for (const [kind, x] of items) {
      const e = byId.get(x.id) ?? { id: x.id, kind, muscle: mid, sides: [] };
      if (!e.sides.includes(side)) e.sides.push(side);
      byId.set(x.id, e);
    }
  }
  return [...byId.values()];
}

async function makePlan() {
  const allowed = allowedTreatments();
  const muscles = [...new Set(S.picked.map(k => k.split('|')[0]))];
  let chosen = null;
  if (ai.enabled() && allowed.length) {
    loading(6, 'AI 正在編排處理方案…');
    const res = results();
    chosen = await ai.plan({
      complaint: complaintData(), helper: S.helper,
      muscles: S.picked.map(k => { const e = res.find(x => x.key === k); return { muscle: e.muscle, name: mName(e.muscle), side: SIDE[e.side], score: e.score, familiarPain: e.familiar }; }),
      allowed: allowed.map(a => {
        const x = get(a.id);
        const base = { id: a.id, name: itemLabel(a.id), kind: KIND_ZH[a.kind], muscle: mName(a.muscle) };
        if (a.kind === 'stretch') return { ...base, targets: (x.targets ?? []).map(mName), needsHelper: !!x.helper };
        if (a.kind === 'manual') return { ...base, technique: x.kind };
        return { ...base, method: x.method === 'sliding' ? '走罐' : '定罐' };
      }),
    }, new Set(allowed.map(a => a.id)));
  }
  let items;
  if (chosen?.length) {
    items = chosen.map(c => ({ ...allowed.find(a => a.id === c.id), reason: c.reason || '這是知識庫為這條肌肉列出的做法。', by: 'ai' }));
  } else {
    // Fallback: first item of each kind for each ticked muscle.
    items = [];
    for (const mid of muscles) for (const kind of ROUNDS) {
      const a = allowed.find(x => x.muscle === mid && x.kind === kind);
      if (a) items.push({ ...a, reason: '這是知識庫為這條肌肉列出的第一個做法。', by: 'fallback' });
    }
  }
  // Fixed rule: a muscle cupped in this plan gets no manual technique (pressing on fresh cup marks hurts).
  const cupped = new Set(items.filter(i => i.kind === 'cupping').map(i => i.muscle));
  const dropped = items.filter(i => i.kind === 'manual' && cupped.has(i.muscle));
  if (dropped.length) {
    items = items.filter(i => !dropped.includes(i));
    S.planDrops.push(...dropped.map(i => ({ id: i.id, muscle: i.muscle, rule: 'no manual after cupping', by: i.by })));
    const text = `這條肌肉已經拔罐，這一節不再按壓（${[...new Set(dropped.map(i => mName(i.muscle)))].join('、')}）。`;
    S.log.notes.push({ at: new Date().toISOString(), text });
    pendingNotes.push(text);
  }
  // Every ticked muscle gets a Stretch (ticket 06, step 6).
  for (const mid of muscles) if (!items.some(i => i.kind === 'stretch' && i.muscle === mid)) {
    const a = allowed.find(x => x.kind === 'stretch' && x.muscle === mid);
    if (a) items.push({ ...a, reason: '每條要處理的肌肉都做伸展。', by: 'fill' });
  }
  S.plan = items.sort((a, b) => ROUNDS.indexOf(a.kind) - ROUNDS.indexOf(b.kind) || allowed.indexOf(allowed.find(x => x.id === a.id)) - allowed.indexOf(allowed.find(x => x.id === b.id)));
  screenPlan();
}

const rounds = () => ROUNDS.filter(k => S.plan.some(i => i.kind === k));

function screenPlan() {
  const rs = rounds();
  if (!rs.length) {
    return show('plan', 6, `<h1>處理方案</h1><div class="card"><p>知識庫沒有適合這些肌肉的處理項目${S.helper ? '' : '（沒有幫手時只做伸展）'}。</p></div>
      <button class="primary" data-act="next">去再檢查</button>`, { next: screenRecheck }, screenPick);
  }
  show('plan', 6, `
    <h1>處理方案</h1>
    <p class="hint">每種方法做一輪：先拔罐，再手法，最後伸展。${S.helper ? '' : '沒有幫手，只做自己可以做的伸展。'}</p>
    ${rs.map((k, i) => `<div class="card"><h3>第 ${i + 1} 輪：${KIND_ZH[k]}</h3>
      ${S.plan.filter(x => x.kind === k).map(x => `<p data-item="${esc(x.id)}"><strong>${esc(itemLabel(x.id))}</strong>・${esc(mName(x.muscle))}・${sidesText(x.sides)}<br><span class="hint">${esc(x.reason)}</span></p>`).join('')}
    </div>`).join('')}
    <button class="primary" data-act="go">開始第 1 輪</button>`, { go: () => screenRound(0) }, screenPick);
}

function itemDetail(x) {
  const it = get(x.id);
  let body = '';
  if (x.kind === 'cupping') {
    body = `<dl><dt>放在哪裏</dt><dd>${esc(it.position)}</dd><dt>杯的大小</dt><dd>${esc(it.cupSize)}</dd>
      <dt>方法</dt><dd>${it.method === 'sliding' ? '走罐（杯在皮膚上慢慢滑動）' : '定罐（杯留在原位）'}</dd></dl>`;
  } else if (x.kind === 'manual') {
    body = `<dl><dt>手法</dt><dd>${esc(it.kind)}</dd><dt>位置</dt><dd>${pointText(it.target)}</dd></dl>${steps(it.steps)}`;
  } else {
    body = `<p><span class="tag plain">${it.helper ? '需要幫手' : '自己做'}</span></p>
      <dl><dt>開始姿勢</dt><dd>${esc(it.startPosition)}</dd></dl>${steps(it.steps)}
      ${it.reps ? `<dl><dt>次數</dt><dd>${esc(it.reps)}</dd></dl>` : ''}`;
  }
  return `<div class="card" data-item="${esc(x.id)}"><h3>${esc(itemLabel(x.id))}・${sidesText(x.sides)}</h3><p class="en">${esc(mName(x.muscle))}</p>
    <p class="hint">${esc(x.reason)}</p>${body}<h3 style="margin-top:12px">合適程度</h3>${rightAmount(it.rightAmount)}${srcLine(it)}</div>`;
}

function screenRound(i) {
  const rs = rounds(), k = rs[i], last = i === rs.length - 1;
  show('round', 6, `
    <h1>第 ${i + 1} 輪：${KIND_ZH[k]}</h1>
    ${k === 'cupping' ? '<p class="hint">所有杯一起放好，再用一個計時。</p>' : ''}
    ${S.plan.filter(x => x.kind === k).map(itemDetail).join('')}
    <div class="timer"><div class="clock" id="clock">計時</div>
      <div class="choices">${[[30, '30 秒'], [60, '1 分鐘'], [300, '5 分鐘'], [600, '10 分鐘']].map(([s, t]) => `<button data-act="time" data-v="${s}">${t}</button>`).join('')}</div>
      <button class="wide" data-act="tstop">停止計時</button></div>
    <button class="primary" data-act="next">${last ? '完成處理，去再檢查' : `下一輪：${KIND_ZH[rs[i + 1]]}`}</button>`, {
    time: v => startTimer(+v),
    tstop: () => { clearInterval(timer.id); $('#clock').textContent = '計時'; },
    next: () => (last ? screenRecheck() : screenRound(i + 1)),
  }, () => (i ? screenRound(i - 1) : screenPlan()));
}

function startTimer(sec) {
  clearInterval(timer.id);
  const end = Date.now() + sec * 1000;
  const tick = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    const el = $('#clock');
    if (!el) return clearInterval(timer.id);
    el.textContent = left ? `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` : '時間到';
    if (!left) { clearInterval(timer.id); try { navigator.vibrate?.([300, 150, 300]); } catch { /* not supported */ } }
  };
  tick();
  timer.id = setInterval(tick, 250);
}

// ---------- step 7: Re-check

const treated = () => S.picked.filter(key => { const [mid, side] = key.split('|'); return S.plan.some(i => i.muscle === mid && i.sides.includes(side)); });

function screenRecheck() {
  const res = results();
  const keys = treated();
  for (const key of keys) {
    const e = res.find(x => x.key === key);
    S.recheck.muscles[key] ??= { muscle: e.muscle, side: e.side, check: e.check, before: e.score, after: null };
  }
  if (S.test) S.recheck.test ??= { before: S.testBefore, after: null };
  const deltaHtml = x => (x.after == null ? '' : `<p class="delta">之前 ${x.before} → 之後 ${x.after}</p>${x.after - x.before >= 2 ? '<p class="stopnote">這一節停止處理這條肌肉</p>' : ''}`);
  const t = S.test && get(S.test);
  show('recheck', 7, `
    <h1>再檢查</h1>
    <p class="hint">用同一個檢查、同樣的做法再做一次，比較前後分數。</p>
    ${keys.map(key => {
      const x = S.recheck.muscles[key], ch = get(x.check), p = get(ch.pressure), noPress = noPressAt(ch.target);
      return `<div class="card" data-recheck="${esc(key)}" data-before="${x.before}"><h3>${esc(mName(x.muscle))}・${SIDE[x.side]}邊</h3>
        ${ch.kind === 'press' || noPress ? `<p>${pointText(ch.target, ch.pressure)}</p>` : `<p>${esc(ch.receiverPosition)}</p>`}
        ${p && !noPress ? `<p class="hint">力度：${esc(p.name)}（${esc(p.force)}）</p>` : ''}
        <p>之前：${x.before} 分。現在幾分？</p>
        ${scale('after', x.after, `data-k="${esc(key)}"`)}<div class="out">${deltaHtml(x)}</div></div>`;
    }).join('')}
    ${t ? `<div class="card" data-recheck="test" data-before="${S.recheck.test.before}"><h3>測試動作：${esc(t.name)}</h3><p>${esc(t.testHowTo)}</p>
      <p>之前：${S.recheck.test.before} 分。現在幾分？</p>
      ${scale('after', S.recheck.test.after, 'data-k="test"')}<div class="out">${deltaHtml(S.recheck.test)}</div></div>` : ''}
    <button class="primary" data-act="done">完成再檢查</button>`, {
    after: (v, b) => {
      const x = b.dataset.k === 'test' ? S.recheck.test : S.recheck.muscles[b.dataset.k];
      x.after = +v;
      pick(b);
      b.closest('.card').querySelector('.out').innerHTML = deltaHtml(x);
      ready();
    },
    done: end,
  });
  const ready = () => enable('done', keys.every(k => S.recheck.muscles[k].after != null) && (!S.test || S.recheck.test.after != null));
  ready();
}

// ---------- step 8: End

function statusOf(mid, side) {
  const key = mid + '|' + side;
  const re = S.recheck.muscles[key];
  if (re?.after != null) return re.after;
  const e = results().find(x => x.key === key);
  if (e) return e.score;
  return S.candidates.some(c => c.muscle === mid && c.side === side) ? 'suspected' : 'unchecked';
}

function fallbackSummary() {
  const fam = results().filter(e => e.familiar).map(e => `${mName(e.muscle)}（${SIDE[e.side]}）`);
  let s = fam.length ? `找到平時那種痛的肌肉：${fam.join('、')}。` : '今次沒有找到平時那種痛的肌肉。';
  if (S.plan.length) s += `做了 ${S.plan.length} 項處理。`;
  const t = S.recheck.test;
  if (t?.after != null) s += `測試動作由 ${t.before} 分變為 ${t.after} 分。`;
  return s + '下次可以再比較。';
}

function cut(s, max = 120) {
  const chars = [...s];
  if (chars.length <= max) return s;
  const head = chars.slice(0, max).join('');
  const i = head.lastIndexOf('。');
  return i > 20 ? head.slice(0, i + 1) : chars.slice(0, max - 1).join('') + '…';
}

async function end() {
  let summary = null;
  if (ai.enabled()) {
    loading(8, 'AI 正在寫總結…');
    const res = results();
    summary = await ai.summary({
      complaint: complaintData(), situations: situationNames(), helper: S.helper,
      test: S.test ? { name: get(S.test).name, before: S.testBefore, after: S.recheck.test?.after ?? null } : null,
      checks: res.map(e => ({ name: mName(e.muscle), side: SIDE[e.side], score: e.score, familiarPain: e.familiar })),
      treatments: S.plan.map(i => ({ kind: KIND_ZH[i.kind], name: itemLabel(i.id), sides: i.sides.map(s => SIDE[s]) })),
      recheck: Object.values(S.recheck.muscles).map(x => ({ name: mName(x.muscle), side: SIDE[x.side], before: x.before, after: x.after, stopTreating: x.after - x.before >= 2 })),
      stopReason: S.stopReason,
    });
  }
  S.summary = cut(summary || fallbackSummary());
  S.statuses = L.muscles.map(m => ({ muscle: m.id, L: statusOf(m.id, 'L'), R: statusOf(m.id, 'R') }));
  const stopped = new Set(Object.entries(S.recheck.muscles).filter(([, x]) => x.after - x.before >= 2).map(([k]) => k));
  const t = S.recheck.test;
  show('end', 8, `
    <h1>這一節的總結</h1>
    <div class="card"><p>${esc(S.summary)}</p>${t?.after != null ? `<p class="delta">測試動作：${t.before} → ${t.after}</p>` : ''}</div>
    <h2>肌肉狀態</h2>
    <p class="hint row"><i class="sw un"></i>未檢查</p>
    <p class="hint row"><i class="sw su"></i>懷疑（未按壓）</p>
    <p class="hint row"><span>壓痛分 0</span><span class="grad"></span><span>10</span></p>
    <div class="card">${S.statuses.map(st => `<div class="row between" data-status="${esc(st.muscle)}">
      <span>${esc(mName(st.muscle))}${['L', 'R'].some(s => stopped.has(st.muscle + '|' + s)) ? '<span class="tag plain">停止處理</span>' : ''}</span>
      <span>${['L', 'R'].map(s => `<span class="stat">${swatch(st[s])}${SIDE[s]}${typeof st[s] === 'number' ? ' ' + st[s] : ''}</span>`).join('')}</span></div>`).join('')}</div>
    <p id="sent" role="status">正在把紀錄送到電腦…</p>
    <button class="wide" data-act="resend" hidden>再送一次</button>
    <button class="primary" data-act="again">開始新的一節</button>`, {
    resend: sendLog,
    again: () => { newSession(); screenStart(); },
  });
  S.endedAt = new Date().toISOString();
  const all = ai.load('phasy.sessions', []);
  ai.save('phasy.sessions', [...(Array.isArray(all) ? all : []).slice(-9), JSON.parse(logJson())]);
  await ai.saveSessionLog(JSON.parse(logJson()));
  sendLog();
}

// The Session log: every input, every LLM request and reply with timings, refusals. Never the key.
function logJson() {
  const set = ai.getSettings();
  const members = loadMembers();
  const { log, ...state } = S;
  const rec = {
    app: 'phasy-session-flow', libraryFile: LIB, libraryVersion: L.version,
    ...state,
    receiver: { slot: 'AB'[S.receiver], name: members[S.receiver] },
    settings: { base: set.base, model: set.model, effort: set.effort || null, keySet: ai.enabled() },
    llm: log.llm, refusals: log.refusals, notes: log.notes,
  };
  let json = JSON.stringify(rec);
  const key = String(set.key || '').trim();
  if (key.length >= 4) json = json.split(key).join('[已隱藏]');
  return json;
}

async function sendLog() {
  const out = $('#sent'), again = main.querySelector('[data-act="resend"]');
  try {
    const res = await fetch('log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: logJson() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    out.textContent = '紀錄已送到電腦';
    again.hidden = true;
  } catch (e) {
    out.textContent = `未能把紀錄送到電腦（${e.message}）。紀錄仍然保存在這部手機，可以再送一次。`;
    again.hidden = false;
  }
}

// ---------- settings

function refreshBanner() { $('#noai').hidden = ai.enabled(); }

function openSettings(open) {
  $('#settings').hidden = !open;
  $('#flow').hidden = open;
  if (!open) { refreshBanner(); return; }
  const s = ai.getSettings();
  $('#set-base').value = s.base; $('#set-model').value = s.model; $('#set-effort').value = s.effort; $('#set-key').value = s.key;
  $('#set-key').type = 'password'; $('#set-show').textContent = '顯示';
  $('#set-result').textContent = '';
  window.scrollTo(0, 0);
}
function saveSettingsFromForm() {
  ai.setSettings({ base: $('#set-base').value.trim(), model: $('#set-model').value.trim(), effort: $('#set-effort').value, key: $('#set-key').value.trim() });
  refreshBanner();
}
for (const id of ['#set-base', '#set-model', '#set-key']) $(id).addEventListener('input', saveSettingsFromForm);
$('#set-effort').addEventListener('change', saveSettingsFromForm);
$('#set-show').addEventListener('click', () => {
  const k = $('#set-key'), show = k.type === 'password';
  k.type = show ? 'text' : 'password';
  $('#set-show').textContent = show ? '隱藏' : '顯示';
});
$('#set-test').addEventListener('click', async () => {
  saveSettingsFromForm();
  $('#set-result').textContent = '正在測試…';
  $('#set-test').disabled = true;
  $('#set-result').textContent = await ai.testConnection();
  $('#set-test').disabled = false;
});
$('#open-settings').addEventListener('click', () => openSettings($('#settings').hidden));
$('#set-close').addEventListener('click', () => openSettings(false));

// ---------- boot

(async () => {
  refreshBanner();
  try {
    const res = await fetch(LIB, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    L = await res.json();
    idx = indexLibrary(L);
  } catch (e) {
    show('error', 1, `<h1>未能載入知識庫</h1><div class="card"><p>檔案：${esc(LIB)}</p><p>${esc(e.message)}</p></div>`);
    return;
  }
  newSession();
  screenStart();
})();

// llm.js — every LLM call, every prompt text and every Library id check lives here,
// so the owner can review all of it in one place (ADR 0001, ticket 12).
//
// Rules this file enforces:
// - The LLM only reasons; it names Library items by id, and every id is checked against the
//   allowed set of that step. Unknown ids are refused (dropped, logged, small note shown).
// - The API key goes only into the Authorization header of calls to the configured endpoint.
// - The LLM never receives a Member's name; the data calls the person 「受助者」.
// - No key, a failed call or a reply that is not JSON (after one retry) -> the caller uses the
//   step's fixed fallback, so a Session always runs to the end.

// ---------- storage (every access wrapped: private mode or blocked storage must not break the app)

export function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

// ---------- settings

const SETTINGS_KEY = 'phasy.settings';
// Model id per DeepSeek API docs (checked 2026-09-24): `deepseek-flash` (also `deepseek-v4-pro`).
export const DEFAULTS = { base: 'https://api.deepseek.com', model: 'deepseek-flash', effort: 'none', key: '' };
export const getSettings = () => ({ ...DEFAULTS, ...load(SETTINGS_KEY, {}) });
export const setSettings = s => save(SETTINGS_KEY, s);
export const enabled = () => !!String(getSettings().key || '').trim();

// ---------- prompts

const SYSTEM = `你是一位物理治療師，正在與一對沒有醫學背景的夫婦一起推理：一人是「受助者」，另一人可能是幫手。
你要像物理治療師一樣，一邊想，一邊用簡單的話說出理由。

規則：
1. 只提供指引，不作診斷。不要說受助者患了甚麼病。
2. 只用物理治療的角度解釋，例如肌肉、激痛點、牽涉痛、姿勢帶來的負荷。不可使用中醫的概念或用語，例如經絡、穴位、氣。
3. 用香港書面語的繁體中文，不可用粵語口語。要寫「的、了、在、沒有、不、那個、怎樣、為甚麼」這類書面語。
4. 句子要短，一句只說一件事。每個原因只用一句。
5. 知識庫的項目只可以用本次 data 中提供的 id 指稱。不可自創 id，不可選清單以外的項目。原因文字中不要寫 id，要寫中文名稱。
6. 不可自行說出身體姿勢、按壓位置、力度、時間或次數。這些由程式按知識庫顯示。
7. 稱呼對方為「受助者」。
8. 只回覆一個 JSON 物件，形狀完全依照 reply_format，不要加任何其他文字。`;

const TASKS = {
  map_situation: {
    instruction: '受助者用自己的話說出不適在甚麼情況下出現或加重（data.description）。從 data.situations 選出最吻合的一至兩項，只用 id。再用一句話說出你的理解，讓受助者確認。完全對不上時，situations 回覆空陣列，reading 用一句話說明。',
    reply: { situations: ['<situation id>'], reading: '<一句話>' },
  },
  pick_test: {
    instruction: '受助者說的情況不能即場做，或者沒有特定情況。從 data.tests 選一個測試動作，它要最能測試受助者不適的位置（data.complaint.zones）。只用 id，並用一句話說明原因。',
    reply: { test: '<situation id>', reason: '<一句話>' },
  },
  follow_up: {
    instruction: '你可以再問受助者簡短的問題，幫助判斷 data.candidates 中哪一條肌肉最可疑。一次只問一條，要短，要讓沒有醫學背景的人容易回答。data.asked 是已問過的問題和答案，不要重問。不要問姓名。資料已經足夠時，question 回覆 null。',
    reply: { question: '<一條短問題，或 null>' },
  },
  rank_candidates: {
    instruction: '為 data.candidates 排列可疑程度，最可疑的排最前。每一項用一句話說明原因，例如牽涉痛範圍、受助者說的情況、追問的答案。如果 data.others 中有肌肉也很可能有關，可以加入最多兩條，寫明哪一邊和原因；沒有需要就回覆空陣列。只用 id。',
    reply: {
      ranking: [{ muscle: '<muscle id>', side: '左 或 右', reason: '<一句話>' }],
      added: [{ muscle: '<muscle id>', side: '左 或 右', reason: '<一句話>' }],
    },
  },
  next_check: {
    instruction: '從 data.allowed 選下一個要做的檢查，只用 check id 和清單列明的一邊，並用一句話說明為甚麼先查它。data.done 是已做的檢查和結果。如果你認為資料已經足夠，可以停止檢查：stop 回覆 true，reason 寫明原因。',
    reply: { check: '<check id，停止時為 null>', side: '左 或 右', reason: '<一句話>', stop: false },
  },
  plan: {
    instruction: '受助者已選了 data.muscles 這些肌肉來處理。從 data.allowed 揀處理項目，只用 id，每項用一句話說明原因。不用全選，揀最合適的；每條肌肉最少要有一個伸展。同一條肌肉如果選了拔罐，就不要再選它的手法（剛拔罐的位置不宜按壓）。',
    reply: { items: [{ id: '<treatment id>', reason: '<一句話>' }] },
  },
  summary: {
    instruction: '用不多於 120 字為這一節寫總結給受助者：找到甚麼、做了甚麼、前後分數有甚麼變化、下次可以留意甚麼。不作診斷，不寫姿勢、力度、時間或次數。',
    reply: { summary: '<不多於 120 字>' },
  },
  ping: {
    instruction: '這是連線測試。請回覆 {"ok": true}。',
    reply: { ok: true },
  },
};

// ---------- session log, notes and names (set by the app at the start of each Session)

let log = { llm: [], refusals: [], notes: [] };
let noteSink = () => {};
let names = new Map(); // Library id -> Chinese display name, used to clean ids out of free text

export function begin(sessionLog, nameMap, onNote) { log = sessionLog; names = nameMap; noteSink = onNote; }
function note(text) {
  log.notes.push({ at: new Date().toISOString(), text });
  noteSink(text);
}

// ---------- transport

const TIMEOUT_MS = 90000;
let effortRejected = false; // set when the endpoint answers 400 to reasoning_effort; lasts until reload
let current = null; // controller of the call in flight

// 「不等了」 button: stop the call in flight; the step then uses its fallback.
export function abort() { current?.abort('user'); }

async function post(task, attempt, body) {
  const s = getSettings();
  const url = String(s.base).trim().replace(/\/+$/, '') + '/chat/completions';
  const entry = { task, attempt, at: new Date().toISOString(), request: { url, ...body }, status: 0, ms: 0 };
  log.llm.push(entry);
  const t0 = performance.now();
  const ctl = new AbortController();
  current = ctl;
  const timer = setTimeout(() => ctl.abort('timeout'), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + String(s.key).trim() },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    entry.status = res.status;
    entry.ms = Math.round(performance.now() - t0);
    if (!res.ok) { entry.error = text.slice(0, 2000); return { status: res.status, text, ms: entry.ms }; }
    let msg;
    try { msg = JSON.parse(text).choices[0].message; } catch { entry.error = 'reply is not a chat completion'; entry.reply = text.slice(0, 2000); return { status: res.status, content: '', ms: entry.ms }; }
    entry.reply = msg.content ?? '';
    if (msg.reasoning_content) entry.reasoning = msg.reasoning_content;
    return { status: res.status, content: entry.reply, ms: entry.ms };
  } catch (e) {
    entry.ms = Math.round(performance.now() - t0);
    const why = ctl.signal.aborted ? ctl.signal.reason : null;
    if (why === 'user') entry.aborted = true;
    entry.error = why === 'user' ? 'aborted' : why ? 'timeout' : String(e.message || e);
    return { status: 0, error: entry.error, aborted: why === 'user', ms: entry.ms };
  } finally {
    clearTimeout(timer);
    if (current === ctl) current = null;
  }
}

// One chat call. If the endpoint rejects reasoning_effort with 400, retry once without it.
async function chat(task, userContent, attempt) {
  const s = getSettings();
  const body = {
    model: String(s.model).trim(),
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userContent }],
    response_format: { type: 'json_object' },
  };
  if (s.effort && !effortRejected) body.reasoning_effort = s.effort;
  let r = await post(task, attempt, body);
  if (r.status === 400 && body.reasoning_effort && /reasoning/i.test(r.text || '')) {
    effortRejected = true;
    delete body.reasoning_effort;
    note('這個 AI 端點不接受「推理深度」設定，已略過這個設定。');
    r = await post(task, attempt, body);
  }
  return r;
}

function parse(content) {
  const t = String(content ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { const j = JSON.parse(t); return j && typeof j === 'object' && !Array.isArray(j) ? j : null; } catch { return null; }
}

const ok2xx = s => s >= 200 && s < 300;

// Returns the reply as an object, or null (the caller then uses the step's fixed fallback).
async function ask(task, data) {
  if (!enabled()) return null;
  const t = TASKS[task];
  const user = JSON.stringify({ task, instruction: t.instruction, reply_format: t.reply, data });
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await chat(task, user, attempt);
    if (r.aborted) { note('已停止等候 AI，這一步改用預設做法。'); return null; }
    if (!ok2xx(r.status)) { note('AI 暫時未能回覆，這一步改用預設做法。'); return null; }
    const j = parse(r.content);
    if (j) return j;
  }
  note('AI 的回覆格式不正確，這一步改用預設做法。');
  return null;
}

// ---------- id checks and text cleaning

// Keep only ids in the allowed set; refuse the rest (logged, one small note per reply).
function keep(task, ids, allowed) {
  const good = [], bad = [];
  for (const id of ids) (typeof id === 'string' && allowed.has(id) ? good : bad).push(id);
  if (bad.length) {
    for (const id of bad) log.refusals.push({ task, id: typeof id === 'string' ? id : JSON.stringify(id), at: new Date().toISOString() });
    note('AI 回覆了知識庫以外的項目，已略過。');
  }
  return good;
}

// Free text from the LLM: ids are replaced by their Chinese names; unknown ids are removed.
const ID_LIKE = /\b(?:z|s|m|tp|c|st|mt|cp)-[a-z0-9]+(?:-[a-z0-9]+)*/gi;
function text(v, max = 200) {
  if (typeof v !== 'string') return '';
  return v.replace(ID_LIKE, id => names.get(id.toLowerCase()) || '').replace(/[ \t]{2,}/g, ' ').trim().slice(0, max);
}

const arr = v => (Array.isArray(v) ? v : v == null ? [] : [v]);
const rows = v => arr(v).filter(r => r && typeof r === 'object');
const SIDES = { 左: 'L', 右: 'R', L: 'L', R: 'R', left: 'L', right: 'R', 左邊: 'L', 右邊: 'R' };
const sideOf = v => SIDES[String(v ?? '').trim().toLowerCase()] || SIDES[String(v ?? '').trim()] || null;

// ---------- one function per LLM step (each returns null when the fallback must be used)

export async function mapSituation(data, allowed) {
  const j = await ask('map_situation', data);
  if (!j) return null;
  return { ids: keep('map_situation', arr(j.situations), allowed).slice(0, 2), reading: text(j.reading) };
}

export async function pickTest(data, allowed) {
  const j = await ask('pick_test', data);
  if (!j) return null;
  const [id] = keep('pick_test', arr(j.test).slice(0, 1), allowed);
  return id ? { id, reason: text(j.reason) } : null;
}

export async function followUp(data) {
  const j = await ask('follow_up', data);
  return (j && text(j.question, 120)) || null;
}

// candidateIds: muscles on the candidate list; otherIds: Library muscles the LLM may add; sides: Complaint sides.
export async function rankCandidates(data, candidateIds, otherIds, sides) {
  const j = await ask('rank_candidates', data);
  if (!j) return null;
  const ranking = rows(j.ranking), added = rows(j.added);
  const okR = new Set(keep('rank_candidates', ranking.map(r => r.muscle), candidateIds));
  const okA = new Set(keep('rank_candidates', added.map(r => r.muscle), otherIds));
  return {
    ranking: ranking.filter(r => okR.has(r.muscle)).map(r => ({ muscle: r.muscle, side: sideOf(r.side), reason: text(r.reason) })),
    added: added.filter(r => okA.has(r.muscle)).slice(0, 2)
      .map(r => ({ muscle: r.muscle, sides: sides.includes(sideOf(r.side)) ? [sideOf(r.side)] : sides, reason: text(r.reason) }))
      .filter(r => r.reason), // an added muscle must come with a reason
  };
}

// allowed: [{ check, side, ... }] — the checks not yet done that the fixed rules allow.
export async function nextCheck(data, allowed) {
  const j = await ask('next_check', data);
  if (!j) return null;
  const reason = text(j.reason);
  if (j.stop === true && reason) return { stop: true, reason }; // stopping early needs a stated reason
  // The check must be allowed on the side named (a found muscle × side has no checks left).
  const id = arr(j.check)[0], side = sideOf(j.side);
  if (id == null) return null;
  const a = allowed.find(x => x.check === id && (!side || x.side === side));
  if (!a) { keep('next_check', [allowed.some(x => x.check === id) ? `${id}|${side}` : id], new Set()); return null; }
  return { ...a, reason };
}

export async function plan(data, allowed) {
  const j = await ask('plan', data);
  if (!j) return null;
  const items = rows(j.items);
  const good = new Set(keep('plan', items.map(r => r.id), allowed));
  const seen = new Set();
  return items.filter(r => good.has(r.id) && !seen.has(r.id) && seen.add(r.id)).map(r => ({ id: r.id, reason: text(r.reason) }));
}

export async function summary(data) {
  const j = await ask('summary', data);
  return j ? text(j.summary, 400) || null : null;
}

// Settings screen 「測試連線」: one tiny call, answered in plain words.
export async function testConnection() {
  const s = getSettings();
  if (!enabled()) return '請先輸入 API 金鑰。';
  if (!/^https?:\/\/\S+$/i.test(String(s.base).trim())) return '端點網址要以 https:// 開頭。';
  const before = effortRejected;
  const r = await chat('ping', JSON.stringify({ task: 'ping', instruction: TASKS.ping.instruction, reply_format: TASKS.ping.reply, data: {} }), 1);
  const extra = effortRejected && !before ? '這個端點不接受推理深度設定，之後會自動略過。' : '';
  if (ok2xx(r.status)) {
    return (parse(r.content) ? `連線成功，AI 有回覆（用了 ${(r.ms / 1000).toFixed(1)} 秒）。` : '已經連線，但 AI 的回覆格式不正確，可以換一個模型再試。') + extra;
  }
  const byCode = { 400: '伺服器不接受這個請求，請檢查模型名稱。', 401: '金鑰不正確或已經失效。', 402: '帳戶餘額不足，請先增值。',
    404: '找不到這個網址或模型，請檢查端點網址和模型名稱。', 429: '請求太多，請稍後再試。' };
  if (byCode[r.status]) return byCode[r.status];
  if (r.status >= 500) return 'AI 服務暫時出錯，請稍後再試。';
  if (r.status) return `伺服器拒絕了請求（代碼 ${r.status}）。`;
  return r.error === 'timeout' ? '等了很久仍然沒有回覆，請稍後再試。' : '連不上：請檢查端點網址和網絡。';
}

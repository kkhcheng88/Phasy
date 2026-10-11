// teach.mjs — resolve Library ids into a teaching plan. No DOM, no 3D, no LLM.
// The LLM is not used here (ADR 0001): every item is a Library id; unknown ids are refused.

export const KIND_ZH = { cupping: '抽真空拔罐', manual: '手法', stretch: '伸展' };
export const ROUNDS = ['cupping', 'manual', 'stretch'];
export const SIDE = { L: '左', R: '右' };
export const SEARCH_CIRCLE = '在這一點附近約一至兩指寬的範圍內慢慢按，找最痛的一點。';
export const CUPPING_TOGETHER = '所有杯一起放好，再用一個計時。';

export function indexLibrary(lib) {
  const m = new Map();
  const put = (type, item, muscle) => m.set(item.id, { type, item, muscle });
  for (const z of lib.zones ?? []) put('zone', z);
  for (const s of lib.situations ?? []) put('situation', s);
  for (const p of lib.pressureLevels ?? []) put('pressure', p);
  for (const mu of lib.muscles ?? []) {
    put('muscle', mu, mu);
    for (const [k, type] of [['triggerPoints', 'tp'], ['checks', 'check'], ['stretches', 'stretch'], ['manual', 'manual'], ['cupping', 'cupping']])
      for (const x of mu[k] ?? []) put(type, x, mu);
  }
  return m;
}

export function itemLabel(idx, id) {
  const e = idx.get(id);
  if (!e) return '';
  if (e.type === 'muscle') return e.item.nameZh;
  if (e.item.name) return e.item.name;
  return id;
}

// Cupping round: one 5–10 min timer for every cup (ticket 06 / 13). Other rounds take time from Right amount.
export function parseHold(time, kind) {
  if (kind === 'cupping') {
    return { options: [300, 600], labels: ['5 分鐘', '10 分鐘'], shared: true };
  }
  const t = String(time ?? '');
  const minRange = t.match(/(\d+)\s*至\s*(\d+)\s*分鐘/) || t.match(/(\d+)\s*[–-]\s*(\d+)\s*分鐘/);
  if (minRange) {
    return { options: [+minRange[1] * 60, +minRange[2] * 60], labels: [`${minRange[1]} 分鐘`, `${minRange[2]} 分鐘`], shared: false };
  }
  const secRange = t.match(/(\d+)\s*至\s*(\d+)\s*秒/);
  if (secRange) {
    return { options: [+secRange[1], +secRange[2]], labels: [`${secRange[1]} 秒`, `${secRange[2]} 秒`], shared: false };
  }
  const min = t.match(/(\d+)\s*分鐘/);
  if (min) return { options: [+min[1] * 60], labels: [`${min[1]} 分鐘`], shared: false };
  const sec = t.match(/(\d+)\s*秒/);
  if (sec) return { options: [+sec[1]], labels: [`${sec[1]} 秒`], shared: false };
  return { options: [30], labels: ['30 秒'], shared: false };
}

export function resolvePlan(demo, idx) {
  const refusals = [];
  const side = demo.side === 'L' ? 'L' : 'R';
  const rounds = [];
  for (const r of demo.plan ?? []) {
    if (!ROUNDS.includes(r.kind)) {
      refusals.push({ id: r.kind, reason: 'unknown-kind' });
      continue;
    }
    const items = [];
    for (const id of r.ids ?? []) {
      const e = idx.get(id);
      if (!e || e.type !== r.kind) {
        refusals.push({ id, reason: 'not-in-library' });
        continue;
      }
      items.push({
        id,
        kind: r.kind,
        muscle: e.muscle.id,
        item: e.item,
        overlay: demo.overlays?.[id] ?? {},
      });
    }
    if (items.length) rounds.push({ kind: r.kind, items, hold: parseHold(items[0].item.rightAmount?.time, r.kind) });
  }
  return { side, rounds, refusals };
}

export function bp3dIdsForRound(round, idx, side) {
  const out = [];
  for (const it of round.items) {
    const add = mid => {
      const fj = idx.get(mid)?.item?.bp3d?.[side];
      if (fj && !out.includes(fj)) out.push(fj);
    };
    add(it.muscle);
    for (const t of it.item.targets ?? []) add(t);
  }
  return out;
}

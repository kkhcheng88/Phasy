// Validates library.json against LIBRARY-FORMAT.md.
// Usage: node check-library.mjs [path/to/library.json]
// Exit 0 and print "OK <counts>" when valid; exit 1 with one line per problem otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(process.argv[2] ?? path.join(here, 'library.json'));
const manifestFile = path.resolve(here, '../../.scratch/phasy/data/bodyparts3d/manifest.json');

const errors = [];
const err = (msg) => errors.push(msg);
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

let lib;
try {
  lib = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`ERROR: cannot read or parse ${file}: ${e.message}`);
  process.exit(1);
}

// Cantonese colloquial forms that must not appear in any visible text.
const BANNED = ['嘅', '咗', '唔', '喺', '冇', '嗰', '啲', '係', '點樣', '佢', '睇', '嘢', '咁', '嚟', '瞓', '攞', '揸', '㩒', '啱', '晾衫'];
// Muscles near the carotid pulse and the nerves to the arm: light checks only, no cupping.
const LIGHT_ONLY = ['m-scm', 'm-scalenes'];
const REGIONS = ['head', 'neck', 'shoulder', 'upper-back', 'arm'];
const PRESSURES = ['light', 'standard', 'deep'];

const sources = lib.sources && typeof lib.sources === 'object' ? lib.sources : {};
if (!nonEmpty(lib.version)) err('version is missing');
if (!sources.travell3) err('sources.travell3 is missing');
for (const k of ['pressureLevels', 'zones', 'situations', 'muscles']) {
  if (!Array.isArray(lib[k])) { err(`${k} must be an array`); lib[k] = []; }
}

// ---- id registry: unique across the file, prefix per type ----
const seen = new Map();
const kinds = new Map(); // id -> type
function registerId(obj, prefix, where) {
  const id = obj?.id;
  if (!nonEmpty(id)) return err(`${where}: missing id`);
  if (seen.has(id)) err(`duplicate id "${id}" (${where}; first at ${seen.get(id)})`);
  else seen.set(id, where);
  if (!/^[a-z0-9-]+$/.test(id)) err(`id "${id}" must be lowercase a-z0-9-`);
  if (prefix && !id.startsWith(prefix)) err(`id "${id}" (${where}) must start with "${prefix}"`);
  kinds.set(id, prefix || 'pressure');
}

lib.pressureLevels.forEach((p, i) => registerId(p, null, `pressureLevels[${i}]`));
const pressureIds = lib.pressureLevels.map((p) => p.id);
if (pressureIds.length !== 3 || !PRESSURES.every((p) => pressureIds.includes(p)))
  err(`pressureLevels must be exactly ${PRESSURES.join(', ')}; got ${pressureIds.join(', ')}`);
lib.pressureLevels.forEach((p) => {
  for (const f of ['name', 'force', 'howToLearn']) if (!nonEmpty(p[f])) err(`pressure "${p.id}": ${f} is empty`);
  if (p.source) checkSource(p.source, `pressure "${p.id}"`);
});

lib.zones.forEach((z, i) => registerId(z, 'z-', `zones[${i}]`));
lib.situations.forEach((s, i) => registerId(s, 's-', `situations[${i}]`));
lib.muscles.forEach((m, i) => {
  registerId(m, 'm-', `muscles[${i}]`);
  const at = `muscle ${m.id}`;
  for (const [key, prefix] of [['triggerPoints', 'tp-'], ['checks', 'c-'], ['stretches', 'st-'], ['manual', 'mt-'], ['cupping', 'cp-']]) {
    if (!Array.isArray(m[key])) { err(`${at}: ${key} must be an array`); m[key] = []; }
    m[key].forEach((x, j) => registerId(x, prefix, `${at}.${key}[${j}]`));
  }
});

const isType = (id, prefix) => kinds.get(id) === prefix;

function checkSource(src, where) {
  if (!src || typeof src !== 'object') return err(`${where}: source is missing`);
  if (!Object.hasOwn(sources, src.ref)) err(`${where}: source.ref "${src.ref}" is not a key in sources`);
  if (!nonEmpty(src.page)) err(`${where}: source.page is empty (use "not found" when unknown)`);
  if ('adapted' in src && typeof src.adapted !== 'boolean') err(`${where}: source.adapted must be true or false`);
}
function checkRightAmount(ra, where) {
  for (const f of ['strength', 'time', 'right', 'wrong'])
    if (!nonEmpty(ra?.[f])) err(`${where}: rightAmount.${f} is missing`);
}

// ---- zones ----
for (const z of lib.zones) {
  if (!nonEmpty(z.name)) err(`zone ${z.id}: name is empty`);
  if (!REGIONS.includes(z.region)) err(`zone ${z.id}: region "${z.region}" not in ${REGIONS.join('|')}`);
  if (typeof z.sided !== 'boolean') err(`zone ${z.id}: sided must be true or false`);
}

// ---- situations ----
for (const s of lib.situations) {
  const at = `situation ${s.id}`;
  if (!nonEmpty(s.name)) err(`${at}: name is empty`);
  if (!['posture', 'movement'].includes(s.kind)) err(`${at}: kind "${s.kind}" must be posture or movement`);
  for (const f of ['onTheSpot', 'testMovement']) if (typeof s[f] !== 'boolean') err(`${at}: ${f} must be true or false`);
  if (s.testMovement === true && !nonEmpty(s.testHowTo)) err(`${at}: testMovement is true but testHowTo is empty`);
  if (!Array.isArray(s.loads)) err(`${at}: loads must be an array`);
  else for (const id of s.loads) if (!isType(id, 'm-')) err(`${at}: loads "${id}" is not a muscle id`);
  if (!Array.isArray(s.zones)) err(`${at}: zones must be an array`);
  else for (const id of s.zones) if (!isType(id, 'z-')) err(`${at}: zones "${id}" is not a zone id`);
}

// ---- muscles ----
let manifest = null;
try {
  const raw = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest = new Map(raw.map((e) => [e.fj, e]));
} catch {
  console.warn(`note: manifest not found at ${manifestFile}; bp3d ids not checked`);
}

for (const m of lib.muscles) {
  const at = `muscle ${m.id}`;
  for (const f of ['nameZh', 'nameEn', 'action', 'attachments']) if (!nonEmpty(m[f])) err(`${at}: ${f} is empty`);
  if (!['surface', 'deep'].includes(m.depth)) err(`${at}: depth "${m.depth}" must be surface or deep`);
  if (typeof m.cuppingSuits !== 'boolean') err(`${at}: cuppingSuits must be true or false`);
  if (m.cuppingSuits === false && m.cupping.length) err(`${at}: cuppingSuits is false but it has ${m.cupping.length} cupping item(s)`);
  if (m.cuppingSuits === true && !m.cupping.length) err(`${at}: cuppingSuits is true but cupping is empty`);

  if (!m.bp3d || typeof m.bp3d !== 'object' || !('L' in m.bp3d) || !('R' in m.bp3d)) err(`${at}: bp3d needs L and R (null when missing)`);
  else if (manifest) {
    for (const side of ['L', 'R']) {
      const id = m.bp3d[side];
      if (id === null) continue;
      const e = manifest.get(id);
      if (!e) err(`${at}: bp3d.${side} "${id}" is not in manifest.json`);
      else if (e.side && e.side !== side) err(`${at}: bp3d.${side} "${id}" is the ${e.side} side in manifest.json`);
    }
  }

  // Minimum content per muscle.
  if (!m.triggerPoints.length) err(`${at}: needs at least one trigger point`);
  if (!m.checks.length) err(`${at}: needs at least one check`);
  if (!m.stretches.some((s) => s.helper === false)) err(`${at}: needs at least one stretch with helper false`);

  const ownTps = new Set(m.triggerPoints.map((t) => t.id));
  for (const t of m.triggerPoints) {
    const w = `trigger point ${t.id}`;
    for (const f of ['name', 'landmark']) if (!nonEmpty(t[f])) err(`${w}: ${f} is empty`);
    if (!Array.isArray(t.referral) || !t.referral.length) err(`${w}: referral must list at least one zone`);
    else for (const z of t.referral) if (!isType(z, 'z-')) err(`${w}: referral "${z}" is not a zone id`);
    if (!nonEmpty(t.at)) err(`${w}: at is missing (the zone the trigger point lies in)`);
    else if (!isType(t.at, 'z-')) err(`${w}: at "${t.at}" is not a zone id`);
    if ('noPress' in t && typeof t.noPress !== 'boolean') err(`${w}: noPress must be true or false`);
    if (LIGHT_ONLY.includes(m.id) && t.noPress !== true) err(`${w}: ${m.id} trigger points must have noPress true (locate only, never press inward)`);
    checkSource(t.source, w);
  }
  // Stretches, manual techniques and cupping placements need a name, unique within the muscle.
  const names = new Map();
  for (const [key, label] of [['stretches', 'stretch'], ['manual', 'manual'], ['cupping', 'cupping']]) {
    for (const x of m[key]) {
      if (!nonEmpty(x.name)) { err(`${label} ${x.id}: name is empty`); continue; }
      if (names.has(x.name)) err(`${label} ${x.id}: name "${x.name}" is also used by ${names.get(x.name)} in ${m.id}`);
      else names.set(x.name, x.id);
    }
  }
  for (const c of m.checks) {
    const w = `check ${c.id}`;
    if (!['press', 'position', 'movement'].includes(c.kind)) err(`${w}: kind "${c.kind}" must be press, position or movement`);
    if (!(ownTps.has(c.target) || c.target === m.id)) err(`${w}: target "${c.target}" is not a trigger point of ${m.id} or ${m.id} itself`);
    for (const f of ['receiverPosition', 'helperMethod']) if (!nonEmpty(c[f])) err(`${w}: ${f} is empty`);
    if (!pressureIds.includes(c.pressure)) err(`${w}: pressure "${c.pressure}" is not a pressure level id`);
    if (typeof c.alone !== 'boolean') err(`${w}: alone must be true or false`);
    if (c.alone === true && !nonEmpty(c.aloneMethod)) err(`${w}: alone is true but aloneMethod is empty`);
    if (LIGHT_ONLY.includes(m.id) && c.pressure !== 'light') err(`${w}: ${m.id} checks must use pressure "light"`);
    checkSource(c.source, w);
  }
  for (const s of m.stretches) {
    const w = `stretch ${s.id}`;
    if (!Array.isArray(s.targets) || !s.targets.length) err(`${w}: targets must list at least one muscle`);
    else for (const t of s.targets) if (!isType(t, 'm-')) err(`${w}: target "${t}" is not a muscle id`);
    if (!nonEmpty(s.startPosition)) err(`${w}: startPosition is empty`);
    if (!Array.isArray(s.steps) || !s.steps.length || !s.steps.every(nonEmpty)) err(`${w}: steps must be non-empty text`);
    if (typeof s.helper !== 'boolean') err(`${w}: helper must be true or false`);
    if (!nonEmpty(s.reps)) err(`${w}: reps is empty`);
    checkRightAmount(s.rightAmount, w);
    checkSource(s.source, w);
  }
  for (const t of m.manual) {
    const w = `manual ${t.id}`;
    if (!nonEmpty(t.kind)) err(`${w}: kind is empty`);
    if (!(isType(t.target, 'tp-') || isType(t.target, 'm-'))) err(`${w}: target "${t.target}" is not a trigger point or muscle id`);
    if (!Array.isArray(t.steps) || !t.steps.length || !t.steps.every(nonEmpty)) err(`${w}: steps must be non-empty text`);
    checkRightAmount(t.rightAmount, w);
    // Book dose (Travell p.1878): about 90 s below the pain threshold, or about 30 s at tolerance; never both.
    if (/4–6/.test(t.rightAmount?.strength ?? '') && /90 秒/.test(t.rightAmount?.time ?? '')) err(`${w}: 4–6 / 10 must not be held for about 90 s (use 2–4 / 10 for 90 s, or 4–6 / 10 for about 30 s)`);
    checkSource(t.source, w);
  }
  for (const c of m.cupping) {
    const w = `cupping ${c.id}`;
    for (const f of ['position', 'cupSize']) if (!nonEmpty(c[f])) err(`${w}: ${f} is empty`);
    if (!['static', 'sliding'].includes(c.method)) err(`${w}: method "${c.method}" must be static or sliding`);
    checkRightAmount(c.rightAmount, w);
    checkSource(c.source, w);
  }
  if (LIGHT_ONLY.includes(m.id) && m.cuppingSuits !== false) err(`${at}: must have cuppingSuits false`);
}

// ---- banned colloquial forms in any string ----
(function scan(v, where) {
  if (typeof v === 'string') {
    for (const b of BANNED) if (v.includes(b)) err(`${where}: contains colloquial "${b}"`);
  } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${where}.${k}`);
})(lib, '$');

if (errors.length) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  console.error(`FAILED: ${errors.length} problem(s) in ${file}`);
  process.exit(1);
}

const sum = (k) => lib.muscles.reduce((n, m) => n + m[k].length, 0);
console.log(`OK zones=${lib.zones.length} situations=${lib.situations.length} muscles=${lib.muscles.length} ` +
  `triggerPoints=${sum('triggerPoints')} checks=${sum('checks')} stretches=${sum('stretches')} ` +
  `manual=${sum('manual')} cupping=${sum('cupping')}`);

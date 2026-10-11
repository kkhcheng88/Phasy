// app.js — ticket 13 teaching overlay on the 3D muscle view. Content comes from Library ids.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as T from './teach.mjs';

const $ = s => document.querySelector(s);
const main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SRC_SHORT = { travell3: 'Travell 第 3 版', cupping2026: '拔罐研究筆記' };

let L, idx, demo, plan;
let roundI = 0, stepI = 0, solo = false;
let acts = {};
const timer = { id: 0 };

function show(name, html, handlers = {}, back = null) {
  clearInterval(timer.id);
  acts = { ...handlers, back };
  main.dataset.screen = name;
  main.dataset.n = String(+main.dataset.n + 1);
  main.innerHTML = (back ? '<button class="back" data-act="back">‹ 上一步</button>' : '') + html;
  document.querySelector('.bottom').scrollTop = 0;
}
main.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) acts[b.dataset.act]?.(b.dataset.v, b);
});

const srcLine = x => {
  if (!x?.source) return '';
  const page = String(x.source.page ?? '');
  return `<p class="src">來源：${esc(SRC_SHORT[x.source.ref] ?? x.source.ref)}${page ? '，' + esc(/^\d/.test(page) ? '頁 ' + page : page) : ''}</p>`;
};
const rightAmount = ra => (ra ? `<dl class="ra"><dt>力度</dt><dd>${esc(ra.strength)}</dd><dt>時間</dt><dd>${esc(ra.time)}</dd>
  <dt>正確感覺</dt><dd>${esc(ra.right)}</dd><dt>不對的感覺</dt><dd>${esc(ra.wrong)}</dd></dl>` : '');

function notesHtml() {
  return (plan?.refusals ?? []).map(r =>
    `<p class="note" role="status">AI 回覆了知識庫以外的項目，已略過（${esc(r.id)}）。</p>`).join('');
}

function screenPick() {
  roundI = 0; stepI = 0; solo = false;
  main.dataset.round = '';
  highlight([]);
  show('pick', `
    ${notesHtml()}
    <h1>沒有影片，怎樣跟着做？</h1>
    <p class="hint">3D 圖會標出要處理的肌肉和搜尋圈，文字列出步驟、合適程度和計時。全部內容來自知識庫編號。</p>
    <button class="primary" data-act="plan">跟一次處理方案</button>
    <p class="hint">次序：抽真空拔罐（所有杯一起放）→ 手法 → 伸展</p>
    <button class="wide" data-act="one" data-v="cupping">只看拔罐</button>
    <button class="wide" data-act="one" data-v="manual">只看手法</button>
    <button class="wide" data-act="one" data-v="stretch">只看伸展</button>`, {
    plan: () => { solo = false; roundI = 0; screenRound(); },
    one: v => {
      const i = plan.rounds.findIndex(r => r.kind === v);
      if (i < 0) return;
      solo = true;
      roundI = i;
      screenRound();
    },
  });
  paintTeach();
}

function itemBody(it) {
  const x = it.item;
  let body = '';
  if (it.kind === 'cupping') {
    body = `<dl><dt>放在哪裏</dt><dd>${esc(x.position)}</dd><dt>杯的大小</dt><dd>${esc(x.cupSize)}</dd>
      <dt>方法</dt><dd>${x.method === 'sliding' ? '走罐（杯在皮膚上慢慢滑動）' : '定罐（杯留在原位）'}</dd></dl>
      <p class="circle">${T.SEARCH_CIRCLE}</p>`;
  } else if (it.kind === 'manual') {
    const tp = idx.get(x.target);
    body = `<dl><dt>手法</dt><dd>${esc(x.kind)}</dd>
      <dt>位置</dt><dd>${esc(tp?.item?.landmark ?? '')}<br><span class="circle">${T.SEARCH_CIRCLE}</span></dd></dl>`;
  } else {
    body = `<p><span class="tag">${x.helper ? '需要幫手' : '自己做'}</span></p>
      <dl><dt>開始姿勢</dt><dd>${esc(x.startPosition)}</dd></dl>
      ${x.reps ? `<dl><dt>次數</dt><dd>${esc(x.reps)}</dd></dl>` : ''}`;
  }
  const steps = x.steps ?? [];
  const list = steps.length ? `<ol>${steps.map((s, i) => `<li class="${i === stepI ? 'on' : ''}">${esc(s)}</li>`).join('')}</ol>` : '';
  return `<div class="card-item" data-item="${esc(it.id)}">
    <h3>${esc(it.item.name)}・${T.SIDE[plan.side]}邊</h3>
    <p class="en">${esc(idx.get(it.muscle)?.item.nameZh)} · ${esc(it.id)}</p>
    ${body}${list}<h2>合適程度</h2>${rightAmount(x.rightAmount)}${srcLine(x)}</div>`;
}

function screenRound() {
  const round = plan.rounds[roundI];
  if (!round) return screenPick();
  stepI = 0;
  const last = solo || roundI === plan.rounds.length - 1;
  const hold = round.hold;
  const stepCount = Math.max(0, ...round.items.map(it => (it.item.steps ?? []).length));
  main.dataset.round = round.kind;
  show('teach', `
    ${notesHtml()}
    <h1>第 ${roundI + 1} 輪：${T.KIND_ZH[round.kind]}</h1>
    <p class="hint">${round.items.map(it => esc(it.item.name)).join('、')}</p>
    ${round.kind === 'cupping' ? `<p class="hint">${T.CUPPING_TOGETHER}</p>` : ''}
    ${round.items.map(itemBody).join('')}
    <div class="timer" data-timer="${esc(round.kind)}"><div class="clock" id="clock">計時</div>
      <div class="choices">${hold.options.map((s, i) => `<button data-act="time" data-v="${s}">${esc(hold.labels[i])}</button>`).join('')}</div>
      <button class="wide" data-act="tstop">停止計時</button></div>
    ${stepCount > 1 ? `<button class="wide" data-act="step">下一步驟</button>` : ''}
    <button class="primary" data-act="next">${last ? '完成' : `下一輪：${T.KIND_ZH[plan.rounds[roundI + 1].kind]}`}</button>`, {
    time: v => startTimer(+v),
    tstop: () => { clearInterval(timer.id); const c = $('#clock'); if (c) c.textContent = '計時'; },
    step: () => {
      const steps = [...main.querySelectorAll('ol li')];
      if (!steps.length) return;
      stepI = Math.min(steps.length - 1, stepI + 1);
      steps.forEach((li, i) => li.classList.toggle('on', i === stepI));
    },
    next: () => { if (last) screenPick(); else { roundI += 1; screenRound(); } },
  }, screenPick);
  paintTeach();
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

window.__teach = () => ({
  screen: main.dataset.screen,
  round: plan?.rounds[roundI]?.kind ?? null,
  ids: (plan?.rounds[roundI]?.items ?? []).map(i => i.id),
  refusals: plan?.refusals ?? [],
  side: plan?.side,
  libraryVersion: L?.version,
});

// ---------- 3D (same model and shader idea as prototypes/3d-muscle-view) ----------

const HIGHLIGHT = new THREE.Color('#06b6d4'), DIM = new THREE.Color('#c5c0b8');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f96, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(0.6, 1, 1.2); camera.add(key);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.3; controls.maxDistance = 6;

let parts = [], stateTex, stateData, muscles, bones, root, bodyHeight = 1.8, frac = 1;
const overlay = new THREE.Group();
scene.add(overlay);
const uniforms = { partState: { value: null }, pxRatio: { value: renderer.getPixelRatio() } };
let pendingHighlight = [];

function paint(i, mode) {
  const c = mode === 'on' ? HIGHLIGHT : DIM;
  const o = i * 4;
  stateData[o] = c.r * 255; stateData[o + 1] = c.g * 255; stateData[o + 2] = c.b * 255;
  stateData[o + 3] = mode === 'hide' ? 0 : 255;
}
function muscleMaterial() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float _part;\nuniform sampler2D partState;\nvarying vec4 vPart;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPart = texelFetch(partState, ivec2(int(_part + 0.5), 0), 0);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vPart;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vPart.a < 0.05) discard;
        diffuseColor.rgb = vPart.rgb;`);
  };
  return m;
}

function highlight(fjIds) {
  pendingHighlight = fjIds;
  if (!parts.length) return;
  const want = new Set(fjIds);
  const isolate = fjIds.length > 0;
  parts.forEach((p, i) => paint(i, isolate ? (want.has(p.id) ? 'on' : 'hide') : 'dim'));
  stateTex.needsUpdate = true;
}

function partIndex(fj) { return parts.findIndex(p => p.id === fj); }

function partPoints(i) {
  const g = muscles.geometry, pos = g.getAttribute('position'), part = g.getAttribute('_part'), ix = g.index;
  const mw = muscles.matrixWorld, v = new THREE.Vector3(), pts = [];
  for (let t = 0; t < ix.count; t += 3) {
    if (part.getX(ix.getX(t)) !== i) continue;
    v.fromBufferAttribute(pos, ix.getX(t)).applyMatrix4(mw);
    pts.push(v.clone());
  }
  return pts;
}

function pickPoint(pts, mode, side) {
  if (!pts.length) return new THREE.Vector3();
  const ys = pts.map(p => p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const midY = (minY + maxY) / 2;
  const lat = p => (side === 'R' ? p.x : -p.x);
  const scored = pts.map(p => {
    let s = 0;
    if (mode === 'lateral-high') s = lat(p) * 2 - Math.abs(p.y - (minY + 0.55 * (maxY - minY)));
    else if (mode === 'medial-mid') s = -Math.abs(p.x) - Math.abs(p.y - midY);
    else if (mode === 'superior') s = p.y;
    else if (mode === 'inferior') s = -p.y + lat(p) * 0.4;
    else s = -Math.abs(p.y - midY);
    return { p, s };
  });
  scored.sort((a, b) => b.s - a.s);
  const n = Math.max(1, Math.floor(scored.length * 0.08));
  const c = new THREE.Vector3();
  for (let k = 0; k < n; k++) c.add(scored[k].p);
  return c.multiplyScalar(1 / n);
}

function longAxis(pts) {
  const c = new THREE.Vector3();
  pts.forEach(p => c.add(p));
  c.multiplyScalar(1 / pts.length);
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
  for (const p of pts) {
    const x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
    xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z;
  }
  const v = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 8; i++) {
    v.set(xx * v.x + xy * v.y + xz * v.z, xy * v.x + yy * v.y + yz * v.z, xz * v.x + yz * v.y + zz * v.z).normalize();
  }
  if (v.y > 0) v.negate();
  return v;
}

function clearOverlay() {
  while (overlay.children.length) {
    const o = overlay.children[0];
    overlay.remove(o);
    o.geometry?.dispose?.();
    o.material?.dispose?.();
  }
}

function addCircle(center, normal, radius = 0.048) {
  const n = normal.clone().normalize();
  const pos = center.clone().addScaledVector(n, 0.012);
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.72, 32),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthTest: false }),
  );
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 48),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthTest: false }),
  );
  for (const mesh of [fill, ring]) {
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(n));
    overlay.add(mesh);
  }
}

function addArrow(from, dir, length = 0.12) {
  const helper = new THREE.ArrowHelper(dir.clone().normalize(), from, length, 0xf59e0b, 0.028, 0.018);
  overlay.add(helper);
}

function paintTeach() {
  clearOverlay();
  const round = plan?.rounds[roundI];
  const onTeach = main.dataset.screen === 'teach' && round;
  const fj = onTeach ? T.bp3dIdsForRound(round, idx, plan.side) : [];
  highlight(fj);
  if (onTeach && muscles && parts.length) {
    const bodyC = new THREE.Vector3();
    new THREE.Box3().setFromObject(root).getCenter(bodyC);
    for (const it of round.items) {
      const fjId = idx.get(it.muscle)?.item?.bp3d?.[plan.side];
      const i = fjId ? partIndex(fjId) : -1;
      if (i < 0) continue;
      const pts = partPoints(i);
      if (!pts.length) continue;
      const mode = it.overlay.pick || 'medial-mid';
      const p = pickPoint(pts, mode, plan.side);
      const n = p.clone().sub(bodyC).normalize();
      addCircle(p, n);
      if (it.overlay.arrow === 'along-inferior') addArrow(p, longAxis(pts));
      if (it.overlay.arrow === 'head-away') {
        const dir = new THREE.Vector3(plan.side === 'R' ? -1 : 1, 0.35, 0);
        addArrow(p.clone().add(new THREE.Vector3(0, 0.04, 0)), dir, 0.11);
      }
    }
    setView('back');
  }
  window.__overlay = { fj, count: overlay.children.length };
}

function frame() {
  const w = innerWidth, h = innerHeight, top = 52;
  const bottom = document.querySelector('.bottom').getBoundingClientRect().top - 6;
  const avail = Math.max(120, bottom - top);
  frac = avail / h;
  camera.aspect = w / h;
  camera.setViewOffset(w, h, 0, h / 2 - (top + avail / 2), w, h);
  camera.updateProjectionMatrix();
}
function viewDir(which) {
  return which === 'front' ? new THREE.Vector3(0, 0.08, 1) : new THREE.Vector3(0, 0.08, -1);
}
function frameTargets(fjIds, which = 'back') {
  const box = new THREE.Box3();
  let any = false;
  for (const id of fjIds) {
    const i = partIndex(id);
    if (i < 0) continue;
    for (const p of partPoints(i)) { box.expandByPoint(p); any = true; }
  }
  if (!any) return frameBody(which);
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z, 0.08) * 0.85;
  controls.target.copy(c);
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(r / t / Math.max(frac, 0.25), 0.22);
  camera.position.copy(c).addScaledVector(viewDir(which).normalize(), dist);
  controls.update();
}
function frameBody(which = 'back') {
  if (root) new THREE.Box3().setFromObject(root).getCenter(controls.target);
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(bodyHeight * 1.04 / 2 / t / frac, 0.5 / (t * camera.aspect));
  camera.position.copy(controls.target).addScaledVector(viewDir(which).normalize(), dist);
  controls.update();
}
function setView(which) {
  if (pendingHighlight.length) frameTargets(pendingHighlight, which);
  else frameBody(which);
}
$('#front').onclick = () => setView('front');
$('#back').onclick = () => setView('back');

function loadModel() {
  const loadingEl = $('#loading');
  new GLTFLoader().load('/model/body-low.wasm', gltf => {
    root = gltf.scene;
    muscles = gltf.scene.getObjectByName('muscles');
    bones = gltf.scene.getObjectByName('bones');
    parts = muscles.userData.parts;
    stateData = new Uint8Array(parts.length * 4);
    stateTex = new THREE.DataTexture(stateData, parts.length, 1, THREE.RGBAFormat);
    uniforms.partState.value = stateTex;
    muscles.material = muscleMaterial();
    bones.material = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.8 });
    scene.add(gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    box.getCenter(controls.target);
    bodyHeight = box.max.y - box.min.y;
    highlight(pendingHighlight);
    setView('back');
    paintTeach();
    loadingEl.hidden = true;
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
  }, e => { if (e.total) $('#pct').textContent = Math.round(e.loaded / e.total * 100) + '%'; },
  err => { loadingEl.textContent = '載入失敗：' + err.message; window.__ready = true; });
}

function resize() { renderer.setSize(innerWidth, innerHeight, false); frame(); }
addEventListener('resize', resize); resize();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

// ---------- boot ----------

(async () => {
  try {
    const extra = new URLSearchParams(location.search).get('extra');
    const [lib, d] = await Promise.all([
      fetch('/library.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('library ' + r.status); return r.json(); }),
      fetch('./demo.json', { cache: 'no-store' }).then(r => r.json()),
    ]);
    L = lib; demo = d;
    if (extra) (demo.plan[0].ids ??= []).push(...extra.split(',').filter(Boolean));
    idx = T.indexLibrary(L);
    plan = T.resolvePlan(demo, idx);
    loadModel();
    screenPick();
  } catch (e) {
    show('error', `<h1>未能載入知識庫</h1><p>${esc(e.message)}</p>`);
    window.__ready = true;
  }
})();

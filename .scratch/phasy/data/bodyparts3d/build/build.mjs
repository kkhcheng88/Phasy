// PROTOTYPE build: BodyParts3D OBJ (manifest.json) -> one GLB with two meshes:
//   "muscles": all muscle parts merged, per-vertex _PART (uint16) = index into node extras.parts
//   "bones":   orientation bones merged, no ids
// Each part is welded, simplified (meshoptimizer), winding-fixed, smooth normals recomputed.
// Usage: node build.mjs <out.glb> [muscleErrMM=1] [boneErrMM=3]
// Shipped models: body.wasm = `0.3 0.5`, body-low.wasm = `1 1.5` (build to .glb, then copy to .wasm).
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, reorder } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const DATA = path.dirname(HERE);
const OBJ = path.join(DATA, 'isa_obj', 'isa_BP3D_4.0_obj_99');
const [out, mErr = '1', bErr = '3'] = process.argv.slice(2);
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

// OBJ -> welded positions (metres, three.js Y-up: x, z, -y) + indices.
// part.file (relative to DATA) = a mesh from outside the 4.0 set (warped BodyParts3D 3.0 muscles).
function readObj(part) {
  const text = fs.readFileSync(part.file ? path.join(DATA, part.file) : path.join(OBJ, part.fj + '.obj'), 'utf8');
  const key = new Map(), pos = [], remap = [], idx = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.trim().split(/\s+/);
      const k = `${x},${y},${z}`;
      if (!key.has(k)) { key.set(k, pos.length / 3); pos.push(+x / 1000, +z / 1000, -y / 1000); }
      remap.push(key.get(k));
    } else if (line.startsWith('f ')) {
      const v = line.trim().split(/\s+/).slice(1).map((s) => remap[parseInt(s) - 1]);
      for (let i = 1; i + 1 < v.length; i++) idx.push(v[0], v[i], v[i + 1]);
    }
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) };
}

function simplifyPart({ pos, idx }, errMM) {
  const [s] = MeshoptSimplifier.simplify(idx, pos, 3, 0, errMM / 1000, ['ErrorAbsolute']);
  const ind = s.length >= 12 ? s : idx; // never drop a part entirely
  // compact: keep only used vertices
  const map = new Int32Array(pos.length / 3).fill(-1), p = [], ni = new Uint32Array(ind.length);
  for (let i = 0; i < ind.length; i++) {
    let m = map[ind[i]];
    if (m < 0) { m = map[ind[i]] = p.length / 3; p.push(pos[ind[i] * 3], pos[ind[i] * 3 + 1], pos[ind[i] * 3 + 2]); }
    ni[i] = m;
  }
  return { pos: new Float32Array(p), idx: ni };
}

// signed volume < 0 means inward-facing winding (mirrored "M" files) -> flip
function fixWinding({ pos, idx }) {
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    vol += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  return vol < 0;
}

function normals({ pos, idx }) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const e1 = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]];
    const e2 = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) n[v + k] += f[k];
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

// 4.0's external oblique (FJ1452 / FJ1452M) and 3.0's internal oblique and transversus abdominis also run in front of
// the rectus abdominis (the rectus sheath), which hides the 3.0 rectus abdominis completely from the front.
// Drop their triangles that lie in front of the rectus's back surface:
// footprint = 2 mm cells covered by the rectus's triangles in the frontal plane, each with the rectus's back-most depth.
// (Checked: pectoralis major and intercostals also reach the rectus footprint at the ribs; left alone, as in anatomy.)
const CLIPPED = new Set(['FJ1452', 'FJ1452M', 'FMA13892', 'FMA13893', 'FMA22344', 'FMA22345']);
const RECTUS = ['FMA13377', 'FMA13378'], CELL = 0.002;
const cell = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
function rectusFootprint() {
  const back = new Map();
  for (const fj of RECTUS) {
    const { pos, idx } = readObj(manifest.find((p) => p.fj === fj));
    for (let t = 0; t < idx.length; t += 3) { // sample each triangle every half cell, so large triangles leave no holes
      const [A, B, C] = [idx[t], idx[t + 1], idx[t + 2]].map((v) => pos.subarray(v * 3, v * 3 + 3));
      const n = Math.max(1, Math.ceil(Math.max(Math.hypot(A[0] - B[0], A[1] - B[1]), Math.hypot(B[0] - C[0], B[1] - C[1]),
        Math.hypot(C[0] - A[0], C[1] - A[1])) / (CELL / 2)));
      for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) {
        const u = i / n, v = j / n, w = 1 - u - v, p = [0, 1, 2].map((k) => u * A[k] + v * B[k] + w * C[k]);
        const k = cell(p[0], p[1]);
        back.set(k, Math.min(back.get(k) ?? Infinity, p[2])); // three.js +z = body's front
      }
    }
  }
  return back;
}
function clipInFront({ pos, idx }, back) {
  const keep = [];
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const z = back.get(cell((pos[a] + pos[b] + pos[c]) / 3, (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3));
    if (z === undefined || (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3 < z) keep.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  return { pos, idx: new Uint32Array(keep) }; // unused vertices are compacted by simplifyPart
}

const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8'));
const footprint = rectusFootprint();
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('body');
const stats = {};

for (const kind of ['muscle', 'bone']) {
  const list = manifest.filter((p) => p.kind === kind);
  const P = [], N = [], I = [], ID = [];
  let base = 0, flipped = 0, srcTris = 0;
  list.forEach((part, k) => {
    let raw = readObj(part);
    srcTris += raw.idx.length / 3;
    if (CLIPPED.has(part.fj)) {
      const n = raw.idx.length / 3;
      raw = clipInFront(raw, footprint);
      stats.clipped = { ...stats.clipped, [part.fj]: `${n} -> ${raw.idx.length / 3} source triangles` };
    }
    const g = simplifyPart(raw, kind === 'muscle' ? +mErr : +bErr);
    flipped += fixWinding(g);
    const n = normals(g);
    for (let i = 0; i < g.pos.length; i++) { P.push(g.pos[i]); N.push(n[i]); }
    for (let i = 0; i < g.pos.length / 3; i++) ID.push(k);
    for (const v of g.idx) I.push(v + base);
    base += g.pos.length / 3;
  });
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(N)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(I)).setBuffer(buffer));
  if (kind === 'muscle') prim.setAttribute('_PART', doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(ID)).setBuffer(buffer));
  const name = kind + 's';
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim));
  if (kind === 'muscle') node.setExtras({ parts: list.map((p) => ({ id: p.fj, name: p.name, side: p.side })) });
  scene.addChild(node);
  stats[name] = { parts: list.length, srcTriangles: srcTris, triangles: I.length / 3, vertices: base, windingFlipped: flipped };
}

doc.createExtension(KHRMeshQuantization).setRequired(true);
await doc.transform(
  reorder({ encoder: MeshoptEncoder }),
  quantize({ pattern: /^(POSITION|NORMAL)$/, quantizePosition: 14, quantizeNormal: 8 }),
);
// No EXT_meshopt_compression: its decoder needs WebAssembly, which a hosted page's CSP may block.
// ponytail: quantize-only is ~3-4x bigger; add meshopt back when the page is self-hosted.
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
await io.write(out, doc);
stats.bytes = fs.statSync(out).size;
console.log(JSON.stringify(stats, null, 1));
fs.writeFileSync(out.replace(/\.glb$/, '.stats.json'), JSON.stringify(stats, null, 1));

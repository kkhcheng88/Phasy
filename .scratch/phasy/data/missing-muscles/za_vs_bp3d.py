"""Do Z-Anatomy and BodyParts3D 3.0 meshes for the 8 missing muscles sit correctly on the BodyParts3D 4.0 skeleton?

Inputs:
  za_obj/*.obj                          Z-Anatomy objects exported headless by za_export.py (metres, world coords)
  ../bodyparts3d-3.0/BodyParts3D_3.0_obj_99.zip, ../bodyparts3d/isa_obj/isa_BP3D_4.0_obj_99/  (via compare_bp3d_30_40.py loaders)

Steps:
  1. Fit ONE similarity transform (scale + rotation + translation) Z-Anatomy -> BodyParts3D 4.0, using structures that exist
     in both (bones + 4 muscles), by ICP with nearest neighbours inside the same structure. Same fit Z-Anatomy -> 3.0.
  2. Report residual per reference structure (how well the frames match).
  3. For each of the 8 muscles (right side; left is a mirror in both sources), place it on the 4.0 body three ways:
       za      = Z-Anatomy mesh through the global fit
       bp30_t  = BodyParts3D 3.0 mesh moved by the median shift of its 4.0 neighbours
       bp30_w  = BodyParts3D 3.0 mesh warped by the shifts of nearby bones
     and measure the closest distance (1st percentile, mm) from the muscle to each of its 4.0 attachment bones.
     Overlap with bones is not measured (no inside/outside test) -- only distances.
Run: PYTHONUTF8=1 python za_vs_bp3d.py  -> za_vs_bp3d.json + printed tables
"""
import json, os, glob
import numpy as np
from scipy.spatial import cKDTree
from compare_bp3d_30_40 import load30, load40, icp_shift, parse_obj

HERE = os.path.dirname(os.path.abspath(__file__))

REF = {  # Z-Anatomy object -> FMA id (same id in 3.0 file names and 4.0 concept ids)
    'Hip bone.r': 'FMA16586', 'Hip bone.l': 'FMA16587', 'Twelfth rib.r': 'FMA8533', 'Twelfth rib.l': 'FMA8534',
    'Scapula.r': 'FMA13395', 'Scapula.l': 'FMA13396', 'Humerus.r': 'FMA23130', 'Humerus.l': 'FMA23131',
    'Mandible': 'FMA52748', 'Sacrum': 'FMA16202',
    'Psoas major.r': 'FMA22342', 'Psoas major.l': 'FMA22343', 'Infraspinatus muscle.r': 'FMA32547',
    'Infraspinatus muscle.l': 'FMA32548', 'Teres major muscle.r': 'FMA32551', 'Teres major muscle.l': 'FMA32552',
    'Gluteus maximus muscle.r': 'FMA22328', 'Gluteus maximus muscle.l': 'FMA22329',
}
L = ['FMA13072', 'FMA13073', 'FMA13074', 'FMA13075', 'FMA13076']  # L1-L5 vertebrae (4.0)
T = ['FMA9968', 'FMA9991', 'FMA10014', 'FMA10037', 'FMA10059', 'FMA10081']  # T7-T12
TARGETS = {  # muscle -> (Z-Anatomy objects (right), BodyParts3D 3.0 files (right), attachment bones in 4.0)
    'latissimus dorsi': (['Latissimus dorsi muscle.r'], ['FMA13358'],
                         {'humerus': ['FMA23130'], 'hip bone': ['FMA16586'], 'T7-T12': T, 'scapula': ['FMA13395']}),
    'quadratus lumborum': (['Quadratus lumborum muscle.r'], ['FMA22348'],
                           {'twelfth rib': ['FMA8533'], 'hip bone': ['FMA16586'], 'L1-L5': L}),
    'multifidus': (['Multifidus lumborum muscle.r', 'Multifidus thoracis muscle.r', 'Multifidus colli muscle.r'], ['FMA22878'],
                   {'sacrum': ['FMA16202'], 'L1-L5': L, 'T7-T12': T}),
    'rectus abdominis': (['Rectus abdominis muscle.r'], ['FMA13377'], {'hip bone': ['FMA16586']}),
    'internal oblique': (['Internal abdominal oblique muscle.r'], ['FMA13892'],
                         {'hip bone': ['FMA16586'], 'twelfth rib': ['FMA8533']}),
    'transversus abdominis': (['Transversus abdominis muscle.r'], ['FMA22344'], {'hip bone': ['FMA16586']}),
    'masseter': (['Superficial part of masseter.r', 'Deep part of masseter.r'], ['FMA49001', 'FMA49004'],
                 {'mandible': ['FMA52748']}),
    'temporalis': (['Temporalis muscle.r'], ['FMA49007'], {'mandible': ['FMA52748']}),
}


def load_za():
    out = {}
    for fn in glob.glob(os.path.join(HERE, 'za_obj', '*.obj')):
        v, nf = parse_obj(open(fn, encoding='utf-8').read())
        out[os.path.basename(fn)[:-4]] = (v * 1000.0, nf)  # metres -> mm
    return out


def umeyama(src, dst):
    ms, md = src.mean(0), dst.mean(0)
    a, b = src - ms, dst - md
    U, S, Vt = np.linalg.svd(b.T @ a / len(src))
    D = np.eye(3)
    if np.linalg.det(U @ Vt) < 0:
        D[2, 2] = -1
    R = U @ D @ Vt
    s = np.trace(np.diag(S) @ D) / a.var(0).sum()
    return s, R, md - s * R @ ms


def fit_similarity(za, bp, pairs, iters=40):
    src = {k: za[k][0][:: max(1, len(za[k][0]) // 1500)] for k in pairs}
    trees = {k: cKDTree(bp[f][0]) for k, f in pairs.items()}
    allsrc = np.vstack(list(src.values()))
    alldst0 = np.vstack([bp[f][0] for f in pairs.values()])
    s, R, t = 1.0, np.eye(3), alldst0.mean(0) - allsrc.mean(0)
    for _ in range(iters):
        S, Dd = [], []
        for k, f in pairs.items():
            p = s * src[k] @ R.T + t
            _, i = trees[k].query(p)
            S.append(src[k]); Dd.append(bp[f][0][i])
        s, R, t = umeyama(np.vstack(S), np.vstack(Dd))
    resid = {}
    for k, f in pairs.items():
        d, _ = trees[k].query(s * za[k][0] @ R.T + t)
        resid[k] = [round(float(np.median(d)), 2), round(float(np.percentile(d, 90)), 2)]
    ang = float(np.degrees(np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1))))
    return s, R, t, ang, resid


def main():
    za = load_za()
    v30 = load30()
    v40, names40, bones40 = load40()
    pairs40 = {k: f for k, f in REF.items() if f in v40 and k in za}
    pairs30 = {k: f for k, f in REF.items() if f in v30 and k in za}
    s4, R4, t4, a4, r4 = fit_similarity(za, v40, pairs40)
    s3, R3, t3, a3, r3 = fit_similarity(za, v30, pairs30)
    rep = {'fit_to_4.0': {'scale': round(s4, 4), 'rotation_deg': round(a4, 2), 'translation_mm': [round(x, 1) for x in t4],
                          'residual_median_p90_mm': r4, 'missing_refs': sorted(set(REF) - set(pairs40))},
           'fit_to_3.0': {'scale': round(s3, 4), 'rotation_deg': round(a3, 2), 'translation_mm': [round(x, 1) for x in t3],
                          'residual_median_p90_mm': r3, 'missing_refs': sorted(set(REF) - set(pairs30))},
           'muscles': {}}

    # 3.0 -> 4.0 placement helpers (same method as compare_bp3d_30_40.py)
    shared = [f for f in set(v30) & set(v40) if len(v30[f][0]) >= 20 and len(v40[f][0]) >= 20]
    shifts = {f: icp_shift(v30[f][0][:: max(1, len(v30[f][0]) // 3000)], cKDTree(v40[f][0]), v40[f][0]) for f in shared}
    good_bones = [f for f in shifts if f in bones40 and shifts[f][1] < 3.0]
    bpts = np.vstack([v30[f][0] for f in good_bones])
    bown = np.concatenate([np.full(len(v30[f][0]), i) for i, f in enumerate(good_bones)])
    bsh = np.array([shifts[f][0] for f in good_bones])
    btree = cKDTree(bpts)

    def warp(v, K=4):
        _, idx = btree.query(v, k=60)
        out = np.empty_like(v)
        for r in range(len(v)):
            seen, w, sh = [], [], []
            for j in idx[r]:
                o = bown[j]
                if o in seen:
                    continue
                seen.append(o); w.append(1 / (np.linalg.norm(bpts[j] - v[r]) + 1.0) ** 2); sh.append(bsh[o])
                if len(seen) == K:
                    break
            w = np.array(w); out[r] = v[r] + (np.array(sh) * w[:, None]).sum(0) / w.sum()
        return out

    def near_shift(v):
        lo, hi = v.min(0) - 15, v.max(0) + 15
        tv = cKDTree(v)
        S = []
        for f in shifts:
            a = v30[f][0]
            if (a.min(0) > hi).any() or (a.max(0) < lo).any():
                continue
            if tv.query(a[:: max(1, len(a) // 2000)])[0].min() <= 15:
                S.append(shifts[f][0])
        return np.median(np.array(S), 0)

    bone_tree = {}
    for mname, (zaobjs, bpfiles, att) in TARGETS.items():
        zv = np.vstack([za[o][0] for o in zaobjs]) @ (s4 * R4).T + t4
        b3 = np.vstack([v30[f][0] for f in bpfiles])
        b3 = b3[:: max(1, len(b3) // 6000)]
        placed = {'Z-Anatomy (fitted)': zv[:: max(1, len(zv) // 6000)], '3.0 shifted': b3 + near_shift(b3), '3.0 warped': warp(b3)}
        row = {'za_objects': zaobjs, 'bp30_files': bpfiles,
               'za_vertices': int(sum(len(za[o][0]) for o in zaobjs)), 'za_faces': int(sum(za[o][1] for o in zaobjs)),
               'bp30_vertices': int(sum(len(v30[f][0]) for f in bpfiles)), 'bp30_faces': int(sum(v30[f][1] for f in bpfiles)),
               'closest_to_attachment_bone_mm': {}, 'za_vs_bp30warped_median_mm': None}
        for how, pts in placed.items():
            d = {}
            for bname, fids in att.items():
                key = tuple(fids)
                if key not in bone_tree:
                    bone_tree[key] = cKDTree(np.vstack([v40[f][0] for f in fids if f in v40]))
                dist, _ = bone_tree[key].query(pts)
                d[bname] = round(float(np.percentile(dist, 1)), 1)
            row['closest_to_attachment_bone_mm'][how] = d
        dz, _ = cKDTree(placed['3.0 warped']).query(placed['Z-Anatomy (fitted)'])
        row['za_vs_bp30warped_median_mm'] = round(float(np.median(dz)), 1)
        row['za_vs_bp30warped_p90_mm'] = round(float(np.percentile(dz, 90)), 1)
        rep['muscles'][mname] = row

    json.dump(rep, open(os.path.join(HERE, 'za_vs_bp3d.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for k in ('fit_to_4.0', 'fit_to_3.0'):
        f = rep[k]
        print(k, 'scale', f['scale'], 'rot', f['rotation_deg'], 't', f['translation_mm'], 'missing', f['missing_refs'])
        for n, r in f['residual_median_p90_mm'].items():
            print(f'   {n:28} median/p90 mm {r}')
    for m, r in rep['muscles'].items():
        print(f"{m:22} za {r['za_vertices']}v/{r['za_faces']}f  bp30 {r['bp30_vertices']}v/{r['bp30_faces']}f  "
              f"za-vs-3.0warped median {r['za_vs_bp30warped_median_mm']} p90 {r['za_vs_bp30warped_p90_mm']}")
        for how, d in r['closest_to_attachment_bone_mm'].items():
            print(f'     {how:20} {d}')


if __name__ == '__main__':
    main()

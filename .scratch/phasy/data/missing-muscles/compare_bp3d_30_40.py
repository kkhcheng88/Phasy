"""Can BodyParts3D 3.0 meshes for the 8 muscles missing in 4.0 sit on the 4.0 skeleton?

Inputs (official DBCLS archive, downloaded 2026-09-24):
  ../bodyparts3d-3.0/BodyParts3D_3.0_obj_99.zip   (https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/)
  ../bodyparts3d/isa_obj/isa_BP3D_4.0_obj_99/     (https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/)
Both are mm, same axes (coordinate_system.png is byte-identical in both releases).

Method, per target muscle (one side = one 3.0 file):
  1. Neighbours = structures present in BOTH releases (same FMA id) with any 3.0 vertex within NEAR_MM of the target.
  2. Per neighbour, translation-only ICP (3.0 -> 4.0) gives its shift between releases and the residual after the shift.
  3. If neighbours share one shift (small spread), moving the 3.0 muscle by the median shift puts it on the 4.0 body.
  4. After the move, report how far the muscle is from the 4.0 neighbours (gap) and how much it overlaps 4.0 bones.
Run: PYTHONUTF8=1 python compare_bp3d_30_40.py  -> compare_bp3d_30_40.json + printed table
"""
import json, os, re, zipfile
import numpy as np
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.dirname(HERE)
ZIP30 = os.path.join(DATA, 'bodyparts3d-3.0', 'BodyParts3D_3.0_obj_99.zip')
DIR40 = os.path.join(DATA, 'bodyparts3d', 'isa_obj', 'isa_BP3D_4.0_obj_99')
NEAR_MM = 15.0

TARGETS = {  # 3.0 file FMA id -> name (parts_list_e.txt of 3.0)
    'FMA13358': 'right latissimus dorsi', 'FMA13359': 'left latissimus dorsi',
    'FMA22348': 'right quadratus lumborum', 'FMA22349': 'left quadratus lumborum',
    'FMA22878': 'right multifidus', 'FMA22879': 'left multifidus',
    'FMA13377': 'right rectus abdominis', 'FMA13378': 'left rectus abdominis',
    'FMA13892': 'right internal oblique', 'FMA13893': 'left internal oblique',
    'FMA22344': 'right transversus abdominis', 'FMA22345': 'left transversus abdominis',
    'FMA49001': 'superficial part of right masseter', 'FMA49002': 'superficial part of left masseter',
    'FMA49004': 'deep part of right masseter', 'FMA49005': 'deep part of left masseter',
    'FMA49007': 'right temporalis', 'FMA49008': 'left temporalis',
}


def parse_obj(text):
    v, nf = [], 0
    for line in text.splitlines():
        if line.startswith('v '):
            v.append(line.split()[1:4])
        elif line.startswith('f '):
            nf += len(line.split()) - 3  # triangles after fan split
    return np.asarray(v, dtype=float), nf


def load30():
    z = zipfile.ZipFile(ZIP30)
    out = {}
    for n in z.namelist():
        m = re.search(r'(FMA\d+|BP\d+)\.obj$', n)
        if m:
            v, nf = parse_obj(z.read(n).decode('utf-8', 'replace'))
            out[m.group(1)] = (v, nf)
    return out


def load40():
    out, names, bones = {}, {}, set()
    manifest = json.load(open(os.path.join(DATA, 'bodyparts3d', 'manifest.json'), encoding='utf-8'))
    kind = {p['fj']: p['kind'] for p in manifest}
    for fn in os.listdir(DIR40):
        text = open(os.path.join(DIR40, fn), encoding='utf-8', errors='replace').read()
        cid = re.search(r'# Concept ID : (FMA\d+)', text)
        if not cid:
            continue
        fid = cid.group(1)
        v, nf = parse_obj(text)
        if fid in out:  # several element files for one concept: union
            v = np.vstack([out[fid][0], v]); nf += out[fid][1]
        out[fid] = (v, nf)
        names[fid] = re.search(r'# English name : (.*)', text).group(1).strip()
        if kind.get(fn[:-4]) == 'bone':
            bones.add(fid)
    return out, names, bones


def icp_shift(src, dst_tree, dst, iters=15):
    t = np.zeros(3)
    for _ in range(iters):
        d, i = dst_tree.query(src + t)
        t += (dst[i] - (src + t)).mean(axis=0)
    d, _ = dst_tree.query(src + t)
    return t, float(np.median(d)), float(np.percentile(d, 90))


def main():
    v30, v40 = load30(), None
    v40, names40, bones40 = load40()
    common = sorted(set(v30) & set(v40))
    trees40 = {}
    report = {'common_structures': len(common), 'files_30': len(v30), 'concepts_40': len(v40), 'targets': {}}

    # global picture: how many shared structures moved between 3.0 and 4.0
    shifts = {}
    for f in common:
        a = v30[f][0]; b = v40[f][0]
        if len(a) < 20 or len(b) < 20:
            continue
        trees40[f] = cKDTree(b)
        sub = a[:: max(1, len(a) // 3000)]
        shifts[f] = icp_shift(sub, trees40[f], b)
    mags = np.array([np.linalg.norm(s[0]) for s in shifts.values()])
    report['shift_all_shared_mm'] = {
        'n': int(len(mags)), 'median': float(np.median(mags)), 'p90': float(np.percentile(mags, 90)),
        'share_under_1mm': float((mags < 1).mean()), 'share_over_10mm': float((mags > 10).mean())}

    for tid, tname in TARGETS.items():
        tv, tf = v30[tid]
        ttree = cKDTree(tv)
        lo, hi = tv.min(0), tv.max(0)
        nb = []
        for f in shifts:
            a = v30[f][0]
            amin, amax = a.min(0), a.max(0)
            if (amin > hi + NEAR_MM).any() or (amax < lo - NEAR_MM).any():
                continue
            d, _ = ttree.query(a[:: max(1, len(a) // 2000)])
            if d.min() <= NEAR_MM:
                t, med, p90 = shifts[f]
                nb.append({'fma': f, 'name': names40[f], 'bone': f in bones40,
                           'shift_mm': [round(x, 1) for x in t], 'shift_len_mm': round(float(np.linalg.norm(t)), 1),
                           'residual_median_mm': round(med, 2), 'residual_p90_mm': round(p90, 2)})
        S = np.array([n['shift_mm'] for n in nb]) if nb else np.zeros((1, 3))
        med_shift = np.median(S, axis=0)
        spread = float(np.median(np.linalg.norm(S - med_shift, axis=1))) if nb else None
        moved = tv + med_shift
        # after moving: gap to nearest 4.0 neighbour surface, and fraction of muscle vertices lying
        # within 2 mm of a 4.0 bone surface (proxy for "touches / attaches")
        allnb = np.vstack([v40[n['fma']][0] for n in nb]) if nb else v40[common[0]][0]
        d_nb, _ = cKDTree(allnb).query(moved)
        bone_pts = [v40[n['fma']][0] for n in nb if n['bone']]
        touch = None
        if bone_pts:
            db, _ = cKDTree(np.vstack(bone_pts)).query(moved)
            touch = round(float((db < 2.0).mean()), 3)
        report['targets'][tid] = {
            'name': tname, 'vertices': int(len(tv)), 'triangles': int(tf),
            'bounds_mm': [[round(x, 1) for x in lo], [round(x, 1) for x in hi]],
            'neighbours': sorted(nb, key=lambda n: n['shift_len_mm']),
            'median_shift_mm': [round(float(x), 1) for x in med_shift],
            'neighbour_shift_spread_mm': None if spread is None else round(spread, 1),
            'after_shift_gap_to_4.0_neighbours_median_mm': round(float(np.median(d_nb)), 1),
            'after_shift_share_of_vertices_within_2mm_of_4.0_bone': touch,
        }

    # Step 5: bones moved by different amounts per level (spine reshaped), so one translation is not enough.
    # Warp: move every muscle vertex by the inverse-distance-weighted shift of its K nearest 3.0 bones
    # (bones whose own shape survived the release change: residual median < 3 mm).
    # Validate the warp on muscles that exist in BOTH releases: warp the 3.0 mesh, compare with the real 4.0 mesh.
    good_bones = [f for f in shifts if f in bones40 and shifts[f][1] < 3.0]
    bone_pts = np.vstack([v30[f][0] for f in good_bones])
    bone_owner = np.concatenate([np.full(len(v30[f][0]), i) for i, f in enumerate(good_bones)])
    bone_shift = np.array([shifts[f][0] for f in good_bones])
    btree = cKDTree(bone_pts)

    def warp(v, K=4):
        _, idx = btree.query(v, k=60)  # nearest bone points, then keep K distinct bones
        out_ = np.empty_like(v)
        for r in range(len(v)):
            seen, w, s = [], [], []
            for j in idx[r]:
                o = bone_owner[j]
                if o in seen:
                    continue
                seen.append(o)
                d = np.linalg.norm(bone_pts[j] - v[r]) + 1.0
                w.append(1 / d ** 2); s.append(bone_shift[o])
                if len(seen) == K:
                    break
            w = np.array(w); out_[r] = v[r] + (np.array(s) * w[:, None]).sum(0) / w.sum()
        return out_

    validate = {}
    for f in common:
        if f in bones40 or f not in shifts or shifts[f][1] > 3.0 or len(v30[f][0]) < 300:
            continue
        name = names40[f].lower()
        if not any(k in name for k in ('right external oblique', 'right iliocostalis lumborum', 'right longissimus thoracis',
                                       'right psoas major', 'right teres major', 'right serratus posterior inferior',
                                       'right gluteus maximus', 'right medial pterygoid', 'right serratus anterior',
                                       'right iliacus', 'right spinalis thoracis', 'right infraspinatus')):
            continue
        a = v30[f][0]; a = a[:: max(1, len(a) // 4000)]
        t40 = trees40[f]
        d_raw, _ = t40.query(a)
        d_warp, _ = t40.query(warp(a))
        d_icp, _ = t40.query(a + shifts[f][0])
        validate[names40[f]] = {'as_is_median_mm': round(float(np.median(d_raw)), 1),
                                'warped_median_mm': round(float(np.median(d_warp)), 1),
                                'warped_p90_mm': round(float(np.percentile(d_warp, 90)), 1),
                                'best_own_translation_median_mm': round(float(np.median(d_icp)), 1)}
    report['warp_validation_on_muscles_in_both_releases'] = validate
    print('warp validation (3.0 muscle warped by bone shifts vs real 4.0 mesh):')
    for k, x in validate.items():
        print(f'  {k:40} {x}')
    for tid in TARGETS:
        tv = v30[tid][0]
        sub = tv[:: max(1, len(tv) // 4000)]
        w = warp(sub)
        report['targets'][tid]['warp_shift_range_z_mm'] = [round(float((w - sub)[:, 2].min()), 1), round(float((w - sub)[:, 2].max()), 1)]

    out = os.path.join(HERE, 'compare_bp3d_30_40.json')
    json.dump(report, open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('shared structures:', report['common_structures'], 'shift stats:', report['shift_all_shared_mm'])
    print(f"{'target':38} {'verts':>6} {'tris':>6} {'nb':>3} {'median shift mm':>22} {'spread':>6} {'gap':>5} {'bone<2mm':>8}")
    for tid, r in report['targets'].items():
        print(f"{r['name']:38} {r['vertices']:6} {r['triangles']:6} {len(r['neighbours']):3} {str(r['median_shift_mm']):>22} "
              f"{str(r['neighbour_shift_spread_mm']):>6} {r['after_shift_gap_to_4.0_neighbours_median_mm']:5} "
              f"{str(r['after_shift_share_of_vertices_within_2mm_of_4.0_bone']):>8}")


if __name__ == '__main__':
    main()

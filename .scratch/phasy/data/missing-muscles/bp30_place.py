"""Place BodyParts3D 3.0 meshes of the 8 missing muscles on the 4.0 skeleton, and pick bony landmarks on 4.0.

1. Warp every vertex of the 18 target 3.0 files by the shifts of nearby 3.0->4.0 bones (method validated in
   compare_bp3d_30_40.py) and write them as OBJ (mm, 4.0 frame, original faces) to bp30_warped/.
2. Pick attachment landmarks on 4.0 bones (right side; +x = body's left, -y = front, +z = up) by simple extreme-vertex
   rules, the way a hand-built mesh would have to, and measure how far each landmark is from the warped 3.0 muscle.
Run: PYTHONUTF8=1 python bp30_place.py  -> bp30_warped/*.obj, bp30_place.json, printed table
"""
import json, os, zipfile, re
import numpy as np
from scipy.spatial import cKDTree
from compare_bp3d_30_40 import load30, load40, icp_shift, ZIP30, TARGETS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'bp30_warped')
os.makedirs(OUT, exist_ok=True)

v30 = load30()
v40, names40, bones40 = load40()
shared = [f for f in set(v30) & set(v40) if len(v30[f][0]) >= 20 and len(v40[f][0]) >= 20]
shifts = {f: icp_shift(v30[f][0][:: max(1, len(v30[f][0]) // 3000)], cKDTree(v40[f][0]), v40[f][0]) for f in shared}
good = [f for f in shifts if f in bones40 and shifts[f][1] < 3.0]
bpts = np.vstack([v30[f][0] for f in good])
bown = np.concatenate([np.full(len(v30[f][0]), i) for i, f in enumerate(good)])
bsh = np.array([shifts[f][0] for f in good])
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


# 1. warped OBJ export
z = zipfile.ZipFile(ZIP30)
warped = {}
for fid, name in TARGETS.items():
    text = z.read(f'BodyParts3D_3.0_obj_99/{fid}.obj').decode('utf-8', 'replace')
    v = v30[fid][0]
    w = warp(v)
    warped[fid] = w
    faces = [l for l in text.splitlines() if l.startswith('f ')]
    with open(os.path.join(OUT, f'{fid}.obj'), 'w', encoding='utf-8') as f:
        f.write(f'# BodyParts3D 3.0 {fid} "{name}", warped onto the BodyParts3D 4.0 skeleton (mm) by bp30_place.py\n')
        f.write('# BodyParts3D, (C) The Database Center for Life Science, CC BY 4.0 (file header: CC BY-SA 2.1 JP)\n')
        f.writelines(f'v {p[0]:.3f} {p[1]:.3f} {p[2]:.3f}\n' for p in w)
        f.write('\n'.join(faces) + '\n')
    print('warped', fid, name, len(v), 'verts', len(faces), 'faces')

# 2. landmarks on 4.0 bones (right side)
B = lambda fid: v40[fid][0]
L = {'L1': 'FMA13072', 'L2': 'FMA13073', 'L3': 'FMA13074', 'L4': 'FMA13075', 'L5': 'FMA13076'}
T = {'T7': 'FMA9968', 'T8': 'FMA9991', 'T9': 'FMA10014', 'T10': 'FMA10037', 'T11': 'FMA10059', 'T12': 'FMA10081'}
lm = {}
rib = B('FMA8533'); lm['12th rib, lowest point'] = ('QL', rib[rib[:, 2].argmin()])
hip = B('FMA16586'); top = hip[hip[:, 2] > hip[:, 2].max() - 10]
lm['iliac crest, highest point'] = ('QL', hip[hip[:, 2].argmax()])
lm['iliac crest, posterior top'] = ('LD', top[top[:, 1].argmax()])
for k, fid in L.items():
    v = B(fid)
    if k != 'L5':
        lm[f'{k} right transverse process tip'] = ('QL', v[v[:, 0].argmin()])
    lm[f'{k} spinous process tip'] = ('multifidus', v[v[:, 1].argmax()])
for k, fid in T.items():
    v = B(fid); lm[f'{k} spinous process tip'] = ('LD', v[v[:, 1].argmax()])
sac = B('FMA16202'); lm['sacrum, most dorsal point'] = ('multifidus', sac[sac[:, 1].argmax()])
sc = B('FMA13395'); lm['scapula inferior angle'] = ('LD', sc[sc[:, 2].argmin()])
hu = B('FMA23130'); prox = hu[hu[:, 2] > hu[:, 2].max() - 60]
lm['humerus, front of upper shaft (near intertubercular groove)'] = ('LD', prox[prox[:, 1].argmin()])

mesh = {'QL': warped['FMA22348'], 'LD': warped['FMA13358'], 'multifidus': warped['FMA22878']}
trees = {k: cKDTree(v) for k, v in mesh.items()}
rows = {}
print(f"{'landmark':58} {'muscle':10} {'x':>7} {'y':>7} {'z':>7} {'gap to warped 3.0 mm':>21}")
for n, (m, p) in lm.items():
    d, _ = trees[m].query(p)
    rows[n] = {'muscle': m, 'xyz_mm': [round(float(c), 1) for c in p], 'distance_to_warped_3.0_mm': round(float(d), 1)}
    print(f'{n:58} {m:10} {p[0]:7.1f} {p[1]:7.1f} {p[2]:7.1f} {d:21.1f}')
json.dump({'landmarks_right_side_4.0': rows}, open(os.path.join(HERE, 'bp30_place.json'), 'w', encoding='utf-8'), indent=1)

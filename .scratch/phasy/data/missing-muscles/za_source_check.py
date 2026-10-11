"""Are Z-Anatomy's meshes for the 8 muscles the BodyParts3D 3.0 meshes? Compare in the 3.0 frame.
Uses the Z-Anatomy -> 3.0 similarity fit from za_vs_bp3d.py (fit on reference bones/muscles, not on these muscles).
Run: PYTHONUTF8=1 python za_source_check.py  -> printed table (saved as za_source_check.out.txt)
"""
import numpy as np
from scipy.spatial import cKDTree
from compare_bp3d_30_40 import load30
from za_vs_bp3d import load_za, fit_similarity, REF, TARGETS

za, v30 = load_za(), load30()
s, R, t, ang, _ = fit_similarity(za, v30, {k: f for k, f in REF.items() if f in v30 and k in za})
print(f'fit Z-Anatomy -> 3.0: scale {s:.4f} (Z-Anatomy is {1/s:.4f}x larger), rotation {ang:.2f} deg')
print(f"{'muscle':22} {'ZA->3.0 median mm':>18} {'p90':>6} {'3.0->ZA median':>15} {'p90':>6}")
for m, (zobjs, files, _) in TARGETS.items():
    zv = np.vstack([za[o][0] for o in zobjs]) @ (s * R).T + t
    bv = np.vstack([v30[f][0] for f in files])
    d1, _ = cKDTree(bv).query(zv)
    d2, _ = cKDTree(zv).query(bv)
    print(f'{m:22} {np.median(d1):18.2f} {np.percentile(d1, 90):6.2f} {np.median(d2):15.2f} {np.percentile(d2, 90):6.2f}')

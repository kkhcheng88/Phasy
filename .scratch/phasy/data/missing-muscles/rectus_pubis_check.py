"""Does rectus abdominis reach the pubis? The 1st-percentile distance in za_vs_bp3d.py is ~17 mm because the attachment
area is small, so check the minimum distance: in BodyParts3D 3.0 itself, and after warping onto 4.0 (bp30_place.py output).
Run: PYTHONUTF8=1 python rectus_pubis_check.py  -> rectus_pubis_check.out.txt
"""
import numpy as np
from scipy.spatial import cKDTree
from compare_bp3d_30_40 import load30, load40, parse_obj

v30 = load30()
v40, _, _ = load40()
for rect, hip in (('FMA13377', 'FMA16586'), ('FMA13378', 'FMA16587')):
    d, _ = cKDTree(v30[hip][0]).query(v30[rect][0])
    print(f'{rect} to {hip} in 3.0 frame: min {d.min():.1f} mm, p1 {np.percentile(d, 1):.1f} mm')
    w, _ = parse_obj(open(f'bp30_warped/{rect}.obj', encoding='utf-8').read())
    d, _ = cKDTree(v40[hip][0]).query(w)
    print(f'{rect} warped, to 4.0 {hip}: min {d.min():.1f} mm, p1 {np.percentile(d, 1):.1f} mm')

"""Export selected Z-Anatomy meshes as OBJ (world coordinates, metres) without the Blender GUI.

Run:
  blender.exe -b ../z-anatomy/Z-Anatomy/Startup.blend --python za_export.py
Output: za_obj/<object name>.obj (evaluated mesh, world matrix applied; winding fixed for mirrored objects).
"""
import bpy, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'za_obj')
os.makedirs(OUT, exist_ok=True)

NAMES = [f'{b}.{s}' for s in ('l', 'r') for b in (
    # the 8 muscles BodyParts3D 4.0 lacks
    'Latissimus dorsi muscle', 'Quadratus lumborum muscle', 'Multifidus lumborum muscle',
    'Multifidus thoracis muscle', 'Multifidus colli muscle', 'Rectus abdominis muscle',
    'Internal abdominal oblique muscle', 'Transversus abdominis muscle',
    'Superficial part of masseter', 'Deep part of masseter', 'Temporalis muscle',
    # reference structures that BodyParts3D 3.0 and 4.0 also have (for the coordinate check)
    'Hip bone', 'Twelfth rib', 'Scapula', 'Humerus', 'Psoas major', 'Infraspinatus muscle',
    'Teres major muscle', 'Gluteus maximus muscle')] + ['Sacrum', 'Mandible']

dg = bpy.context.evaluated_depsgraph_get()
done = []
for name in NAMES:
    o = bpy.data.objects.get(name)
    if o is None or o.type != 'MESH':
        print('ZA_MISSING', name)
        continue
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    mw = o.matrix_world
    flip = mw.determinant() < 0
    with open(os.path.join(OUT, name + '.obj'), 'w', encoding='utf-8') as f:
        f.write(f'# Z-Anatomy object "{name}" (world coordinates, metres)\n')
        for v in me.vertices:
            p = mw @ v.co
            f.write(f'v {p.x:.6f} {p.y:.6f} {p.z:.6f}\n')
        for poly in me.polygons:
            idx = [i + 1 for i in poly.vertices]
            if flip:
                idx.reverse()
            f.write('f ' + ' '.join(map(str, idx)) + '\n')
    done.append((name, len(me.vertices), len(me.polygons)))
    ev.to_mesh_clear()
for d in done:
    print('ZA_EXPORTED', *d)
print('ZA_EXPORT_DONE', len(done))

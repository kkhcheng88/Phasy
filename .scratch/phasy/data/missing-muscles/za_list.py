"""List Z-Anatomy Startup.blend objects that match the 8 muscles BodyParts3D 4.0 lacks.

Run (no GUI):
  blender.exe -b ../z-anatomy/Z-Anatomy/Startup.blend --python za_list.py
Writes za_list.json next to this script: every matching mesh with its world-space bounds,
vertex count, scale of its world matrix, and parent chain; plus the scene's unit settings.
"""
import bpy, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PAT = re.compile(r'latissimus|quadratus lumborum|multifid|rectus abdominis|internal (abdominal )?oblique|'
                 r'obliquus internus|transvers(us)? abdominis|masseter|temporalis|'
                 # reference structures for the coordinate check (also in BodyParts3D)
                 r'^(right |left )?(infraspinatus|teres major|psoas major|gluteus maximus|external oblique)|'
                 r'^hip bone|^sacrum|^twelfth rib|^rib 12|^l[1-5] vertebra|^first lumbar|^fifth lumbar|^humerus|^mandible|^scapula',
                 re.I)

out = {'blend': bpy.data.filepath,
       'unit_system': bpy.context.scene.unit_settings.system,
       'scale_length': bpy.context.scene.unit_settings.scale_length,
       'n_objects': len(bpy.data.objects),
       'n_mesh_objects': sum(o.type == 'MESH' for o in bpy.data.objects),
       'matches': []}
for o in bpy.data.objects:
    if o.type != 'MESH' or not PAT.search(o.name):
        continue
    mw = o.matrix_world
    pts = [mw @ v.co for v in o.data.vertices]
    if not pts:
        continue
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    chain, p = [], o.parent
    while p:
        chain.append(p.name); p = p.parent
    out['matches'].append({
        'name': o.name, 'mesh': o.data.name, 'verts': len(o.data.vertices), 'polys': len(o.data.polygons),
        'bounds_min': [round(x, 4) for x in lo], 'bounds_max': [round(x, 4) for x in hi],
        'world_scale': [round(x, 5) for x in mw.to_scale()],
        'collections': [c.name for c in o.users_collection], 'parents': chain})
out['matches'].sort(key=lambda m: m['name'])
json.dump(out, open(os.path.join(HERE, 'za_list.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('ZA_DONE', out['n_objects'], out['n_mesh_objects'], len(out['matches']))

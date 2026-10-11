"""Visual check: warped BodyParts3D 3.0 muscles on the BodyParts3D 4.0 skeleton, rendered headless.

Run: blender.exe -b --factory-startup --python render_check.py
Writes render_back_ld.png (latissimus dorsi) and render_back_deep.png (quadratus lumborum + multifidus), back view.
"""
import bpy, json, os, math

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.dirname(HERE)
OBJ40 = os.path.join(DATA, 'bodyparts3d', 'isa_obj', 'isa_BP3D_4.0_obj_99')
manifest = json.load(open(os.path.join(DATA, 'bodyparts3d', 'manifest.json'), encoding='utf-8'))
bones = [p['fj'] for p in manifest if p['kind'] == 'bone'] + ['FJ3368', 'FJ3262']  # + right/left humerus
# 4.0 neighbours for context in the deep view: psoas major, iliocostalis lumborum, longissimus thoracis
context = [p['fj'] for p in manifest if p['kind'] == 'muscle' and p['name'] in ('psoas major',)]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def load(path, colour, name):
    bpy.ops.wm.obj_import(filepath=path, forward_axis='Y', up_axis='Z')
    o = bpy.context.selected_objects[0]
    o.name = name
    o.color = colour
    return o


for fj in bones:
    load(os.path.join(OBJ40, fj + '.obj'), (0.92, 0.9, 0.82, 1), 'bone_' + fj)
ctx = [load(os.path.join(OBJ40, fj + '.obj'), (0.55, 0.55, 0.6, 1), 'ctx_' + fj) for fj in context]
W = os.path.join(HERE, 'bp30_warped')
ld = [load(os.path.join(W, f + '.obj'), (0.85, 0.25, 0.2, 1), f) for f in ('FMA13358', 'FMA13359')]
deep = [load(os.path.join(W, f + '.obj'), c, f) for f, c in (('FMA22348', (0.2, 0.5, 0.9, 1)), ('FMA22349', (0.2, 0.5, 0.9, 1)),
                                                              ('FMA22878', (0.95, 0.6, 0.1, 1)), ('FMA22879', (0.95, 0.6, 0.1, 1)))]

sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.color_type = 'OBJECT'
sc.display.shading.light = 'STUDIO'
sc.render.resolution_x, sc.render.resolution_y = 900, 1200
sc.world = bpy.data.worlds.new('w'); sc.world.color = (1, 1, 1)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 560; cam.data.clip_end = 10000
# back view: +y is the body's back in BodyParts3D, so look from +y towards -y
cam.location = (0, 2000, 1080); cam.rotation_euler = (math.radians(90), 0, math.radians(180))

for label, show, hide in (('ld', ld, deep), ('deep', deep, ld)):
    for o in show:
        o.hide_render = False
    for o in hide:
        o.hide_render = True
    sc.render.filepath = os.path.join(HERE, f'render_back_{label}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', sc.render.filepath)

# front view: abdominal wall layering. 4.0 external oblique (green) must cover 3.0 internal oblique (purple);
# 3.0 rectus abdominis (red) sits in front. Purple showing through green = layers cross.
for o in ld + deep:
    o.hide_render = True
eo = [load(os.path.join(OBJ40, p['fj'] + '.obj'), (0.3, 0.65, 0.35, 1), 'eo_' + p['fj'])
      for p in manifest if p['kind'] == 'muscle' and p['name'] == 'external oblique']
front = [load(os.path.join(W, f + '.obj'), c, f) for f, c in (('FMA13377', (0.85, 0.25, 0.2, 1)), ('FMA13378', (0.85, 0.25, 0.2, 1)),
                                                               ('FMA13892', (0.55, 0.3, 0.75, 1)), ('FMA13893', (0.55, 0.3, 0.75, 1)))]
print('EXTERNAL_OBLIQUE_FILES', [o.name for o in eo])
cam.location = (0, -2000, 1080); cam.rotation_euler = (math.radians(90), 0, 0)
sc.render.filepath = os.path.join(HERE, 'render_front_abdomen.png')
bpy.ops.render.render(write_still=True)
print('RENDERED', sc.render.filepath)

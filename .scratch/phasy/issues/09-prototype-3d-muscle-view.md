# Prototype: the interactive 3D muscle view

Type: prototype
Label: wayfinder:prototype
Status: resolved
Blocked by: 02

## Question

Does an interactive 3D muscle body built from BodyParts3D look professional enough, and run smoothly, on the owner's and his wife's phones? Build a rough prototype: rotate the body, tap a muscle to see its name, peel layers from surface to deep, and colour muscles by Muscle status. The owner and his wife react to it on their own phones.

## Progress

- 2026-09-24: prototype built — `prototypes/3d-muscle-view/` (build scripts in `.scratch/phasy/data/bodyparts3d/build/`). 407 muscle parts, 2 draw calls; default model 427k muscle triangles (9.2 MB), light model 110k (1.8 MB). Suspected = violet hatching. Renders in desktop Edge (headless) and on the hosted page in Chrome; not yet tried on a phone.
- Hosted as a private claude.ai artifact: https://claude.ai/artifact/T7kNPytv42r5xmsZKkGcBd — the wife needs it shared from the page's Share menu. Models are served as `.wasm` because the host serves no `.glb`; meshopt compression dropped because its decoder needs WebAssembly.
- Found: BodyParts3D 4.0 lacks latissimus dorsi, quadratus lumborum, multifidus and the deep abdominals — see [research/bodyparts3d-muscle-parts.md](../research/bodyparts3d-muscle-parts.md) and ticket [15](15-fill-muscles-bodyparts3d-lacks.md).
- Peel layer is automatic "hide what is visible from here"; fine layering would need hand-tagged depth per muscle.
- 2026-09-24, version 2 of the hosted page: the 18 BodyParts3D 3.0 meshes from ticket 15 added (425 muscle parts) plus both humeri; abdominal sheath parts of the obliques and transversus cut away so rectus abdominis shows from the front. Default model 11.4 MB, light model 3.0 MB. Known flaws: a thin gap down the midline of the abdomen; a few small bits of iliocostalis / serratus posterior inferior poke through latissimus dorsi; quadratus lumborum is deep and needs peeling to see.
- Owner's first reaction: the peel button removed a whole layer with no way back; asked for a slider.
- 2026-09-24, version 3: the peel button replaced by a layer slider (0 = all shown; k = layers 1..k hidden; drag back to restore). Layers are view-independent: a muscle is in the current top layer when at least 35% of it shows from one of 10 directions around the body; computed on the phone at first slider move (~0.2 s on desktop). On this model: 6 layers — trapezius, latissimus, gluteus maximus, external oblique in layer 1; rhomboids, levator scapulae, splenius, erector spinae, internal oblique in layer 2; quadratus lumborum, multifidus, transversus abdominis in layer 3; psoas in layer 4. Light model is now the default (owner's call); "轉用高清模式" loads the detailed one.

## Answer

Resolved 2026-09-24 by the owner: "The 3d model i hv no concern and i think by default can use low resolution."

1. **Pass.** BodyParts3D (4.0 plus the warped 3.0 meshes from ticket 15) is good enough for v1's 3D view.
2. **Light model by default** (~135k muscle triangles, 3 MB); the detailed model stays optional.
3. **Peeling is a layer slider**, not a one-way button. Visibility layers are a stand-in: v1 should take each muscle's depth from the Library (surface / deep) once entries exist.

Not tested: the wife's reaction and smoothness on her phone; which phones the couple use is still unknown.

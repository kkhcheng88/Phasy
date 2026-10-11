# BodyParts3D 4.0 — muscle parts (what is really in the download)

Read on 2026-09-24 from the official DBCLS download (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html),
files saved in `.scratch/phasy/data/bodyparts3d/`:

- **[T1]** `isa_parts_list_e.txt` — FMA id → English name (IS-A tree).
- **[T2]** `isa_element_parts.txt` — compound concept → element mesh files (FJ ids).
- **[T3]** `isa_inclusion_relation_list.txt` — IS-A parent/child.
- **[O]** OBJ file headers in `isa_BP3D_4.0_obj_99.zip` (`# Concept ID`, `# English name`, `# Bounds(mm)`), one OBJ per element file.
- **[L]** `lic.html` / `README_e.html` — license and credit wording.
- Scripts that produced every number below: `.scratch/phasy/data/bodyparts3d/build/` (`manifest.py`, `facts.py`, `probe.py`); output `manifest.json`.

## Answers

**Left and right are separate meshes with separate ids.** Every paired muscle is two OBJ files with two FMA ids,
e.g. `FJ1500` = FMA32547 "Right infraspinatus muscle", `FJ1500M` = FMA32548 "Left infraspinatus muscle" [O][T1].
The `…M` file is the mirror copy of the other side. Side in the name is wrong for one pair: `FJ1469` is named
"Left flexor pollicis brevis" but lies on the right (Bounds x = −301…−256 mm; +x is the body's left) [O].
The prototype takes side from geometry, not from the name.

**Use the IS-A tree, not PART-OF.** PART-OF holds only a partial muscle set: 50 of the 323 IS-A "muscle organ" element files
appear in `partof_element_parts.txt` (rhomboids, piriformis, psoas major, diaphragm are there; trapezius, gluteus,
sternocleidomastoid, scalenes, splenius are not) [partof_parts_list_e.txt, partof_element_parts.txt vs T2].

| Muscle asked about | In BodyParts3D 4.0? | One mesh or split — part names (one file per side unless noted) | Source |
|---|---|---|---|
| Trapezius | yes, split in 3 | descending part / transverse part / ascending part of (right/left) trapezius — `FJ1521`, `FJ1554`, `FJ1520` (+`M`). No whole-trapezius mesh. | [T1][T2][O] |
| Levator scapulae | yes, one | levator scapulae `FJ1532` | [T1][O] |
| Rhomboid major / minor | yes, one each | rhomboid major `FJ1536`, rhomboid minor `FJ1537` | [T1][O] |
| Supraspinatus | yes, one | `FJ1506` | [T1][O] |
| Infraspinatus | yes, one | "infraspinatus muscle" `FJ1500` | [T1][O] |
| Teres minor / major | yes, one each | teres minor `FJ1508`, teres major `FJ1507` | [T1][O] |
| Sternocleidomastoid | yes, one | `FJ1595` (right), `FJ1573` (left) — not a mirror pair | [T1][O] |
| Scalenes | yes, 3 muscles | scalenus anterior / medius / posterior (`FJ1592-1594` right, `FJ1570-1572` left). No scalenus minimus. | [T1][O] |
| Splenius capitis / cervicis | yes, one each | `FJ1545`, `FJ1546` | [T1][O] |
| Suboccipitals | yes, 4 per side | rectus capitis posterior major / minor, obliquus capitis superior / inferior (grouped as "posterior suboccipital muscle", 8 files). Also rectus capitis anterior / lateralis ("anterior suboccipital muscle"). | [T1][T2] |
| Erector spinae — iliocostalis | yes, split in 3 | iliocostalis cervicis / thoracis / lumborum (`FJ1526-1528`) | [T1][O] |
| Erector spinae — longissimus | yes, split in 3 | longissimus capitis / cervicis / thoracis (`FJ1533-1535`) | [T1][O] |
| Erector spinae — spinalis | yes, 2 | spinalis thoracis `FJ1544`; `FJ1543` has a blank name in its OBJ and only belongs to compound "spinalis" (sits at the neck, z 1329–1435 mm) | [O][T2] |
| "Erector spinae" as a whole | no grouping by that name | the three columns exist only separately | [T1] |
| Multifidus | **missing** | not in any table, not in any of the 2,234 OBJ headers | [T1][O] |
| Quadratus lumborum | **missing** | same | [T1][O] |
| Gluteus maximus / medius / minimus | yes, one each | `FJ1418`, `FJ1419`, `FJ1420` | [T1][O] |
| Piriformis | yes, one | `FJ1428` | [T1][O] |
| Iliopsoas | psoas major + iliacus, one each | psoas major `FJ1431`, iliacus `FJ1422`. No "iliopsoas" mesh, no psoas minor. | [T1][O] |
| Latissimus dorsi | **missing** | not in any table or OBJ header | [T1][O] |
| Pectoralis major | yes, split in 3 | clavicular / sternocostal / abdominal part (`FJ1447`, `FJ1464`, `FJ1446`) | [T1][O] |
| Pectoralis minor | yes, one | `FJ1456` | [T1][O] |
| Serratus anterior | yes, one | `FJ1459` | [T1][O] |

Also missing from the whole download (checked the same way): rectus abdominis, internal oblique, transversus abdominis,
masseter, temporalis [O: `all_obj_names.txt`]. Deltoid (3 parts), biceps/triceps heads, quadriceps and gastrocnemius heads are present.

## Filter used and part count

- Tree: **IS-A** (`isa_BP3D_4.0_obj_99.zip`, 2,234 OBJ files).
- Muscle files = element files [T2] of these IS-A compounds: FMA5022 "muscle organ" (323 files) ∪ FMA10474 "zone of muscle organ"
  ∪ FMA85453 "head of muscle organ" ∪ FMA32555 / FMA32557 "ascending / descending part of trapezius"
  (these two hang directly under "organ zone" [T3], so a "muscle organ" filter alone drops them, and also drops quadriceps,
  deltoid, pectoralis major, biceps and triceps). Heart papillary muscles and gut muscle layers are not under these roots.
- **Result: 407 muscle part files** (206 left, 199 right, 2 midline: diaphragm, transverse arytenoid); 2,347,128 triangles before simplification.
- Names: OBJ header "English name" for 399 files; 8 files have a blank header name and take the smallest IS-A compound that owns them
  (e.g. `FJ1451` → "external intercostal muscle").
- Bones for orientation (not muscles): 79 files of FMA5018 "bone organ" matching skull bones, vertebrae, ribs, hip bone, sacrum,
  scapula, clavicle, hyoid.

## Prototype build numbers (ticket 09, 2026-09-24)

From `build/build.mjs` → `body.stats.json` / `body-low.stats.json`, and the page's `window.__stats` in headless Edge:

| File | Muscle triangles | Bone triangles | Muscle parts | Draw calls | Size |
|---|---|---|---|---|---|
| `body.glb` (default) | 426,936 (from 2,347,128; 0.3 mm simplify error) | 52,494 | 407 | 2 (1 muscles + 1 bones) | 2.29 MB |
| `body-low.glb` (`?lod=low`) | 110,352 (1 mm) | 14,880 | 407 | 2 | 0.63 MB |

Plus three.js from jsDelivr ≈ 0.47 MB gzipped. All muscles are one merged mesh; each vertex carries its part number,
and a 1-pixel-high colour table decides colour / hatching / hidden per part.

## Added from BodyParts3D 3.0 (2026-09-24)

The 18 warped 3.0 meshes from [missing-muscle-meshes.md](missing-muscle-meshes.md) are now muscle parts
(`manifest.py` → `bp30_entries()`): latissimus dorsi, quadratus lumborum, multifidus, rectus abdominis, internal oblique,
transversus abdominis, temporalis, superficial and deep part of masseter — each left and right.
Id = the FMA id (e.g. `FMA22348` right quadratus lumborum; 4.0 ids all start `FJ`), name from 3.0 `parts_list_e.txt`,
side from geometry (all 18 agree with their names). Humerus (`FJ3368` right, `FJ3262` left) added to the orientation bones.

**Part count: 407 → 425 muscle parts** (+18); bones 79 → 81.

Front of the abdomen: 4.0's external oblique, and 3.0's internal oblique and transversus abdominis, all run in front of the
rectus abdominis (the rectus sheath), so the rectus was hidden. `build.mjs` now drops the triangles of these six meshes that
lie in front of the rectus's back surface (2 mm grid of the rectus footprint seen from the front). Source triangles kept:
external oblique 111,826 → 49,085 (R) / 48,775 (L); internal oblique 58,408 → 32,987 / 57,920 → 34,130;
transversus abdominis 68,682 → 64,461 / 68,592 → 64,208. Result: rectus abdominis is visible and tappable from the front.

Build numbers (quantize-only GLB, no meshopt compression; shipped as `.wasm`):

| File | Build args (muscle / bone simplify error) | Muscle triangles | Bone triangles | Muscle parts | Draw calls | Size (before → after) |
|---|---|---|---|---|---|---|
| `body.wasm` | 0.3 mm / 0.5 mm | 532,026 (from 2,867,724) | 54,780 | 425 | 2 | 9.20 → 11.38 MB |
| `body-low.wasm` | 1 mm / 1.5 mm | 135,205 | 15,490 | 425 | 2 | 1.76 → 2.95 MB |

Before: 426,936 / 52,494 and 110,352 / 14,880 triangles. Build args of the earlier files were recovered by rebuilding
(same byte size). `body.stats.json` / `body-low.stats.json` now describe these files. Checks in headless Edge at 390×844:
`.scratch/phasy/data/screens/v2/`.

Known visual flaws (seen in those screenshots): a narrow midline gap from breastbone to pubis where the spine shows through
(the two recti, like 4.0's two external obliques, do not meet); a thin jagged seam along the outer edge of each rectus;
on the back, serratus posterior inferior and iliocostalis lumborum poke through latissimus dorsi in a few small patches
around the lower ribs.

## License note

The download page and license page (updated 2025-02-27) say CC BY 4.0 and ask for this credit:
"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International" [L].
But every OBJ header still carries the older text "Creative Commons Attribution-Share Alike 2.1 Japan" [O].
The current license page is the licensor's latest statement; worth one e-mail to DBCLS before a public release.

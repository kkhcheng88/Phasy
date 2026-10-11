# Filling the 8 muscles BodyParts3D 4.0 lacks

Ticket: [issues/15-fill-muscles-bodyparts3d-lacks.md](../issues/15-fill-muscles-bodyparts3d-lacks.md). Checked 2026-09-24.
Coordinates follow [bodyparts3d-muscle-parts.md](bodyparts3d-muscle-parts.md): mm, +x = body's left, +z = up; in the files checked
here +y = body's back (spinous processes have larger y than transverse processes) [P3].

Muscle short names used in the table: **LD** latissimus dorsi, **QL** quadratus lumborum, **MF** multifidus, **RA** rectus abdominis,
**IO** internal oblique, **TA** transversus abdominis, **MA** masseter, **TE** temporalis. ✓ = seen as its own mesh (left and right),
✗ = checked and absent, ? = not checked / unverified.

## Short answer

The older **BodyParts3D 3.0** release (2011, same authors, same axes) has all 8 muscles as separate left/right meshes.
4.0 moved the torso skeleton ("Skeletal system has altered to accommodate big internal organs in the torso" [B3]), so the 3.0 meshes
must be moved by the shift of the nearby bones. That was done here: the 18 files are in
`.scratch/phasy/data/missing-muscles/bp30_warped/` and they sit on the 4.0 bones within about 0.5–3.5 mm [P2][P5][R].
**Z-Anatomy's meshes for 7 of the 8 muscles are the same 3.0 meshes** (0.15–0.22 mm apart after scaling), so it adds nothing but a Blender step [Z4].

## Comparison

| Option | Which of the 8 | Licence for personal use | Format and effort | Fits BodyParts3D 4.0 coordinates? | Quality | Sources |
|---|---|---|---|---|---|---|
| **A. BodyParts3D 3.0, moved onto 4.0** (DBCLS archive, `BodyParts3D_3.0_obj_99.zip`, 128 MB) | LD ✓ QL ✓ MF ✓ RA ✓ IO ✓ TA ✓ MA ✓ (superficial + deep part) TE ✓ — 18 files, FMA ids in [B2] | Yes. Current DBCLS licence page: CC BY 4.0 for the database [B5]; the 3.0 OBJ headers still say CC BY-SA 2.1 Japan [B2]. Both allow it. | OBJ, mm, same axes as 4.0 [B1][B3]. Already converted: `bp30_warped/*.obj`, same file format as the 4.0 input of `build.mjs`. Left to do: add them to the build (estimate ½ day). No Blender. Adds 520,596 triangles before the build's simplify step (existing 407 parts: 2,347,128) [P1]. | **Yes, after a bone-driven warp.** Plain 3.0 is 2–15 mm off because 4.0 moved the bones [P1]. Warp checked on 8 muscles that exist in both releases: 1.3–4.1 mm median from the real 4.0 mesh (p90 2.2–11 mm) [P1]. After warp, closest distance to the attachment bones: QL 0.6 (12th rib) / 2.7 (hip bone) / 0.6 (L1–L5); MF 1.4 (sacrum) / 0.8 (L1–L5); LD 2.5 (humerus) / 2.6 (hip bone) / 1.8 (T7–T12) / 2.3 (scapula); IO 1.8 / 3.4; TA 2.5; MA 1.0 and TE 1.0 (mandible); RA touches the pubis (0.5–0.7 mm) [P2][P5]. | Same look as the other BodyParts3D muscles (same model family and polygon reduction). Renders on the 4.0 skeleton look anatomically right (LD sheet from mid-back to pelvis; QL between 12th rib and iliac crest; MF along the spine into the sacrum) [R]. Front view: 4.0's external oblique mesh covers the whole front including the rectus area, so RA is hidden unless the external oblique is hidden; IO shows through the external oblique only at a few small spots [R]. | [B1] [B2] [B3] [B5] [P1] [P2] [P3] [P5] [R] |
| **B. Z-Anatomy** (GitHub `Z-Anatomy/Models-of-human-anatomy`, Blender template) | LD ✓ QL ✓ MF ✓ (split: colli / thoracis / lumborum) RA ✓ IO ✓ TA ✓ MA ✓ (superficial + deep) TE ✓ — object names seen in the file [Z3] | Yes. CC BY-SA 4.0; asks to credit BodyParts3D too [Z1][Z2]. Share-alike does not matter for private use. | `Z-Anatomy.zip` 86.7 MB → `Startup.blend` 307 MB (7,184 objects, 4,569 meshes) [Z1][Z3]. **Export works without the GUI**: `blender -b Startup.blend --python za_export.py` wrote 40 objects as OBJ (a full headless listing run took 27 s) [Z3]. Blender is **not installed** on this machine (not on PATH, no `C:\Program Files\Blender Foundation`); a portable Blender 4.2.23 LTS (383 MB zip) was downloaded to `data/tools/` and runs headless [Z5]. | **Same frame as BodyParts3D 3.0, not 4.0.** 3.0 (mm) = Z-Anatomy (m × 1000) × 0.9685 + (−0.1, −97.7, −13.3) mm, rotation 0.04° — i.e. Z-Anatomy is 3.0 enlarged 1.0325×. Right-side hip bone, 12th rib, scapula, psoas, infraspinatus, gluteus maximus match 3.0 within 0.12–0.26 mm median (humerus 1.0, teres major 3.5) [Z4]. One similarity fit to 4.0 leaves 1.8–6.3 mm median error [Z4], so it needs the same warp as option A. | 7 of 8 muscles are the 3.0 meshes with 32–44 % of the vertices (0.15–0.22 mm median apart) [Z4][P2]. The left side is a mirror of the right [Z3]. **MF is remodelled**: 2.9 mm median / 11.5 mm p90 from 3.0, and it stops about 24 mm short of the sacrum [Z4] — worse for a low-back app. | [Z1] [Z2] [Z3] [Z4] [Z5] |
| **B2. Z-Anatomy, already exported** (`nqwrc/3d-anatomy`, `public/models/muscular.glb`, 4.5 MB) | LD ✓ QL ✓ MF ✓ (3 parts) RA ✓ IO ✓ TA ✓ MA ✓ TE ✓ — node names seen in the GLB [N1] | Yes. The repo states CC BY-NC-SA 4.0 for the whole distribution [N2]. | glTF with Draco compression; no Blender needed, but needs a Draco decoder plus the same fit and warp as B. | Unverified (Draco geometry not decoded); expected to be the Z-Anatomy frame. | Same meshes as B (Z-Anatomy export, per the repo description) [N1]; exact simplification unverified. | [N1] [N2] |
| **C. BodyParts3D / Anatomography 4.3** (third-party mirror `olivercase/body_parts_3d_api`, 3,210 meshes) | LD ✗ QL ✗ MF ✗ RA ✗ IO ✗ TA ✗ MA ✗ TE ✗ (no name match in its 3,210-row manifest; the same manifest does list trapezius, gluteus, psoas, deltoid) [C1] | Yes (CC BY-SA 2.1 JP stated) [C1] | — | — | Confirms the gap was never filled in later releases. | [C1] |
| **D. Sketchfab, "UMich Anatomy" (@anatomary)** | LD ✓ QL ✓ (one model each; sides unverified); MF ? RA ? IO ? TA ? MA ? TE ? (not found in keyword search; only the first 24 of the account's models listed) [K1][K2] | Yes, CC BY [K1] | Download needs a Sketchfab account. ~0.9–1.0 M faces per model [K1]. | Unverified. Descriptions say "created using files from BodyParts3D (lifesciencedb.jp/bp3d) … edited using Blender" [K1] — BodyParts3D data of unknown release; its frame is unknown. | No gain over A. | [K1] [K2] |
| **E. Open Anatomy Project (SPL atlases)** | Abdominal atlas: QL ✓ IO ✓ RA ✓ (one mesh for both sides); LD ✗ MF ✗ (only "erector spinae") TA ✗. Head and Neck atlas: MA ✓ (not split into parts) TE ✓ [O1] | Yes. 3D Slicer licence Part B (BSD-style, research disclaimer) [O2][O3] | Atlas download (model file format unverified) [O2] | **No.** Built from a CT scan [O2], i.e. a different body from BodyParts3D, so it needs a non-rigid fit to the BodyParts3D skeleton — hard. | Not looked at (unverified). | [O1] [O2] [O3] |
| **F. NIH 3D** | ? for all 8 | ? | ? | ? | Nothing found: web search gave no NIH 3D hit; the site's search could not be queried from the command line. **Unverified.** | [H1] |
| **G. Wikimedia Commons** | No mesh found. STL search: 0 hits for QL and MF; LD hits unrelated. Only 2D animations exist (e.g. `File:Latissimus dorsi muscle animation.gif`). RA, IO, TA, MA, TE: search was rate-limited — **unverified**. | — | — | — | Not a mesh source. | [W1] |
| **H. Hand-built shapes in code** (between landmarks on the 4.0 bones) | LD, QL, MF: assessed below. RA, IO, TA, MA, TE: possible in principle, not assessed (option A already covers them). | Own work | Code a lofted slab between landmark points, then merge like the other parts. **Estimate** (not measured): QL ½–1 day, MF 1–2 days, LD 2–3 days, plus picking landmarks by hand. | By construction, but only as good as the landmarks. Simple automatic rules found LD's spine and scapula points within 1–3 mm of where the 3.0 muscle attaches, but missed by 6–43 mm for the 12th rib (24), iliac crest (41), humerus groove (43), L2–L4 transverse processes (6–10) and MF spinous points (12–16) [P3] — so landmarks must be picked by hand. | Smooth, simple, clearly different from the fibrous, faceted BodyParts3D meshes around it. Passable for QL (deep, box-shaped, mostly hidden); poor for LD (large, twisting sheet; tendon wraps to the front of the humerus) and MF (many small bundles). | [P3] [B4] |

### Landmark bones for option H (all exist in 4.0 as whole-bone meshes)

4.0 has no separate mesh for iliac crest, transverse process, spinous process or intertubercular groove — only whole bones [B4].

| Muscle | Attachment | 4.0 bone file (right / left) |
|---|---|---|
| QL | 12th rib, lower border (medial half) | `FJ3332` / `FJ3227` |
| QL | iliac crest, posterior part | hip bone `FJ3152` / `FJ3288` |
| QL | L1–L4 transverse processes | `FJ3157`, `FJ3159`, `FJ3162`, `FJ3165` (midline) |
| LD | T7–T12 spinous processes | `FJ3173`, `FJ3174`, `FJ3175`, `FJ3154`, `FJ3155`, `FJ3156` |
| LD | lumbar spine + sacrum (via thoracolumbar fascia), iliac crest | L1–L5 above + `FJ3168`, sacrum `FJ3393`, hip bone |
| LD | scapula inferior angle | `FJ3384` / `FJ3279` |
| LD | humerus, intertubercular groove | `FJ3368` / `FJ3262` — **not in the prototype's bone set** (its filter keeps skull, spine, ribs, pelvis, shoulder girdle) [P4] |
| MF | sacrum back surface; L1–L5 and thoracic spinous processes / laminae | sacrum `FJ3393`; vertebrae above |

File ids from `manifest.json` and the 4.0 OBJ headers [P4][B4].

## Recommendation

1. Use **option A** for all 8 muscles: the warped BodyParts3D 3.0 files already made here. Same authors and look as the rest of the body,
   all 8 muscles, licence fine, no Blender, about ½ day to add to the build.
2. Skip Z-Anatomy: its muscles are the same 3.0 meshes, and its multifidus is worse (does not reach the sacrum). Keep hand-built shapes only as a fallback.
3. **Main risk:** the move from 3.0 to 4.0 is an approximation (1.3–4.1 mm median error, up to ~11 mm in places on tested muscles),
   so small gaps or overlaps with 4.0 neighbours can show, most likely in the layered abdominal wall. Check on a phone at close zoom before relying on it.
4. Side note: 4.0's external oblique mesh covers the rectus area, so rectus abdominis only shows when the external oblique is hidden.

## Sources

Local files are under `C:\projects\Phasy\.scratch\phasy\data\`.

- **[B1]** BodyParts3D archive index and 3.0 folder: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/ and https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/ (3.0 zip: 134,113,358 bytes, same size as the local copy `bodyparts3d-3.0/BodyParts3D_3.0_obj_99.zip`). 3.0 README: `bodyparts3d-3.0/README_e.html`.
- **[B2]** `bodyparts3d-3.0/parts_list_e.txt` (lines 735–736, 739–740, 776–777, 843–844, 847–848, 910–911, 1295–1300: right/left LD, RA, IO, TA, QL, MF, masseter parts, temporalis) and the 18 OBJ files in the 3.0 zip (zip integrity test passed; header "CC Attribution-Share Alike 2.1 Japan").
- **[B3]** Release notes: `bodyparts3d-3.0/release_3.0_e.html`, `bodyparts3d-3.0/release_4.0_e.html` ("Skeletal system has altered … Many of the existing parts have been shifted accordingly"). `coordinate_system.png` in the 3.0 folder and in https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/ (4.0) have the same SHA-256 (`33873627…52a5f6`).
- **[B4]** `bodyparts3d/isa_parts_list_e.txt` (no iliac crest / transverse process / groove entries; humerus FMA23130/23131) and 4.0 OBJ headers in `bodyparts3d/isa_obj/isa_BP3D_4.0_obj_99/` (`FJ3368` right humerus, `FJ3262` left humerus, `FJ3332`/`FJ3227` 12th ribs, `FJ3393` sacrum, L1–L5).
- **[B5]** DBCLS licence page (updated 2025-02-27), local copy `bodyparts3d/lic.html`: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html — "CC Attribution 4.0 International".
- **[P1]** `missing-muscles/compare_bp3d_30_40.py` → `compare_bp3d_30_40.json`, `compare_bp3d_30_40.out.txt` (3.0→4.0 shift of 783 shared structures: median 13.1 mm; warp validation table; triangle counts).
- **[P2]** `missing-muscles/za_vs_bp3d.py` → `za_vs_bp3d.json`, `za_vs_bp3d.out.txt` (closest distance, 1st percentile, from each placed muscle to its attachment bones).
- **[P3]** `missing-muscles/bp30_place.py` → `bp30_warped/*.obj` (18 files), `bp30_place.json`, `bp30_place.out.txt` (landmarks and their distance to the warped 3.0 muscles).
- **[P4]** `bodyparts3d/manifest.json` (prototype part list: 79 bones, no humerus) and [bodyparts3d-muscle-parts.md](bodyparts3d-muscle-parts.md).
- **[P5]** `missing-muscles/rectus_pubis_check.py` → `rectus_pubis_check.out.txt` (RA to pubis: 0.1 mm in 3.0 itself, 0.5–0.7 mm after warp).
- **[R]** Headless renders from `missing-muscles/render_check.py`: `render_back_ld.png`, `render_back_deep.png`, `render_front_abdomen.png`.
- **[Z1]** https://github.com/Z-Anatomy/Models-of-human-anatomy — GitHub API file list (`Z-Anatomy.zip` 86,734,957 bytes = local `z-anatomy/Z-Anatomy.zip`); https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Readme.md ("models derived from 'BodyParts3D'").
- **[Z2]** https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/License.txt (CC BY-SA 4.0; credit "BodyParts3D … CC-BY-SA 2.1 Japan").
- **[Z3]** `missing-muscles/za_list.py` → `za_list.json` (object names, bounds, mirror scale); `missing-muscles/za_export.py` → `za_obj/*.obj` (40 objects exported headless).
- **[Z4]** `missing-muscles/za_vs_bp3d.py` (Z-Anatomy fit to 3.0 and to 4.0, residual per reference structure) and `missing-muscles/za_source_check.py` → `za_source_check.out.txt` (Z-Anatomy vs 3.0 per muscle).
- **[Z5]** https://download.blender.org/release/Blender4.2/blender-4.2.23-windows-x64.zip (383,193,007 bytes = local `tools/blender-4.2.23-windows-x64.zip`); `blender.exe --version` → "Blender 4.2.23 LTS"; PowerShell `Get-Command blender` → none; `Test-Path "C:\Program Files\Blender Foundation"` → False.
- **[N1]** https://github.com/nqwrc/3d-anatomy (repo description; `public/models/muscular.glb`, local copy `z-anatomy/nqwrc/muscular.glb`, 669 nodes, `KHR_draco_mesh_compression`, node names incl. all 8 muscles, `extras.za_name`).
- **[N2]** https://raw.githubusercontent.com/nqwrc/3d-anatomy/HEAD/LICENSE (local `z-anatomy/nqwrc/LICENSE.txt`): effective CC BY-NC-SA 4.0.
- **[C1]** https://github.com/olivercase/body_parts_3d_api — `MANIFEST.csv` and `README.md` (local copies in `bp3d-4.3-index/`).
- **[K1]** Sketchfab API: https://api.sketchfab.com/v3/models/1d9b23621018446f886f461bd7d2adc7 (Quadratus Lumborum) and https://api.sketchfab.com/v3/models/fa2ca759f6a24738be744aaaf2ed9b5f (Latissimus Dorsi) — licence, face count, description.
- **[K2]** Sketchfab API search `q=multifidus`, `q=abdominal muscles`, `q=muscular system` (no matching single-muscle models) and https://api.sketchfab.com/v3/models?user=anatomary&downloadable=true (first 24 models).
- **[O1]** https://www.openanatomy.org/atlases/nac/abdomen-2016-09/atlasStructure.json and https://www.openanatomy.org/atlases/nac/head-neck-2016-09/atlasStructure.json (local copies in `other-models/`; structure names).
- **[O2]** https://www.openanatomy.org/atlas-pages/atlas-spl-abdomen.html (CT-derived; "3D Slicer License section B").
- **[O3]** https://raw.githubusercontent.com/Slicer/Slicer/main/License.txt (Part B: royalty-free licence to use, modify, distribute; research disclaimer).
- **[H1]** Web search "3d.nih.gov latissimus dorsi OR quadratus lumborum 3D model" (2026-09-24): no NIH 3D result.
- **[W1]** Wikimedia Commons API search, namespace File, `filemime:application/sla` + muscle name, and "Latissimus dorsi animation" (https://commons.wikimedia.org/w/api.php).

Not checked: BodyParts3D 2.0 and earlier (3.0 already has all 8); the online Anatomography viewer.

# Filling the muscles BodyParts3D lacks

Type: research
Label: wayfinder:research
Status: resolved
Blocked by:

## Question

Building the 3D view prototype (ticket 09) found that BodyParts3D 4.0 has no mesh at all for latissimus dorsi, quadratus lumborum, multifidus, rectus abdominis, internal oblique, transversus abdominis, masseter and temporalis (checked against every name table and all 2,234 OBJ headers; see [research/bodyparts3d-muscle-parts.md](../research/bodyparts3d-muscle-parts.md)). Three of them — quadratus lumborum, latissimus dorsi, multifidus — are core v1 focus muscles for low back and shoulder Complaints.

Where can meshes for these muscles come from, so they sit correctly on the BodyParts3D skeleton and body? Compare, for each option: which of the eight muscles it has, licence for personal (non-commercial) use, file format and conversion effort, whether it lines up with BodyParts3D's coordinates, and quality. Options to check at least: Z-Anatomy (built on BodyParts3D), older BodyParts3D versions (3.0 / Anatomography), other open anatomy models, and building simple shapes by hand between known bony landmarks on the BodyParts3D skeleton.

Findings go to `research/missing-muscle-meshes.md`.

## Answer

Resolved 2026-09-24. Use the **BodyParts3D 3.0 meshes** (2011, same authors): all 8 muscles are there, one mesh per side. 4.0 moved the trunk skeleton, so the 18 meshes were warped by the displacement of nearby bones; they now sit about 0.5–3.5 mm from their attachment bones (median error 1.3–4.1 mm on muscles present in both versions, worst about 11 mm). Warped files: `.scratch/phasy/data/missing-muscles/bp30_warped/`. The main agent checked the deep-back render (multifidus, quadratus lumborum) by eye: positions look right.

- Z-Anatomy adds nothing: 7 of its 8 are the same 3.0 meshes; its remade multifidus sits about 24 mm off the sacrum. Needs Blender.
- Hand-built shapes: fallback only; acceptable for quadratus lumborum, visibly crude for latissimus dorsi and multifidus.
- Risks: the layered abdominal wall may show small gaps or overlaps — check close up on a phone. The 4.0 external oblique covers the rectus abdominis area. Latissimus dorsi attaches to the humerus, which the prototype does not load yet.
- Licence: 3.0 files carry CC BY-SA 2.1 JP; fine for personal use.

Detail and sources: [research/missing-muscle-meshes.md](../research/missing-muscle-meshes.md).

# Showing BodyParts3D muscles as an interactive 3D body in a phone browser

Type: research
Label: wayfinder:research
Status: resolved
Blocked by:

## Question

How can BodyParts3D (or Z-Anatomy, which is built on it) muscles be shown as an interactive 3D body in a phone browser? Needed facts: how each muscle part is identified and mapped to a muscle name (e.g. FMA ids); file size and mesh count of the full muscle set; conversion to a web format such as glTF; which web 3D library suits tap-to-select and layer peeling (hide surface muscles to see deep ones); and performance on mid-range phones.

Findings go to `research/3d-muscles-in-browser.md`.

## Answer

Feasible with free tools. Use the official BodyParts3D OBJ download (CC BY 4.0; the official page lists version 4.0, 62 MB PART-OF / 136 MB IS-A sets; the "3,210 parts with FMA ids" count comes from a third-party repo and is unverified). Filter the muscle parts, convert to GLB with gltf-transform, merge meshes while keeping a muscle id per part, compress with Draco or meshopt. Render with three.js (Raycaster for tap-to-select, one material per muscle for status colours). Skip Z-Anatomy in v1: hundreds of MB, needs Blender export, share-alike duties.

Open: the exact muscle-only size after filtering; no ready FMA-to-Wikidata name table was found; mobile triangle/draw-call budgets came from secondary sources.

Detail and sources: [research/3d-muscles-in-browser.md](../research/3d-muscles-in-browser.md).

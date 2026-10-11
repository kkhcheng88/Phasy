# Prototype: teaching a treatment without video

Type: prototype
Label: wayfinder:prototype
Status: open
Blocked by: 01, 07, 09

## Question

How does the app teach a Stretch, a Manual technique and a Vacuum cupping step without video, so a Helper can follow it on the spot? Try one of each on the 3D view (e.g. highlighted muscle, direction arrows, pressure and hold time, a step timer) and let the owner and his wife react.

From [How a Session runs](06-how-a-session-runs.md): treatment is one Treatment plan per Session, one round per method (cupping → Manual techniques → Stretches). Cupping shows all cup placements at once on the 3D body and runs one 5–10 min timer.

## Progress

- Built a throwaway prototype at `prototypes/teaching-without-video/`. It reuses `prototypes/session-flow/library.json` (ids only, ADR 0001) and the ticket 09 light BodyParts3D model. No LLM.
- Demo Treatment plan (right side): Vacuum cupping `cp-trap-upper` (static) + `cp-rhomboids` (sliding) together with one 5–10 min timer → Manual technique `mt-levator-hold` → Stretch `st-trap-upper-helper`. Helper can also open one of each from the first screen.
- 3D view highlights the Library `bp3d` mesh, draws a Search circle, and a direction arrow for sliding cups and the head-away stretch. Steps, Right amount, source line and timer come from the Library entry. Unknown ids are refused.
- Overlay 3D points are a prototype stand-in (mesh pickers). Ticket 08 said Library content production still has to place the real 3D points.

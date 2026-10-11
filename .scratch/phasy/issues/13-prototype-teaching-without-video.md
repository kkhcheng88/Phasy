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

## Verification

Ran 2026-10-11 on this branch. Ticket stays open: the owner and his wife have not tried it yet.

- `node prototypes/session-flow/check-library.mjs` — `OK zones=20 situations=16 muscles=12 triggerPoints=20 checks=17 stretches=14 manual=12 cupping=4`
- `node prototypes/session-flow/test/run.mjs` — ALL PASS (Linux Chrome fallback added; `--real` skipped as before)
- `node prototypes/teaching-without-video/test/run.mjs` — ALL PASS. Demo ids resolve from the real Library; unknown `st-not-in-library` is refused; cupping shows both placements and one 5–10 min timer; manual 90 s; stretch helper steps; 3D overlay counts match.
- Browser (Chrome device mode 390×924, `http://localhost:8772/`): walked 拔罐 → 手法 → 伸展, started the 5 min cupping timer (04:59 counting down), then opened 只看手法 from the picker. 3D highlight, Search circles, sliding/head-away arrows, Right amount and Library ids were on screen.

Still for Karson / his wife on a phone: can you place the cups, press, and stretch from the 3D circle + steps + timer, or do you still want a video? The Search circles are a prototype stand-in (not the ticket 08 3D points yet); the upper-trap cup sits a bit toward the neck rather than the thickest part of the shoulder.

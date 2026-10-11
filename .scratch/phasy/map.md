# Map: Phasy v1

Label: wayfinder:map

## Destination

A v1 spec for Phasy — a personal self-care physiotherapy web app for the owner and his wife (later a small Circle) — plus three prototypes they have both tried: the interactive 3D muscle view, the guided Session flow, and camera positioning. Building the full v1 starts after this map.

## Notes

- **Domain:** self-care physiotherapy for daily wellness. Guidance, not diagnosis. Physiotherapy framing only — no TCM concepts. Glossary: [CONTEXT.md](../../CONTEXT.md). Use its terms exactly.
- **Skills:** grilling tickets use `/grilling` + `/domain-modeling`; prototype tickets use `/prototype`; research tickets use `/research` subagents writing to `research/`.
- **Language:** talk to the owner in Hong Kong written Traditional Chinese, plain business language. Repo files in English.
- **Settled while charting (2026-09-24):**
  - Users: the owner and his wife first; not commercial. Any Member can be Helper or Receiver.
  - Positioning: daily self-care guidance. No Danger-sign screen in v1 (owner's decision while resolving the Session ticket; revisit if commercial).
  - Design principle: the Receiver's report ("yes, that is my familiar pain", left vs right) is the measuring tool; the Helper's fingers only press. Trigger point palpation by examiners agrees only moderately (see research).
  - Core screen: interactive 3D body of the selected Member, each muscle coloured by Muscle status.
  - Two layers: the Library holds checked facts; the LLM reasons and refers to Library items by id only — [ADR 0001](../../docs/adr/0001-llm-reasons-library-holds-positions.md).
  - v1 coverage: all muscles with basic facts in the 3D view; deep content (trigger points, Checks, Stretches, Manual techniques, cupping) for neck, shoulders, upper back, low back and hips (about 40 muscles).
  - Platform: web app in the phone browser. One phone holds several Members; no sync in v1.
  - Camera: prototype only. Pass line: on the wife's back, in normal home light, the marked trigger point is within about 2 cm (one finger width) of the book position. v1 does not depend on it.
  - Cupping: Vacuum cupping only, static and sliding; state the evidence honestly (mainly short-term relief).
  - Language: Chinese UI; muscle names in Chinese and English.
- **Research done while charting:**
  - [Anatomy sources](research/anatomy-sources.md) — BodyParts3D is CC BY 4.0 (commercial use and changes allowed, credit required; verified 2026-09-24); OpenStax A&P 2e for muscle facts; commercial viewers need sales deals.
  - [Trigger point and treatment sources](research/trigger-point-and-treatment-sources.md) — books to buy, red flags, palpation reliability, copyright position. Its TCM cupping book is dropped (not physio framing).
- **Unknown facts to collect when needed:** which phones the owner and his wife use (iPhone/Android). Vacuum cups are not a constraint: the owner buys what the Library placements need.

## Decisions so far

<!-- one line per closed ticket -->

- [Can a phone web app keep Members' records safely for months?](issues/04-keeping-records-in-phone-web-app.md) — yes when installed to the home screen; IndexedDB + persistent storage + an "Export backup" file; no server.
- [Showing BodyParts3D muscles as an interactive 3D body in a phone browser](issues/02-3d-muscles-in-phone-browser.md) — feasible: BodyParts3D OBJ → filtered GLB with muscle ids → three.js; skip Z-Anatomy in v1. **Amended 2026-09-24 by the prototype:** BodyParts3D 4.0 has no latissimus dorsi, quadratus lumborum, multifidus or deep abdominals — filling them is ticket [15](issues/15-fill-muscles-bodyparts3d-lacks.md).
- [Can a phone-browser camera place a marker on a person's back within 2 cm?](issues/03-camera-body-tracking-on-back.md) — pose models alone probably not (only shoulders and hips on the trunk); with stickers on bony landmarks, likely yes.
- [Vacuum cupping in physiotherapy: methods, dose and safety](issues/01-vacuum-cupping-physio-sources.md) — static, sliding and with-movement methods; evidence low-to-moderate, short-term relief; placement/frequency sources are weak, so keep v1 rules conservative; journal reviews replace the TCM book.
- [Get the reference books into a readable form](issues/05-get-reference-books-readable.md) — books in `C:\Users\Kaho\Downloads\Physio`; Travell 3rd ed. is text-searchable; Davies (older ed.) and Trail Guide are image-only scans.
- [How a Session runs, and what the LLM decides](issues/06-how-a-session-runs.md) — 8 steps (new Complaint or Follow-up → candidate list → Checks → pick muscles → one Treatment plan → Re-check); Muscle status is a 0–10 Tenderness score, not stages; no Danger-sign screen; alone = self-check + Stretches.
- [Filling the muscles BodyParts3D lacks](issues/15-fill-muscles-bodyparts3d-lacks.md) — BodyParts3D 3.0 has all 8 missing muscles; warped onto the 4.0 skeleton (errors of a few mm); Z-Anatomy and hand-built shapes not needed.
- [How a trigger point's position is stored](issues/08-how-trigger-point-position-is-defined.md) — landmark description for hands and camera plus a 3D point; shown as a Search circle, not a pinpoint; named Body zones (~30–60 per side) for Complaints and Referral zones; one adult male body for all Members in v1.
- [Which LLM, and where its key lives](issues/12-llm-provider-and-key.md) — DeepSeek for v1 (only provider whose terms cover Hong Kong; data goes to mainland China, pseudonymous only); endpoint, model, effort and key configurable in settings; key on each phone with a small prepaid cap; app refuses unknown Library ids.
- [What a Library entry holds](issues/07-library-entry-contents.md) — entry shape per item with sources; NAER Chinese names; muscles split into parts where the books do; Provoking situation told freely and mapped by the LLM to a fixed list; Test movement scores the Complaint; three Pressure levels; every treatment step states its Right amount, no "stop if" line.
- [Prototype: the interactive 3D muscle view](issues/09-prototype-3d-muscle-view.md) — pass (owner has no concern with the model); light model by default; peeling is a layer slider that can go back; v1 takes muscle depth from the Library. Wife's reaction not yet collected.

## Not yet specified

- **Library content production** — drafting entries for the ~40 focus muscles from the books and open sources, and how each entry is checked. Waits on the Library entry shape. Two of the books are image-only scans, so this likely starts with OCR or a muscle-to-page index.
- **Progress over time** — how improvement across Sessions is shown to a Member. The data is now fixed (Tenderness score history per muscle, movement score per Complaint); the 3D view prototype has passed, so the screen can now be designed.
- **Assembling the v1 spec** — pulling the resolved tickets into one spec document to hand to the build.

## Out of scope

- Commercial release (app store, content licensing review, medical regulation) — personal use first; a new effort if that changes.
- Diagnosis claims — the app gives self-care guidance only.
- Danger-sign and contraindication screening — dropped from v1 by the owner ("let's focus physio"); belongs to a commercial release. See [How a Session runs](issues/06-how-a-session-runs.md).
- Fire cupping and TCM concepts (meridians, acupoints, qi) — the owner wants physiotherapy framing.
- Sync between phones — v1 uses one phone; add when a second-phone Member joins.
- Building the full v1 — starts after this map.

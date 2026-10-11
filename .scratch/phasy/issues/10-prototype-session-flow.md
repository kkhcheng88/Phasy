# Prototype: a Session on one real Complaint

Type: prototype
Label: wayfinder:prototype
Status: open
Blocked by: 05, 06, 07

## Question

Does the Session flow feel like reasoning with a physiotherapist when the owner runs it with his wife on one real Complaint? Build a rough clickable prototype (a flat body picture is fine) with Library entries for the few muscles that Complaint involves, and the LLM driving the conversation per ADR 0001.

## Progress

- 2026-09-24: the owner picked the Complaint: 「肩頸攰」 (neck and shoulders tired). The kind list (tight / sore / pain) has no "tired", so the prototype adds 疲累 as a fourth kind — a glossary question to settle after the test.
- Hosting: the claude.ai artifact host blocks fetch to outside hosts (CSP), so the page cannot call DeepSeek from there. The prototype runs from the owner's PC (`prototypes/session-flow/server.mjs`, port 8770) and the phone opens it over home Wi-Fi; the server also saves each Session log to `.scratch/phasy/session-logs/` for review. v1 will need real static hosting — note for the v1 spec.
- Data contract: `prototypes/session-flow/LIBRARY-FORMAT.md`. Library content (neck / shoulder muscles from Travell 3rd ed.) and the app are built in parallel against it.
- Follow-up Sessions are out of scope for this prototype.
- 2026-09-24, built: `library.json` — 12 neck / shoulder muscles or groups, 20 zones, 16 Provoking situations, 20 trigger points (each with its own `at` zone, added because 「攰」 is felt where the muscle is, not only where it refers), 17 checks, 14 stretches, 12 manual techniques, 4 cupping placements; `check-library.mjs` validates it. App: `index.html` + `app.js` + `llm.js` (all prompts in one file) + `server.mjs`; `start.cmd` starts it. Tests: `node test/run.mjs --real` (mock LLM, headless Edge) — all pass.
- Rules added while building: a muscle × side that gave Familiar pain leaves the check list; reasoning setting defaults to "thinking off" for speed; after 15 s the user can stop waiting for the AI and take the fixed order.
- 2026-09-24, independent review of the Library against Travell: [research/library-review-neck-shoulder.md](../research/library-review-neck-shoulder.md) — 1 blocker (splenius capitis press point could send a lay Helper to the hollow under the ear; fixed: anchored behind the SCM, light pressure, "do not press" line), 10 fixes (dose pairs now 2–4/10 × 90 s or 4–6/10 × 30 s as in the book; seven near-literal steps rewritten; plain words; `noPress` points on the front and side of the neck; dizziness stop on look-up / turn-head tests; cupping cautions extended), all done. App: `noPress` points show "locate only", light checks say "press lightly", no manual technique on a muscle cupped in the same Session. Full suite passes on the real Library.
- Waiting on: the owner's DeepSeek key and one real Session with his wife.
- Library caveats: the "deep" Pressure level (6 kg) is an estimate; a few hold times and self-stretches are assembled from the book's directions, not given by it; scalenes are never pressed (nerves and vessels); cupping pages not found (research notes, not book pages).
- 2026-10-11: acceptance checklist written below (code checked against it; mock-LLM tests; Session log also written to IndexedDB). Status stays open until a real Session with Karson's DeepSeek key.

## Acceptance checklist

Concrete pass/fail items for this prototype (tickets 06 + 07, ADR 0001). Follow-up Sessions stay out of scope.

### 1. All 8 Session steps reachable

A Session with a Helper must be able to walk through every step, in this order:

1. **開始** — pick the Receiver; answer whether a Helper is present.
2. **不適** — side, Body zones, kind (緊 / 酸 / 痛 / 疲累); Provoking situation in the Receiver's words mapped to the Library list (or picked from the list); Test movement scored 0–10.
3. **可疑肌肉** — candidate list from Library rules (referral / `at` zone / loaded by the situation); LLM may rank and add a Library muscle with the 「AI 加入」 tag.
4. **檢查** — each Check's method and position from the Library; Tenderness score, Familiar pain, Pain shape; on Familiar pain, compare the other side; stop after two Familiar-pain muscles, 8 Checks, the list is done, or the Member taps 「完成檢查」.
5. **揀選肌肉** — Familiar-pain muscles pre-ticked; other muscles with Tenderness score 5+ listed below, not ticked.
6. **處理方案** — one round per method, in this order: Vacuum cupping → Manual techniques → Stretches. No Helper: Stretches only. A muscle cupped in this Session gets no Manual technique.
7. **再檢查** — re-press each treated muscle and redo the Test movement; if a muscle's score rises by 2+, show 「這一節停止處理這條肌肉」.
8. **總結** — summary, Muscle status colours, Session log saved.

### 2. Only Library ids; unknown ids refused (ADR 0001)

- Every LLM reply is checked against the allowed Library ids of that step.
- Unknown ids are dropped, written to `log.refusals`, and a note 「AI 回覆了知識庫以外的項目，已略過」 is shown.
- Unknown ids never appear in the page.
- A missing or unusable reply uses that step's fixed fallback so the Session still finishes.

### 3. 15 s LLM fallback

- While waiting, the page shows 「AI 思考中… N 秒」.
- From 15 s, 「不等了，用預設次序」 is shown.
- Tapping it aborts the call, uses the fixed order, shows 「已停止等候 AI」, and the Session log records the call as `aborted`.

### 4. Familiar pain removes that muscle × side from the check list

- Once a muscle × side gives Familiar pain, its remaining Checks leave the allowed set.
- The other side of the same muscle stays if it is still a candidate.
- If the LLM then names a Check that has left the set, that id is refused.

### 5. noPress / press-lightly

- A `noPress` trigger point shows 「只用手指輕輕認位，不要向內按」 (locate only). No Search-circle 「最痛」 line, no 「按哪裏」, no 力度. The score heading is 「不適分數」.
- A Check with pressure `light` shows 「輕輕按，找最敏感的一點」.
- A Check with pressure `standard` shows 「慢慢按，找最痛的一點」.

### 6. Session log saved to IndexedDB

- At the end of a Session the log (inputs, LLM requests/replies/timings, refusals; never the API key) is written to IndexedDB (`phasy` / `sessions`) on the phone.
- A copy is still kept in `localStorage` (`phasy.sessions`) and, for this prototype, POSTed to the PC (`.scratch/phasy/session-logs/`).
- A Session with no API key still saves the log.

Mock-LLM coverage: `node test/run.mjs` (Sessions A–D, F–H on the stub Library). `node test/run.mjs --real` adds Session E on `library.json` after `check-library.mjs` passes.

## Verification

2026-10-11, mock LLM only (not a real Session). Status stays **open**.

Commands:

```
node prototypes/session-flow/check-library.mjs
# OK zones=20 situations=16 muscles=12 triggerPoints=20 checks=17 stretches=14 manual=12 cupping=4

cd prototypes/session-flow && node test/run.mjs --real
# ALL PASS (Sessions A–D, F–H on the stub; Session E on library.json)
```

Gap found and fixed in this pass: the Session log was only in `localStorage` + `POST /log`. It is now also written to IndexedDB (`phasy` / `sessions`). Tests assert that store.

| Checklist item | Result | Evidence |
|---|---|---|
| 1. All 8 Session steps reachable | **pass (mock)** | Session A: start → 不適 → candidates → 2 Checks → pick → plan (cupping then manual then stretches) → re-check → 「第 8 / 8 步・總結」. Session E (real Library) also reached end. |
| 2. Only Library ids; unknown ids refused | **pass (mock)** | Session B: `m-not-in-library`, `c-not-in-library`, `st-not-in-library` refused, note shown, never on the page; fallback Checks used. |
| 3. 15 s LLM fallback | **pass (mock)** | Session H: counter; 「不等了，用預設次序」 at 15.0 s; fallback Check at 15.1 s; log `aborted`. |
| 4. Familiar pain removes muscle × side | **pass (mock)** | Session G: right 斜方肌上部 Familiar pain → `c-trap-upper-sidebend\|R` refused; left-side trapezius Checks stay allowed. |
| 5. noPress / press-lightly | **pass (mock)** | Session C: noPress 頭夾肌 「只用手指輕輕認位」 / 「不適分數」. Session A: standard 「找最痛的一點」; light 「輕輕按，找最敏感的一點」. |
| 6. Session log saved to IndexedDB | **pass (mock)** | Session A: 1 record, `app=phasy-session-flow`, 11 LLM calls, key not stored. Session D (no key): still saved, 0 LLM calls. `POST /log` still works. |

Left open (ticket question still unanswered):

- One real Session with the owner's wife, using Karson's DeepSeek key.
- Follow-up Sessions (out of scope for this prototype).
- Glossary: whether 疲累 stays as a fourth kind.

Plan of cupping then manual then stretches (Session A): `cp-trap-upper → mt-levator-hold → st-trap-upper-seated → st-trap-upper-assisted → st-levator-seated`. 斜方肌上部 was cupped so its Manual technique was dropped (note shown, `planDrops`, not a refusal).

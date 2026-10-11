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

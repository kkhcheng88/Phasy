# What a Library entry holds

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 06

## Question

What does a Library entry hold for one muscle, and for each of its Trigger points, Checks, Stretches, Manual techniques and cupping placements, so that the Session flow and the 3D view can use it? Mark which fields come from open sources (OpenStax, Wikidata, BodyParts3D) and which are drafted from the reference books, and pick the source for Chinese muscle names.

Needs from [How a Session runs](06-how-a-session-runs.md): per Check, whether it can be done alone; per muscle, whether Vacuum cupping suits it (else Manual technique); Referral zones matchable against Complaint zones for the reverse lookup; each Check's method and position, and each treatment's pressure and hold time, so the LLM never supplies them.

## Answer

Resolved 2026-09-24 by grilling with the owner (two rounds). Glossary updated in `CONTEXT.md` (Complaint, Provoking situation, Test movement, Pressure level, Right amount).

### Decisions

1. **Chinese muscle names:** Taiwan NAER academic terms (國家教育研究院 樂詞網), always shown with the English name. A common name may follow in brackets when the NAER term is stiff. Personal use, so the unverified NAER licence does not block.
2. **Muscles outside the ~40 focus muscles:** name (Chinese + English), one plain line on what movement it does, where it attaches. Source: OpenStax A&P 2e. No nerves or vessels.
3. **Muscle parts:** a muscle is split where the books treat its parts separately (e.g. upper / middle / lower trapezius); each part has its own Tenderness score and colour. BodyParts3D already splits trapezius, pectoralis major and the erector spinae columns.
4. **Provoking situation (changes step 2 of ticket 06):** the owner rejected a pick-list — real reports are free and often not a movement ("坐巴士靠背時頂住", or just "緊"). So: the Receiver describes it in their own words; the LLM maps it to one or two Provoking situations from a fixed Library list (movements *and* postures) by id; the app shows that reading and the Receiver confirms or changes it; fixed rules then build the candidate list as before (ADR 0001 holds).
5. **Test movement (extends step 2 of ticket 06):** when the Provoking situation cannot be done on the spot, or there is none, the LLM picks a Test movement from the Library that loads the Complaint area; the Receiver scores it 0–10 and every Follow-up repeats the same one. Agent's reason: a score at rest drifts with mood and the day.
6. **Check pressure:** the owner doubted one standard force suits deep muscles (e.g. piriformis under gluteus maximus). So each Check names one of three Pressure levels — light / standard / deep — with the force from the books; each level is learned once on a kitchen scale. Scores compare across Sessions because the same Check always uses the same level.
7. **Right amount on every treatment step, no "stop if" line:** the owner rejected a separate stop warning; what is needed is how far is right ("按到什麼程度就可以"). Each Stretch, Manual technique and cupping step states four things: pressure or stretch strength as the Receiver feels it (e.g. 5–7 of 10, "痛得舒服"), time, the right feeling (tight pull, ache), and the wrong feeling (numbness, electric feeling, sharp pain — a nerve, not a muscle, which a force number cannot show). Treatment pressure is set by the Receiver's feeling, not by force.

Accepted defaults (proposed by the agent; the owner did not object):
- All Trigger points from Travell are kept; the Session only checks those whose Referral zone matches the Complaint.
- Every focus muscle has at least one Stretch a Member can do alone; a Helper version only where a source gives one.
- Every item records its source (book + page); the app shows it in small print.
- Cupping suitability, cup size and time come from the research and books, not the LLM.
- All text is rewritten and all pictures redrawn; nothing is copied from the books.

### Entry shape

| Item | Holds | Source |
|---|---|---|
| Muscle (or part), all ~400 | BodyParts3D element ids (left, right); English name; Chinese name; attachments; one-line action | BodyParts3D / FMA; NAER; OpenStax |
| Muscle, focus ~40 only | + surface or deep; cupping suits yes/no; Provoking situations that load or stretch it; its Trigger points, Checks, Stretches, Manual techniques, cupping placements | Books (Travell, Trail Guide, Kendall / Neumann); cupping research |
| Trigger point | position; Referral zone as zone ids | Travell; storage format and zone grid set by ticket 08 |
| Provoking situation (one shared list) | Chinese name; movement or posture; can be done on the spot; usable as Test movement; muscles it loads; Complaint zones it tests | Books + OpenStax actions |
| Check | kind (press / hold a position / movement); target Trigger point or muscle; Receiver's position; Helper's method; Pressure level; can be done alone | Travell, Trail Guide, Kendall |
| Stretch | target muscles; start position; steps; alone or with Helper; Right amount; reps | Books; stretching sources |
| Manual technique | kind (e.g. sustained pressure on a point, slow glide along the muscle); target; Right amount | Travell, Davies |
| Cupping placement | position; cup size; static or sliding; Right amount | Cupping research (ticket 01) |

Every item also holds its source (book + page). The LLM refers to all of these by id only.

### For later tickets

- Ticket 08 sets how positions are stored and the zone grid; Referral zones and "Complaint zones it tests" use that grid.
- Library content production must also write the Provoking situation list (movements and postures) and mark which ones serve as Test movements.

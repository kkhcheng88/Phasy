# How a Session runs, and what the LLM decides

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by:

## Question

What are the steps of a Session, from the Danger-sign screen to the Re-check, and at each step what does the LLM decide versus what comes fixed from the Library or rules (per ADR 0001)?

Cover:
- how a Complaint is entered on the 3D body;
- how candidate muscles are found (e.g. reverse lookup from Referral zones and the movement that brings the Complaint on);
- how Checks are ordered, and what the Receiver reports after each;
- when a Muscle status moves between Unchecked, Suspected, Confirmed, Treating and Improving;
- which Danger-sign questions are asked (start from `research/trigger-point-and-treatment-sources.md` §4).

## Answer

Resolved 2026-09-24 by grilling with the owner (four rounds). Glossary updated in `CONTEXT.md` (Helper, Session, Follow-up, Complaint, Familiar pain, Muscle status, Tenderness score, Pain shape, Treatment plan; Danger-sign screen removed).

### The flow

1. **Start.** Pick the Receiver, then answer "is someone helping?". Who helps is not recorded; the Helper need not be a Member.
2. **Complaint.**
   - *Amended by ticket 07:* the Receiver describes the Provoking situation freely and the LLM maps it to the Library list; a Test movement from the Library scores the Complaint when the situation cannot be done on the spot.
   - New Complaint: the Receiver taps the location on the 3D body (the app snaps taps to fixed small zones, about 30–60 per side), picks the kind (tight / sore / pain), names the movement that brings it on, does that movement on the spot and scores it 0–10. That movement score is the Complaint's strength.
   - Follow-up: skip to step 4 and re-press the muscles that gave Familiar pain for this Complaint last time plus the muscles treated last time. If the movement score has not dropped, the LLM may suggest checking more muscles from the list.
3. **Candidate list.** The LLM asks follow-up questions (it reads saved Member info and Complaint history and does not re-ask). Fixed rules build the candidate list: reverse lookup from the Complaint zones to Library Referral zones, plus the provoking movement. The LLM ranks the list. It may add another Library muscle, by id, with a stated reason, shown as "AI added".
4. **Checks.** The LLM picks the next Check from the list; the Check's method and position come from the Library. The Helper presses; Helper and Receiver agree on one Tenderness score (if they disagree, the Receiver's number counts). The Receiver also answers Familiar pain (yes/no) and Pain shape (only at the point / an area / along the muscle / somewhere else). On Familiar pain, press the same point on the other side to compare. Stop when two muscles give Familiar pain, or after 8 Checks, or when the list is done; the LLM may stop earlier and must say why. Nothing found = record "not found", then ask more questions or end.
5. **Pick muscles to treat.** The app lists problem muscles: Familiar-pain muscles first, pre-ticked; other muscles with Tenderness score 5+ below, not ticked. The Member ticks. No cap on the number.
6. **Treatment plan.** The LLM builds one Treatment plan for all ticked muscles, done as one round per method in this order: Vacuum cupping (all cups shown at once on the 3D body, placed together, 5–10 min) → Manual techniques (including spots unsuitable for cups) → Stretches for every ticked muscle. Cups owned are not a constraint: the owner buys whatever the Library placements need. Alone (no Helper): Stretches only. Methods, positions, pressure and hold times come from the Library; the LLM only chooses among allowed items and explains.
7. **Re-check.** Re-press each treated muscle and redo the provoking movement; compare both scores with before. If a muscle's score rises by 2+, stop treating it this Session.
8. **End.** The 3D body updates its colours; the LLM writes a summary.

### Muscle status

- Grey = Unchecked; dashed = Suspected (on the candidate list, not yet checked); checked = 0–10 Tenderness score coloured green → yellow → red.
- Per muscle per side. The highest Trigger point's score counts.
- The colour fades after 4 weeks without a new Check; the status itself does not change.
- No Confirmed / Treating / Improving stages. Improvement shows as the score going down; treatments show in the history. Familiar pain is a separate mark linking a muscle to a Complaint.
- Caveat: pressing force varies between days and people, so scores across Sessions show a trend only. Before/after inside one Session is the reliable comparison.

### Complaint lifecycle

A Complaint is kept across Sessions. When the movement score is 1 or lower in two Follow-ups in a row, the app suggests closing it and the Member confirms. Closed Complaints stay in history and leave the Follow-up list.

### LLM vs fixed rules (per ADR 0001)

- Fixed (Library / rules): the candidate list, each Check's method and position, Tenderness score colours and status changes, stop rules, treatment methods, positions, pressure and times, cup placements.
- LLM: follow-up questions, ranking candidates, choosing the next Check, reading free text, explaining why a muscle is suspected, adding a Library muscle with a reason, choosing treatments among allowed ones, the end summary.

### No Danger-sign screen in v1

The owner removed all danger-sign and contraindication questions, including the agent's proposed one-line heart warning for shoulder / upper-back / arm / chest Complaints. Owner's words: "These are crazy and not needed. normal ppl will for sure know this is not physio" and "Not need. let's focus physio. later when commericalise can consider back if needed". Agent's recorded concern: heart pain can present as left shoulder or upper back pain, which is the v1 focus area. Revisit if the app goes commercial.

### Facts later tickets need

- The Library needs, per Check: whether it can be done alone. Per muscle: whether cupping suits it, else Manual technique.
- Referral zones must be stored so they can be matched against the Complaint zones (see the trigger point position ticket).
- Each cupping placement in the Library states its cup size, so the shopping list comes out of the Library. The owner will buy what it needs.

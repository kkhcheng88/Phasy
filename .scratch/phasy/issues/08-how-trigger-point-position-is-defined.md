# How a trigger point's position is stored

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 02, 03

## Question

How is the position of a Trigger point, a Referral zone and a cupping placement stored so that both the 3D view and the camera overlay can show it? For example: a point on a BodyParts3D mesh surface, a position relative to bony landmarks, or both. Research (ticket 03) found the camera can only work from stickers on bony landmarks the Helper finds by touch, so a landmark-relative position (e.g. "three finger widths below the shoulder blade ridge") may serve the camera, the 3D view and the Helper's own hands at once.

From [How a Session runs](06-how-a-session-runs.md): the Receiver taps the Complaint on the 3D body and the app snaps it to fixed small zones (about 30–60 per side). Referral zones must be stored in the same zones so the candidate list can be found by reverse lookup. This ticket sets the zone grid.

## Answer

Resolved 2026-09-24 by grilling with the owner (one round). Glossary updated in `CONTEXT.md` (Body zone, Search circle).

1. **Both, landmark first.** Every Trigger point and cupping placement stores (a) a hands-on description from bony landmarks the Helper can feel, e.g. "middle of the shoulder blade's inner edge, two finger widths towards the spine", and (b) a point placed on the BodyParts3D model for the 3D view. The landmark description serves the Helper's hands and, later, the camera (stickers on the same landmarks).
2. **Search circle, not a pinpoint.** The 3D view shows a circle about one to two finger widths across; the Helper presses slowly inside it to find the most tender spot that gives Familiar pain. Book positions are averages and people differ by 1–2 cm; the Receiver's report finds the real spot. The circle also absorbs finger-width differences between Helpers.
3. **Named Body zones.** The body surface is divided into named Body zones (about 30–60 per side) that follow the body's shape, e.g. 頸後上段, 肩胛骨之間, 腰部脊骨旁. A Complaint is a set of Body zones; each Referral zone is stored as a set of Body zones, so the reverse lookup is a zone match. Zones are drawn on the 3D body during Library content production.
4. **One body for all Members in v1.** BodyParts3D is an adult male model; every Member uses it. Positions start from bony landmarks, so they hold on any body shape. A female model may be considered later (owner: "A first, consider B later").

### For later tickets

- Library content production draws the Body zones, places each 3D point and writes each landmark description.
- The camera prototype (ticket 11) tests the landmark descriptions directly: stickers on the named landmarks, then the Search circle drawn from them.

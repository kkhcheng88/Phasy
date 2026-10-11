# Phasy

A self-care physiotherapy app for a small circle of people (family, friends, gym buddies) who check and treat each other's muscles. It follows physiotherapy reasoning, not Traditional Chinese Medicine, and it guides; it does not diagnose.

## Language

### People

**Member** (成員):
A person in the circle who has a body record in the app.
_Avoid_: patient, client, user, profile

**Circle** (圈子):
The small group of Members who help each other, e.g. a couple, a family, gym buddies.
_Avoid_: team, clinic

**Helper** (幫手):
The person who presses and treats the Receiver in a Session. The Helper need not be a Member; a Session only knows whether a Helper is present, not who.
_Avoid_: therapist, practitioner, physio

**Receiver** (受助者):
The role of the Member being checked or treated in a Session.
_Avoid_: patient

**Session** (一節):
One sitting in which a Receiver is checked and/or treated. Either a first look at a new Complaint, or a Follow-up of an existing one. Without a Helper it is a self-check plus Stretches only.
_Avoid_: appointment, visit

**Follow-up** (跟進):
A Session on an existing Complaint that starts by re-pressing the muscles scored last time, then treats.

### Assessment

**Complaint** (不適):
What the Receiver feels and reports: where, what kind (tight, sore, pain), which Provoking situation brings it on, and how strong (0–10) on the Test movement. A Complaint is kept across Sessions and followed up until it is closed.
_Avoid_: symptom, problem

**Provoking situation** (誘發情況):
A movement or posture from the Library's fixed list that brings a Complaint on, e.g. turning the head left, sitting leaned back against a seat. The Receiver describes it in their own words; the LLM maps it to the list and the Receiver confirms.
_Avoid_: trigger (clashes with Trigger point)

**Test movement** (測試動作):
The movement the Receiver does on the spot to score a Complaint 0–10. It is the Provoking situation when that can be done on the spot; otherwise the LLM picks one from the Library that loads the Complaint area. Every Follow-up repeats the same one.

**Familiar pain** (平時那種痛):
The Receiver's "yes" when a Check reproduces the same pain as their Complaint. It links a muscle to the Complaint; a muscle can be tender without it.

**Check** (檢查):
A guided step — pressing a point, holding a position, or doing a movement — whose result the Receiver reports.
_Avoid_: test, diagnosis

**Re-check** (再檢查):
Repeating an earlier Check after a treatment to see whether the Complaint changed.

**Muscle status** (肌肉狀態):
The current state of one muscle, on one side, of one Member: Unchecked (未檢查), Suspected (懷疑, on the candidate list but not yet checked), or checked with a Tenderness score. Improvement shows as the score going down, not as a separate status.
_Avoid_: situation, diagnosis, condition, confirmed, treating

**Tenderness score** (壓痛分):
One 0–10 rating of the pain when a muscle is pressed, agreed between the Receiver and the Helper (the Receiver's number counts if they differ); the highest point counts when a muscle has several Trigger points. Colours the muscle on the 3D body.
_Avoid_: severity

**Pressure level** (力度級):
How hard a Check presses: light, standard or deep. Each Check names one level, so the same Check presses the same way every time; each level is learned once on a kitchen scale.

**Pain shape** (痛的形態):
Where the pain goes when a point is pressed: only at the point, an area around it, along the muscle, or somewhere else (referred).

### Muscles

**Library** (知識庫):
The fixed, checked set of facts the app relies on: muscles, trigger point positions, referral zones, Checks, Stretches, Manual techniques and cupping placements.
_Avoid_: database, content

**Trigger point** (激痛點):
A tender, taut spot in a muscle; pressing it can reproduce pain felt somewhere else.
_Avoid_: knot, acupoint

**Referral zone** (牽涉痛範圍):
The area where a trigger point's pain is felt, often away from the trigger point itself. Stored as a set of Body zones.
_Avoid_: pain map

**Body zone** (身體分區):
One of about 30–60 named small areas per side of the body surface, e.g. 肩胛骨之間. A Complaint's location and every Referral zone are recorded as sets of Body zones.
_Avoid_: grid square, region

**Search circle** (搜尋圈):
The circle, about one to two finger widths across, that shows a Trigger point or cupping placement on the 3D body. The Helper finds it from bony landmarks and presses inside it for the most tender spot.
_Avoid_: exact point

### Treatments

**Treatment plan** (處理方案):
The treatments for all muscles picked in one Session, done as one round per method: Vacuum cupping, then Manual techniques, then Stretches.
_Avoid_: protocol, per-muscle treatment

**Right amount** (合適程度):
How far a treatment step should go, stated on every step: strength as the Receiver feels it (0–10), time, the right feeling (e.g. pull, ache) and the wrong feeling (e.g. numbness, sharp pain).
_Avoid_: dose, stop rule

**Stretch** (伸展):
A held position that lengthens a target muscle to relax it.
_Avoid_: sketch

**Manual technique** (手法):
Hands-on pressure a Helper applies to a trigger point or along a muscle group.
_Avoid_: manual therapy, massage

**Vacuum cupping** (抽真空拔罐):
Cupping with pump or silicone cups that lift the skin and muscle by suction, used as a soft-tissue technique on muscle and fascia. Two methods: static cups (定罐) and sliding cups (走罐).
_Avoid_: fire cupping, TCM cupping, meridian, acupoint

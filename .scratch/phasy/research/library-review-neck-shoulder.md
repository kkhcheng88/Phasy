# Independent review — Library content for Complaint 「肩頸攰」 (ticket 10)

- Reviewed file: `prototypes/session-flow/library.json` (not edited). Also read: `LIBRARY-FORMAT.md`, `CONTEXT.md`, `check-library.mjs`, `app.js` (grep), `.scratch/phasy/research/vacuum-cupping.md`.
- Book: Travell, Simons & Simons, *Myofascial Pain and Dysfunction: The Trigger Point Manual*, 3rd ed. (local PDF). Text was pulled with PyMuPDF and searched by script.
- Reviewer date: 2026-09-24. Scope: 12 muscles, 20 trigger points, 17 checks, 14 stretches, 12 manual items, 4 cupping items, 3 pressure levels, the situations that load these muscles.

## Page-number convention

The PDF has no page labels. The printed footer number on each page = PDF index + 1 (checked on many pages across the book). All page numbers below are these footer numbers. The library's `source.page` values use the same numbering, and every cited page opened on the right topic.

## Check script (re-run by reviewer)

```
> node C:\projects\Phasy\prototypes\session-flow\check-library.mjs
OK zones=20 situations=16 muscles=12 triggerPoints=20 checks=17 stretches=14 manual=12 cupping=4
EXIT=0
```

## Counts

| severity | count |
|---|---|
| block | 1 |
| fix | 10 |
| note | 10 |

Verdict for one supervised home test Session: **not yet**. Safe after B1 is fixed. The fix items should be done before any wider use.

## Findings

| # | item id | severity | what is wrong | evidence (book page + short paraphrase) | suggested fix |
|---|---|---|---|---|---|
| B1 | mt-splenius-capitis-hold (step 2, name), c-splenius-capitis-press (aloneMethod) | **block** | The hands-on steps say only 「耳後骨下方的小凹位」 (the small hollow below the bone behind the ear). They drop the "behind the SCM" anchor that the trigger-point landmark has. A lay Helper will find the obvious hollow directly under the ear lobe / behind the jaw angle. That is the side of the upper neck (facial nerve exit, parotid, deep carotid sheath, C1 transverse process), not the splenius. The manual item then holds pressure there for 90 s; the check uses standard pressure (about 4 kg). The item name 「耳後骨下方持續按壓」 repeats the same unsafe cue. | p.436: the splenius capitis TrP is palpated in the small triangle behind the upper SCM and in front of the upper trapezius, at about C2, with pressure toward the back of the neck. p.433–434: referral to the vertex. | In both texts: 「頸後、胸鎖乳突肌（頸側那條由耳後斜落胸骨頂的粗肌肉）的後面，手指向頸後中線方向按；不可按耳垂正下方或下顎角後面的凹位」. Rename the manual item (for example 「頭顱底外側、頸後上段持續按壓」). Lower `c-splenius-capitis-press` to `light` for v1, or set `alone:false`. |
| F1 | mt-trap-upper-hold, mt-trap-middle-hold, mt-trap-lower-hold, mt-splenius-cervicis-hold, mt-supraspinatus-hold | fix | Strength 「4–6 / 10：酸、實」 is combined with 「每點約 90 秒」. The book's 90 s dose is for pressure *below* the pain threshold. The 30 s dose is for pressure *at* pain tolerance. The library mixes the stronger pressure with the longer time. (mt-rhomboids-hold, 4–6/10 for 15–30 s, is correct. mt-levator-hold and mt-splenius-capitis-hold at 3–5/10 for 90 s are borderline but acceptable.) | p.1878: ischemic-compression study (Hou et al.) — 90 s at a low, below-threshold pressure, or 30 s at pain tolerance. p.1879: pressure release — "discomfort but no pain", the finger follows the release. | Either 「2–4 / 10，每點約 90 秒」 or keep 「4–6 / 10」 with 「每點約 30 秒」. Do not keep both the high number and 90 s. |
| F2 | mt-posterior-cervical-glide | fix | Internally inconsistent. Step says 「每秒 8 至 10 厘米或更慢」; a neck-base-to-skull stroke is about 10 cm, so one stroke is about 1 s. The time field says 3–5 strokes take 「全程約 2 至 3 分鐘」. A lay Helper who follows the speed number will do a fast rub on the back of the neck. | p.1886: the 8–10 cm/s speed is a general deep-stroking guide, "slower if the tissue is sensitive". | Replace the speed number with 「每次由頸根推到頭顱底約 10 至 20 秒，越慢越好」. |
| F3 | tp-scalenes-1; tp-scm-sternal-mid, tp-scm-sternal-upper, tp-scm-clavicular (render path) | fix | The content says 「只作認位，不要用力按」 (scalenes) and "only pinch the muscle, do not press inward" (SCM). But `app.js` line 148 adds the fixed line `SEARCH_CIRCLE` 「在這一點附近約一至兩指寬的範圍內慢慢按，找最痛的一點。」 under every landmark. On screen, the Helper is told to press and search for the most painful point on the front/side of the neck, beside the brachial plexus and carotid. This is a content-vs-app conflict, not a library-only error, but it makes these items unsafe as displayed. | p.543–547: scalene palpation must be done "very carefully" because the plexus and vessels lie next to the muscle. p.284–285: SCM is examined by lifting it in a pincer grip, not by pressing into the neck. | Add a per-trigger-point flag (for example `"noPress": true`) and have the app skip or replace the search line (「只用眼和手指輕輕認位，不要向內按」). Until then, do not show these trigger points in the home test. |
| F4 | s-look-up, s-turn-head | fix | Test movements ask for end-range extension (look at the ceiling) and end-range rotation, held 3 s. There is no dizziness stop. The Receiver is often seated with no one watching the face. | p.281–282: SCM (clavicular) TrPs cause postural dizziness with quick rotation or looking up. p.540: the scalene chapter asks for caution with cervical rotation/extension (vertebral artery). | Add to both `testHowTo`: 「如感到頭暈、眼前發黑、手麻，即時停止並慢慢回正。」 |
| F5 | cp-trap-lower (sliding) | fix | The path 「杯口放在肩胛骨下角旁，沿肌肉斜向上外慢慢推向骨脊內端」 runs along the lower medial border of the shoulder blade, up to the root of its spine. The same text then says 「不要經過…肩胛骨邊緣」. The Helper cannot do both. A cup sliding over the bone edge breaks the seal and bruises. | vacuum-cupping.md §4: avoid bony prominences; sliding cupping only over flat muscle. p.259: lower trapezius fibres cross the medial border — the muscle and the bone edge are at the same place. | Define the path as 「由肩胛骨下角內側一隻手指寬以外開始，與脊骨平行向上推，杯邊保持離開肩胛骨邊緣及脊骨各一隻手指寬」 (same pattern as cp-rhomboids). |
| F6 | cp-trap-upper, cp-trap-middle, cp-trap-lower, cp-rhomboids | fix | The "do not cup" list names only anticoagulants, pregnancy, broken/inflamed skin and fever. It leaves out bleeding disorders / easy bruising, and thin or fragile skin (older users, long-term steroid use), which the project's own cupping research lists. | vacuum-cupping.md §4 (contraindications: bleeding disorders or anticoagulants; fragile elderly skin; connective-tissue disorders). | Add 「容易瘀傷或流血不止、皮膚很薄（例如長者或長期用類固醇）」 to all four `position` texts. |
| F7 | st-trap-middle-floor, st-levator-seated, st-suboccipital-nod, st-scalenes-supine, mt-scalenes-breath, c-scalenes-relief, st-supraspinatus-across | fix | Near-literal translations. The steps follow the book's sentences in the same order, with the same numbers and the same small details (all or almost all key phrases of each passage appear in order). This is copying, not rewriting. | p.265 (4/4 key phrases), p.525–526 (4/4, including "eyes look to the side being stretched, 6 s, repeat 3–6 times"), p.479 (4/4), p.553–554 (5/5), p.554 (3/3), p.542 (2/2), p.574 (2/2). | Rewrite each from the goal, not from the book text: change the order of steps, merge or drop incidental details, keep only the safety-relevant numbers. |
| F8 | cp-trap-upper, cp-trap-middle (name 「定罐」); cp-trap-lower, cp-rhomboids (name 「走罐」) | fix | Trade jargon shown to a lay Helper. The ticket asks for plainer words for 走罐. | — | 「走罐」 → 「滑動拔罐」 (or 「推罐」); 「定罐」 → 「固定拔罐」. |
| F9 | tp-splenius-capitis-1 (landmark), c-splenius-capitis-press (helperMethod), several helperMethod / landmark texts, `attachments` fields | fix | Anatomy words with no plain description in texts the Helper reads: 胸鎖乳突肌 in the splenius texts (the Helper is not told what or where it is); 「約與第二頸椎同高」 (no lay person can find C2); 肌束 ×6; 棘突 / 橫突 / 韌帶 in `attachments`. | — | 胸鎖乳突肌 → add 「（頸側由耳後斜落胸骨頂那條粗肌肉）」 at first use; 「第二頸椎同高」 → 「約與耳垂同高」; 肌束 → 「一條較硬的肌肉帶」; 棘突 → 「脊骨中間突起的骨」, 橫突 → 「頸骨兩側」, 韌帶 → drop or 「筋膜」. |
| F10 | s-reach-overhead (name) | fix | 「晾衫」 is spoken form. It is the only colloquial item found in 488 visible strings. | — | 「晾衣服」. |
| N1 | pressureLevels (light, standard, deep) | note | No source. 1 kg appears in the book only as a jaw-muscle (TMD) examination criterion; 4 kg/cm² is the fibromyalgia tender-point force. Neither is a dose for neck trigger points. The "deep" description shows 「（估算值，書中沒有這個數字）」 to the Helper; that means nothing to a lay user. | p.484 (1 kg, TMD criteria); p.1230 (4 kg/cm², fibromyalgia palpation). 6 kg not found anywhere in the book. | Add `source` with those two pages and a short note that they are borrowed calibration forces. Move the "estimate" remark from the visible text into a source/notes field. |
| N2 | pressureLevels; c-trap-upper-pinch, mt-trap-upper-hold, SCM pinch items | note | Kitchen-scale calibration only works for flat pressing. It cannot teach pinch force. | — | For pinch items, lead with the Receiver's 0–10 number, not the kg level. |
| N3 | st-trap-upper-seated, st-trap-upper-helper, st-splenius-capitis-seated, st-splenius-cervicis-seated, st-posterior-cervical-flex; stretch hold times | note | Weak citations. The cited pages do not describe these stretches: st-trap-upper-seated cites the chapter intro, the exam pages and the PIR method; st-trap-upper-helper cites a vapocoolant-spray figure; the splenius and posterior-cervical stretches cite examination pages. The 「6 至 10 秒」 stretch hold comes from the PIR *contraction* time, not a stretch hold. The content itself is safe. | p.240, 254–255, 1880–1881, 1916–1917 (upper trapezius); p.435, 437 and p.441 (no splenius stretch in chapter); p.455 and p.461–463 (no posterior cervical stretch); p.1880 (PIR 10–25% effort, 6–10 s). | Mark these as "adapted" in the source, or cite the PIR pages only for the breathing/contract-relax part. |
| N4 | cp-trap-upper, cp-trap-middle, cp-trap-lower, cp-rhomboids | note | `source.page` is 「not found」 for all four. The numbers (5–10 min, max 15, once a week per spot) match the project research note, which is traceable. | vacuum-cupping.md §2–§4 (Trofa 2020 for >20 min blister risk). | Cite the research note sections instead of "not found". |
| N5 | cp-trap-middle | note | A 5 cm cup between the shoulder blade and the spine is a tight fit on a small adult; the rim will touch bone. | — | Suggest a 4 cm cup, or have the Receiver let the arms hang forward to widen the gap. |
| N6 | st-trap-middle-floor | note | This is a range-of-motion exercise, not a stretch. The book warns that stretching is not the right self-treatment for middle/lower trapezius. The steps are fine; the word 「伸展」 in the name can mislead. | p.263 (self-treatment for middle/lower trapezius is not stretch-based); p.265 (the exercise). | Rename to 「肩胛骨活動練習」 or similar. |
| N7 | cp-trap-middle, cp-trap-lower, cp-rhomboids (`rightAmount.wrong`) | note | These three lack 「刺痛放射到手臂」, and only cp-trap-upper lists 「頭暈」. Low relevance on the mid-back, but fainting is a known rare cupping event. All stretch, manual and check `wrong` fields have all three nerve signs. | vacuum-cupping.md (syncope as a rare adverse event). | Add 「頭暈、刺痛放射到手臂」 to the three lists for consistency. |
| N8 | Treatment plan order (app level) | note | If a plan does cupping first and then pressure on the same muscle, the Helper will press on fresh cupping marks. | — | App-level: do manual work before cupping on the same muscle, or skip pressure on cupped spots. |
| N9 | tp-splenius-cervicis-1, tp-scalenes-1 | note | Referral lists are partial. Splenius cervicis upper-portion referral (into the orbit / back of the head) is not listed. The scalene front-of-chest referral is not listed (there is no chest zone in the Complaint). This can cause a missed match, not harm. | p.434–435 (splenius cervicis); p.537–538 (scalenes, anterior chest pattern). | Add the zones if they exist later; otherwise leave. |
| N10 | st-trap-lower-doorway, st-rhomboids-doorway, st-supraspinatus-behind-back, st-scm-seated, c-supraspinatus-reach | note | Close paraphrase of short standard instructions (doorway stretch 4/4 key phrases; the others 1/1). Short common instructions are low risk, but the doorway pair repeats the book's full sequence. | p.991–992, p.573, p.292, p.566. | Light rewording of the doorway pair. |

## Copy search (fields checked against the PDF)

17 fields were checked (16 rows below; the doorway row covers two items). 16 of them were searched by script with 37 English key phrases (`copycheck.py`, whole-book search, whitespace normalised); tp-trap-upper-1 was compared side by side by reading.

| field | result | page |
|---|---|---|
| st-trap-middle-floor | 4/4 phrases in order — near-literal (F7) | 265 |
| st-levator-seated | 4/4 — near-literal (F7) | 525–526 |
| st-suboccipital-nod | 4/4 — near-literal (F7) | 479 |
| st-scalenes-supine | 5/5 — near-literal (F7) | 553–554 |
| mt-scalenes-breath | 3/3 — near-literal (F7) | 554 |
| c-scalenes-relief | 2/2 — near-literal (F7) | 542 |
| st-supraspinatus-across | 2/2 — near-literal (F7) | 574 |
| st-trap-lower-doorway / st-rhomboids-doorway | 4/4 — close paraphrase (N10) | 991–992 |
| st-supraspinatus-behind-back | 1/1 — close paraphrase (N10) | 573 |
| st-scm-seated | 1/1 — close paraphrase (N10) | 292 |
| c-supraspinatus-reach | 1/1 — close paraphrase (N10) | 566 |
| tp-trap-upper-1 landmark | rewritten, OK | 249, 257 |
| c-trap-upper-pinch | rewritten, OK | 257 |
| tp-splenius-cervicis-1 landmark | rewritten, OK | 437 |
| mt-trap-upper-hold | rewritten, OK | 1879 |
| c-scalenes-cramp | rewritten and adapted (book: up to 60 s; library: 10 s, safer), OK | 540 |

## Language check (script `langcheck.py`)

- 488 visible strings checked.
- Simplified characters: 0 (every CJK character encodes in Big5-HKSCS).
- Colloquial forms: only 衫 in 「晾衫」 (F10). None of 嘅/咗/唔/喺/冇/嗰/啲/係/佢/睇/嘢/攰 etc. in item text.
- Variant consistency: 裏 4 / 裡 0; 着 25 / 著 0; 麻痺 32 / 麻痹 0; 肩膊 43 / 肩膀 0 (肩膊 is normal HK written usage). Consistent.
- Nerve signs: every stretch, manual and check `rightAmount.wrong` contains 麻痺, 觸電感 and 刺痛放射到手臂. Only three cupping items miss 刺痛放射到手臂 (N7).
- Jargon: F8, F9. 上角 (×10) and 骨脊 (×16) are acceptable because each first use is paired with a plain body cue.

## Safety review — what was checked and found acceptable

- Front/side of neck: SCM items are pincer-only, light, with a dizziness stop (「感到頭暈即停」, 30–90 s). Scalene items are recognition-only plus breathing and gentle side-lying stretch. `check-library.mjs` enforces light-only and no cupping for m-scm and m-scalenes (passes). Remaining risk: F3 (app text) and B1 (splenius cue).
- Suboccipital: mt-suboccipital-rest uses only the weight of the head on the Helper's fingers (2–4/10, about 90 s); the nod stretch is slow, no bouncing. Acceptable (p.474–475, 479).
- Strong rotation/extension: no stretch uses forced rotation or extension; stretches say slow, 3–5/10, stop on the three nerve signs plus 頭暈 / 視力模糊. Only the two test movements lack a dizziness stop (F4).
- Cupping: never on the neck front/side, spine, clavicle or scapular spine; light suction; 5–10 min, max 15; once a week per spot; neck muscles are not cupped. Matches vacuum-cupping.md §2–§4, apart from F5 and F6.
- Times: manual 90 s is book-based (p.1878) but paired with too-strong pressure in five items (F1). 3–5 muscles per session is from p.1887 (correct).

## Verified as correct (item id + printed page)

Trigger points (landmark, referral, `at` zone, cited page):

- tp-trap-upper-1 — anterior vertical fibres; referral to posterolateral neck, mastoid, temple, behind the eye, jaw angle (p.249); supine pincer palpation (p.257).
- tp-trap-upper-2 — posterior horizontal fibres; posterior neck and occiput (p.250, 258).
- tp-trap-middle-1 — burning pain between the medial border and C7–T3 (p.251); flat palpation against the ribs (p.258).
- tp-trap-middle-2 — lateral part near the acromion; top of the shoulder (p.251, 253).
- tp-trap-lower-1 — where fibres cross the medial border / near the inferior angle (p.259); referral to high neck near mastoid, acromion, suprascapular area (p.253).
- tp-trap-lower-2 — near the attachment on the scapular spine (p.259); burning along the medial border (p.253).
- tp-levator-1, tp-levator-2 — angle of the neck under the trapezius front edge; superior angle very tender (p.517, 520–521); referral to neck angle, vertebral border, back of the shoulder (p.517).
- tp-splenius-capitis-1 — landmark text itself is correct (triangle behind SCM, about C2, p.436); vertex referral (p.433). The unsafe part is only the downstream hands-on cue (B1).
- tp-splenius-cervicis-1 — about 2 cm lateral at C7, above the neck angle; flexion increases tenderness; pressure toward the spine (p.437); referral to the neck angle (p.435).
- tp-semispinalis-capitis-1 — 1–2 cm from midline at the skull base, needs firm pressure; band to the temple and over the eye (p.452, 455–456).
- tp-semispinalis-cervicis-1 — C4–C5, 1–2 cm lateral; occipital referral (p.454, 456).
- tp-multifidus-1 — about 1 cm lateral to the spinous processes from C3–C4 down; suboccipital to upper vertebral border of the scapula (p.454, 457).
- tp-suboccipital-1 — occiput to temple, eye, forehead (p.471); most sensitive area, RCP minor 1 cm lateral (p.474–475).
- tp-scm-sternal-mid — cheek, maxilla, above the eye, orbit (p.280).
- tp-scm-sternal-upper — occipital ridge behind the ear, vertex (p.280–281).
- tp-scm-clavicular — forehead, ear / behind the ear (p.281); dizziness on stretch (p.281–282), covered by the `wrong` text.
- tp-scalenes-1 — medial scapular border / between the shoulder blades, arm, radial forearm, thumb and index finger (p.537–538); "do not press" is correct (p.543–547).
- tp-supraspinatus-1 — mid supraspinous fossa under the trapezius (p.568); mid-deltoid, arm, lateral epicondyle (p.564).
- tp-rhomboids-1 — vertebral border / between the shoulder blades, above the scapular spine; no arm referral (p.662); prone flat palpation (p.665–667).

Checks, stretches, manual:

- c-trap-upper-sidebend (p.254–255); c-trap-middle-press, tennis-ball self-check (p.266); c-trap-lower-press (p.258, 268).
- c-levator-turn — rotation toward the painful side most restricted (p.519); st-levator-seated stretch content (p.525–526; copying flagged separately, F7).
- c-posterior-cervical-flex — chin stops about 5 cm short of the sternum (p.455); posterior cervical TrPs do not cause arm symptoms (p.459), so the nerve-sign stop is a correct red flag.
- st-suboccipital-nod (p.479); mt-suboccipital-rest (p.474–475).
- SCM pincer lift, supine, head tilted (p.284–285); st-scm-seated rotation plus two-finger retraction (p.292).
- c-scalenes-cramp (p.540–541; library 10 s vs book up to 60 s — safer); c-scalenes-relief (p.541–542); st-scalenes-supine (p.553–554); mt-scalenes-breath, Lewit side-lying PIR (p.554).
- c-supraspinatus-reach — hand-behind-back / hip-pocket test (p.566); st-supraspinatus-behind-back, st-supraspinatus-across (p.573–574); cold pack after release (p.573).
- mt-rhomboids-hold — tennis ball / pressure 15–30 s (p.669); st-rhomboids-doorway — rhomboids rarely need stretching, pectoral doorway stretch instead (p.669, 991–992).
- Heat after trapezius release (p.266, 268–269); middle trapezius exercise (p.265).
- Pressure release method — 90 s below threshold or 30 s at tolerance (p.1878); discomfort but no pain, finger follows release (p.1879); stroke 8–10 cm/s, 3–5 muscles per session (p.1886–1887); PIR 10–25% effort for 6–10 s (p.1880–1881).

## Limits of this review

- Page numbers are the PDF footer numbers. They were not compared with a physical print copy.
- Cupping content was checked only against the project research note, not the primary papers.
- `bp3d` mesh ids were checked only by `check-library.mjs` (it confirms format and presence, not that the id is the right muscle).
- Situation `loads` lists were spot-checked (s-look-up, s-turn-head, s-reach-overhead and others), not fully audited against the book.

# Library format for the Session prototype (ticket 10)

Contract between the Library content (`library.json`) and the app (`index.html` + `app.js`).
Domain terms: `CONTEXT.md`. Decisions: tickets 06, 07, 08, 12 under `.scratch/phasy/issues/`.
Scope: one Complaint, "肩頸攰" (neck and shoulders tired / tight), so only neck, shoulder, upper-back
and head content. Ids and field names are English; every text shown to people is Hong Kong written
Traditional Chinese (書面語, never Cantonese colloquial forms such as 嘅 / 咗 / 唔 / 喺 / 冇 / 嗰 / 點樣).

## Top level

```json
{
  "version": "2026-09-24",
  "sources": { "travell3": "Donnelly et al., Travell, Simons & Simons' Myofascial Pain and Dysfunction: The Trigger Point Manual, 3rd ed. (2019)" },
  "pressureLevels": [ ... ],
  "zones": [ ... ],
  "situations": [ ... ],
  "muscles": [ ... ]
}
```

Every item that comes from a book carries `"source": { "ref": "<key in sources>", "page": "<printed page, or 'pdf 123' when no printed number>" }`.
Every `id` is unique across the whole file, lowercase, `a-z0-9-`, with a type prefix:
`z-` zone, `s-` situation, `m-` muscle (or muscle part), `tp-` trigger point, `c-` check,
`st-` stretch, `mt-` manual technique, `cp-` cupping placement.

## pressureLevels (exactly three: light, standard, deep)

```json
{ "id": "standard", "name": "標準", "force": "約 4 公斤", "howToLearn": "在廚房磅上用拇指按到 4 公斤，記住那種力度。" }
```

## zones — Body zones (ticket 08)

```json
{ "id": "z-neck-back-upper", "name": "頸後上段", "region": "neck", "sided": true }
```

- `sided: true` zones exist on the left and on the right; the app adds the side at runtime.
  `sided: false` zones sit on the midline (e.g. 頸後中線) and match either side.
- `region` groups zones in the picker: `head`, `neck`, `shoulder`, `upper-back`, `arm`.
- About 12–20 zones for this region, named so a lay person recognises them. Include the head zones
  that neck and shoulder muscles refer pain to (e.g. 太陽穴, 眼後, 後腦), because referral
  matching needs them.

## situations — Provoking situations (ticket 07)

```json
{
  "id": "s-phone-head-down", "name": "低頭看手機", "kind": "posture",
  "onTheSpot": true, "testMovement": true,
  "testHowTo": "坐直，慢慢低頭至下巴近胸口，停三秒，再回正。",
  "loads": ["m-trap-upper", "m-levator-scapulae"],
  "zones": ["z-neck-back-lower", "z-shoulder-top"]
}
```

- `kind`: `posture` or `movement`. `onTheSpot`: can be done in the room now.
- `testMovement: true` items have `testHowTo` and can score the Complaint 0–10.
- `loads`: muscles this situation loads or stretches (they join the candidate list).
- `zones`: Complaint zones this situation usually tests.
- About 12–18 situations for neck and shoulders, covering the ways people really describe it
  (screens, driving, sleeping, carrying bags, looking up, turning the head, shrugging, stress).

## muscles

```json
{
  "id": "m-trap-upper",
  "nameZh": "斜方肌上部", "nameEn": "descending (upper) trapezius",
  "bp3d": { "L": "FJ1521M", "R": "FJ1521" },
  "action": "一句話：做什麼動作。",
  "attachments": "一句話：起點與止點。",
  "depth": "surface",
  "cuppingSuits": true,
  "triggerPoints": [ ... ], "checks": [ ... ], "stretches": [ ... ], "manual": [ ... ], "cupping": [ ... ]
}
```

- `bp3d`: BodyParts3D element ids per side from `.scratch/phasy/data/bodyparts3d/manifest.json`
  (FMA ids for the meshes added from BodyParts3D 3.0). `null` when the model lacks the muscle.
- `depth`: `surface` or `deep`. `cuppingSuits: false` means Manual technique instead; then `cupping` is `[]`.
- Chinese names: NAER (樂詞網) academic terms; a common name may follow in brackets.

### triggerPoints

```json
{
  "id": "tp-trap-upper-1", "name": "上斜方肌 1 號點",
  "landmark": "肩頂最高處，頸與肩峰之間的中點，捏起肌肉時最硬的一條。",
  "at": "z-shoulder-top",
  "referral": ["z-neck-back-upper", "z-temple", "z-behind-ear"],
  "source": { "ref": "travell3", "page": "..." }
}
```

- `noPress` (added 2026-09-24, optional, default false): true for points that must only be located, never
  pressed inward (front and side of the neck: sternocleidomastoid, scalenes). The app then shows
  「只用手指輕輕認位，不要向內按」 instead of the Search circle line.
- `at` (added 2026-09-24): the Body zone the trigger point itself lies in, on the same side. Tiredness and
  tightness are often felt where the muscle is, not only where it refers, so `at` counts for the candidate list too.

- `landmark`: a hands-on description from bony landmarks the Helper can feel (ticket 08).
  The app shows it as a Search circle description: press slowly inside about one to two finger widths.
- `referral`: Body zone ids on the **same side** as the muscle; `sided: false` zones allowed.

### checks

```json
{
  "id": "c-trap-upper-pinch", "kind": "press", "target": "tp-trap-upper-1",
  "receiverPosition": "坐直，雙手放大腿上，肩膀放鬆。",
  "helperMethod": "站在受助者後面，用拇指與食指捏起肩頂的肌肉，慢慢加力。",
  "pressure": "standard",
  "alone": true,
  "aloneMethod": "用另一隻手的四指勾住肩頂，慢慢壓向下。",
  "source": { "ref": "travell3", "page": "..." }
}
```

- `kind`: `press`, `position` (hold a position), or `movement`.
- `target`: a trigger point id of this muscle, or the muscle id.
- `pressure`: one of the three `pressureLevels` ids. `alone: true` needs `aloneMethod`.

### stretches, manual, cupping — every step states its Right amount (ticket 07)

```json
"rightAmount": {
  "strength": "受助者感覺 4–6 / 10，拉緊但舒服。",
  "time": "每次 30 秒",
  "right": "肌肉被拉長、微酸。",
  "wrong": "手臂麻痺、觸電感、尖銳的痛。"
}
```

Stretch:
```json
{ "id": "st-trap-upper-seated", "targets": ["m-trap-upper"], "startPosition": "...", "steps": ["...", "..."],
  "helper": false, "rightAmount": { ... }, "reps": "每邊 3 次", "source": { ... } }
```

Manual technique:
```json
{ "id": "mt-trap-upper-hold", "kind": "持續按壓", "target": "tp-trap-upper-1", "steps": ["...", "..."],
  "rightAmount": { ... }, "source": { ... } }
```

Cupping placement (Vacuum cupping only; ticket 01 research):
```json
{ "id": "cp-trap-upper", "position": "...", "cupSize": "中號（口徑約 5 厘米）", "method": "static",
  "rightAmount": { ... }, "source": { "ref": "...", "page": "..." } }
```

`method`: `static` (定罐) or `sliding` (走罐).

Every stretch, manual technique and cupping placement also has `"name"` (added 2026-09-24): a short Chinese
title that tells two items of the same muscle apart, e.g. 「坐姿側頭伸展」「幫手按肩側頭伸展」「肩頂持續捏壓」.

## Fixed rules the app applies (not the LLM)

- **Candidate list:** muscle × side is a candidate when the side is one of the Complaint's sides and
  either (a) one of its trigger points' `referral` zones or its `at` zone, on that side (or `sided: false`),
  is one of the Complaint zones, or (b) the muscle is in `loads` of a confirmed situation.
- **Checks allowed:** the checks of candidate muscles; with no Helper only checks with `alone: true`.
  Once a muscle × side has given Familiar pain, its remaining checks leave the allowed set (it is found;
  the Checks go to other muscles).
- **Treatments allowed:** the stretches, manual techniques and cupping placements of the ticked muscles;
  with no Helper only stretches with `helper: false`. A muscle that gets a cupping placement in the plan gets
  no manual technique in the same Session (cupping comes first; pressing on fresh cup marks hurts).
- The LLM refers to all of these by id only; the app refuses any id that is not in the allowed set.

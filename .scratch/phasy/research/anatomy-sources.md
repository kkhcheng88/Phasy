# Anatomy Visual & Data Sources for Phasy — Research Notes

## 1. Summary

- Best free 3D base mesh: **BodyParts3D / Anatomography** (DBCLS) — relicensed to **CC BY 4.0** in 2025 (was CC BY-SA 2.1-JP). CC BY 4.0 = commercial use OK, no share-alike, just attribution. Best legal fit for a paid app. [License](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
- **Z-Anatomy** (built on BodyParts3D) is **CC BY-SA 4.0** — commercial use and modification allowed, but any bundled derivative must itself be offered under CC BY-SA 4.0 (see §2 share-alike note). Usable only if we accept that duty for the 3D-model asset itself.
- **OpenStax Anatomy & Physiology 2e** (CC BY 4.0) is the strongest free structured/text muscle data source (origin/insertion/action tables), safe for commercial use with attribution.
- **Wikidata** (CC0) has machine-readable muscle-origin/insertion/action properties but partial coverage — good as a seed/cross-reference, not a sole source.
- Commercial SDKs (BioDigital, Zygote, Complete Anatomy, Visible Body, Primal Pictures) all require a paid, contact-sales license for embedding in our own app; none confirmed as self-serve/flat-fee (unverified pricing in all cases).
- No fully free layered muscle-by-muscle 3D model exists with a no-conditions commercial license except BodyParts3D-derived meshes under CC BY 4.0.

## 2. Comparison Table

| Source | What it gives | License (name + URL) | Commercial use | Share-alike? |
|---|---|---|---|---|
| BodyParts3D / Anatomography (DBCLS) | ~3,210 separate anatomical meshes (.obj), incl. individual muscles; layer selection via web tool | CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/ (per https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) | Yes | No |
| Z-Anatomy | Unity/Blender project, muscles as separate labeled objects, built from BodyParts3D + Wikipedia text | CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/ | Yes | Yes |
| NIH 3D (3d.nih.gov) | Crowd-uploaded 3D print files; some anatomy, license varies per file | Per-model; site states "many ... CC-BY, others may have more restrictive terms" — https://3d.nih.gov/terms | Depends on model | Depends on model |
| OpenAnatomy.org (Open Anatomy Project) | Segmented medical-imaging atlases (brain, knee, abdomen, head/neck, inner ear); 3D Slicer viewer format | Atlas pages state "3D Slicer License section B" (not a CC license) — https://www.openanatomy.org/atlas-pages/slicer-license.html | Unverified — Slicer license text (fetched fragment) allows commercial use/mod of the *software*; per-atlas content terms not separately confirmed | Unverified |
| Wikimedia Commons — Gray's Anatomy plates | 1918 edition anatomical plates (2D illustrations only, not separable 3D meshes) | Public Domain (US, life+100) — https://commons.wikimedia.org/wiki/Gray's_Anatomy_plates ; file metadata CC0 — https://creativecommons.org/publicdomain/zero/1.0/ | Yes | No |
| Zygote (commercial) | High-end 3D anatomy model library + SDK, licensed per component/collection | Proprietary — "Real-Time Software Model License" — https://go.zygote.com/sdk-1 | Yes, paid license required | N/A (proprietary) |
| BioDigital Human | JS Viewer API + Content API, thousands of anatomy objects, embeddable | Proprietary — https://pricing.biodigital.com/business.html | Yes, paid tiers (Startup/Premium/Enterprise, quote-based) | N/A |
| Complete Anatomy (3D4Medical/Elsevier) | 17,000+ structures, muscle simulation, patient-education sharing | Proprietary, Student/Educator/Professional consumer licenses — https://store.3d4medical.com/complete-anatomy/license/professional | Consumer licenses only; no confirmed embed/API license found | N/A |
| Visible Body | Muscle Premium and other apps; LMS-oriented API scopes | Proprietary — https://www.visiblebody.com/legal/visible-body-user-agreement | Consumer/institutional; no public embed SDK confirmed | N/A |
| Primal Pictures / Anatomy.tv (Elsevier) | Scan-derived 3D anatomy content, institutional platform | Proprietary, institutional licenses — https://primalpictures.com/faqs/ | Institutional only; no confirmed embeddable SDK | N/A |
| OpenStax Anatomy & Physiology 2e | Muscle tables: origin/insertion/action/innervation text | CC BY 4.0 — https://openstax.org/books/anatomy-and-physiology-2e/pages/preface | Yes | No |
| Wikipedia infoboxes / Wikidata | Muscle infobox fields (origin, insertion, action, nerve) + Wikidata properties P3490 (muscle origin), P3491 (muscle insertion) | Wikipedia text: CC BY-SA 4.0 — https://en.wikipedia.org/wiki/Wikipedia:Copyrights ; Wikidata structured data: CC0 — https://www.wikidata.org/wiki/Wikidata:Licensing | Yes | Wikipedia text yes; Wikidata data no (CC0) |
| FMA (Foundational Model of Anatomy) | Ontology, ~75,000 anatomy classes incl. muscles, part-of/attachment relations | "CUSTOM" license per OBO Foundry listing, linked to http://sig.biostr.washington.edu/projects/fm/FMA_Release (page unreachable at fetch time — unverified terms) | Unverified | Unverified |
| Terminologia Anatomica (TA2 / FIPAT) | Official Latin+English anatomical nomenclature incl. muscle names | CC BY-ND 4.0 — https://fipat.library.dal.ca/ta2/ (per search summary; verify on-page) | Yes, but **No-Derivatives** — cannot alter the wording/structure of the terminology itself | No (ND, not SA) |
| Uberon | Cross-species anatomy ontology, used for interoperability/IDs | CC BY 3.0 — https://obofoundry.org/ontology/uberon.html | Yes | No |
| 國家教育研究院 樂詞網 (NAER Term Bank) | Traditional Chinese bilingual anatomy terms (incl. 人體解剖學 category) | Not confirmed — copyright statement page exists but fetch failed; terms.naer.edu.tw/detail/3258407/ is titled "copyright clearance / 著作權聲明" — **license text unverified** | Unverified | Unverified |
| 香港臨床醫療術語表 HKCTT (eHealth HKSARG) | Hong Kong standardized clinical terminology, incl. anatomical/procedure terms | Governed by a specific licence agreement (ELSA/HKCTT), not a public CC license — https://www.ehealth.gov.hk/filemanager/content/pdf/en/hcp/elsa-hkctt-licence.pdf | Unverified — appears to require registration/agreement, likely restricted to healthcare provider use | Unverified |

## 3. Detail per Source

### 3.1 BodyParts3D / Anatomography — DBCLS
- Owner: Database Center for Life Science (DBCLS), Japan (non-profit, national bioscience DB body).
- Coverage: ~3,210 separate `.obj` meshes covering full body anatomy including individually separable muscles, bones, organs; Anatomography web tool supports selecting/hiding structures (layer-like browsing). Source: https://lifesciencedb.jp/bp3d/
- Formats: OBJ (also historically VRML/Collada via NCBI-derived mirrors).
- License: CC BY 4.0 as of the current license page (last updated 2025-02-27); earlier releases (pre-2025) were CC BY-SA 2.1 Japan. Required attribution string: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International." https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Commercial use: Yes (CC BY 4.0 has no NC clause).
- Modification: Yes, explicitly allowed ("freely create and distribute database and other derivative works").
- Share-alike / copyleft duties: None under the current CC BY 4.0 release. (Caution: any mesh files obtained from an older CC BY-SA 2.1-JP snapshot/mirror would still carry that older license's share-alike duty for that specific file — check the license attached to whichever release/mirror is actually downloaded.)
- Maintenance status: Actively hosted, license page shows a 2025 update — unverified whether the underlying mesh data itself has been updated recently, only the license terms.

### 3.2 Z-Anatomy
- Owner/maintainer: Community project (Lluís Vinent Juanico — Unity app; Gauthier Kervyn / Marcin Zielinski — Blender template), hosted under the `Z-Anatomy` GitHub org. https://github.com/Z-Anatomy
- Coverage: Human (and veterinary) models derived from BodyParts3D, muscles as separate labeled objects; supports layer-by-layer viewing in the Unity/Blender app. https://simtk.org/projects/z-anatomy
- Formats: Unity project / Blender (.blend) source; app distributed via itch.io.
- License: CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/
- Commercial use: Yes.
- Modification: Yes.
- Share-alike duty for an app that bundles this model: Under CC's own guidance, ShareAlike is triggered only when the SA-licensed work is **adapted** (modified/remixed) into a new work — not merely included unmodified as a separate asset alongside unrelated app code. Per the Creative Commons wiki: "The ShareAlike condition applies only for works considered adaptations under copyright law, not simply in collections with other works (also referred to as mere aggregations)... Simply including an SA work unmodified alongside unrelated materials does not produce an adaptation." https://wiki.creativecommons.org/wiki/ShareAlike_interpretation — **Practical read for Phasy**: if we retexture/re-rig/recolor/re-segment the Z-Anatomy meshes (likely, to fit our UI), that IS an adaptation, and the resulting 3D-model asset must be released under CC BY-SA 4.0 (i.e., publicly redistributable/re-usable by competitors) — it does **not** legally force our app's own source code or unrelated assets (UI, backend, other content) to be open-sourced, only the adapted anatomical model itself. This is our own reading of the cited CC wiki text, not a CC-published FAQ answer specific to "bundling a 3D model in a mobile app" — treat as reasoned interpretation, not a citation to a directly-on-point official example.
- Maintenance status: Active GitHub org with recent repos (Models-of-human-anatomy, Z-Anatomy-testing).

### 3.3 NIH 3D (3d.nih.gov, formerly NIH 3D Print Exchange)
- Owner: National Institutes of Health (US government).
- Coverage: Crowd-uploaded biomedical 3D print files; anatomy coverage is uneven (not a structured full-muscle layer set) and each entry carries its own uploader-chosen license.
- License: Per-model, not site-wide. Site states: "many entries ... fall under public domain or Creative Commons licenses (e.g., CC-BY), others may have more restrictive terms." https://3d.nih.gov/terms
- Commercial use: Depends entirely on the specific model's chosen license — must check each entry individually before use.
- Maintenance status: Active NIH-run platform.
- Verdict: Not a reliable primary muscle-atlas source for Phasy; useful only for specific spot-checked, individually-verified models.

### 3.4 OpenAnatomy.org / Open Anatomy Project
- Owner: Brigham and Women's Hospital / Surgical Planning Laboratory (SPL), Boston, with Slicer community.
- Coverage: Segmented medical-imaging-derived atlases — brain, knee, abdomen, head & neck, inner ear. No confirmed whole-body muscular-system atlas. https://www.openanatomy.org/atlas-pages/
- Formats: 3D Slicer scene files, viewable in the Slicer / Open Anatomy Browser.
- License: Atlas pages cite "3D Slicer License section B" (https://www.openanatomy.org/atlas-pages/slicer-license.html), which is a BSD-style software license (permissive, allows commercial use/redistribution/modification per its text), **not a Creative Commons content license**. Whether this license is meant to cover the anatomical *content* (segmentations/labels) as well as the *software*, or whether content has separate terms, is **unverified** — the fetched page returned the software license text, not a content-specific clause.
- Commercial use / modification: Unverified for content specifically (software terms alone appear permissive).
- Maintenance status: FAQ describes project as used in teaching (Harvard Medical School etc.) but describes itself as "early stage" in cited text — currency of that statement is unverified (page not dated in the fetched excerpt).
- Verdict: Not muscle-focused enough, and licensing ambiguous — treat as low priority pending direct confirmation from info@openanatomy.org.

### 3.5 Wikimedia Commons — Gray's Anatomy plates
- Owner: Wikimedia Foundation (hosting); original work by Henry Gray, 1918 20th edition (public domain).
- Coverage: 2D historical illustrations only — no separable 3D muscle meshes, no layering interactivity. Useful only as static reference images, not as app UI asset.
- License: Public domain in US (published pre-1928 / life+100 expired) — https://commons.wikimedia.org/wiki/Gray's_Anatomy_plates ; per-file tags "PD-old-100-expired"/"CC-PD-Mark"; Commons' own structured metadata layer is CC0 — https://creativecommons.org/publicdomain/zero/1.0/
- Commercial use: Yes, no restriction (public domain).
- Verdict: Good for reference/inspiration only, not for a modern layered-3D product.

### 3.6 Commercial SDKs/APIs

**BioDigital Human** — https://developer.biodigital.com/ , https://pricing.biodigital.com/business.html
- Offers JS Viewer API, Content API (REST), iOS/Android SDKs; explicitly supports embedding 3D models in third-party apps/websites.
- Pricing: Three tiers — Startup, Premium, Enterprise — all quote/contact-based; Startup tier shown with metrics (5,000 page views, 20 published models, 3 creators) but no public dollar figure. Unverified: whether Startup tier permits a paid consumer app or only non-commercial/low-traffic use.

**Zygote** — https://go.zygote.com/sdk-1 , https://www.zygote.com/about
- Sells "Real-Time Software Model Licenses" for embedding content in distributed software, with royalties/subscription fees; licensing is per-component or per-collection.
- No public price list found (unverified). ZygoteBody web viewer itself is free to use online but that is a hosted viewer, not a licensable embeddable SDK.

**Complete Anatomy (3D4Medical / Elsevier)** — https://store.3d4medical.com/complete-anatomy/license/professional
- Public tiers found are consumer/institutional: Student, Educator, Professional. No public API/SDK/embed license page found — unverified whether Elsevier licenses this content for third-party app embedding at all.

**Visible Body** — https://www.visiblebody.com/legal/visible-body-user-agreement
- User agreement explicitly restricts reuse: "cannot be used to develop any like software or other technology having the same primary function" (per search-sourced excerpt) — suggests they do **not** want their content embedded in a competing anatomy app. Treat as effectively unavailable for Phasy pending direct confirmation.

**Primal Pictures / Anatomy.tv (Elsevier)** — https://primalpictures.com/faqs/
- Institutional/library licensing model only (multi-user institutional licenses). No confirmed embeddable API/SDK for third-party commercial apps found.

**Conclusion for commercial SDKs**: none of the five confirm a self-serve, flat, publicly-priced license suitable for a small/early-stage paid consumer app; all require direct sales contact. BioDigital is the most explicitly "embed in your app" oriented of the five and should be the first one Phasy actually contacts for a quote.

### 3.7 Structured muscle data sources

**Wikipedia infoboxes + Wikidata**
- Wikipedia muscle articles commonly carry an `{{Infobox muscle}}` with Origin, Insertion, Action, Nerve (innervation), Blood, Antagonist fields — text license CC BY-SA 4.0 (https://en.wikipedia.org/wiki/Wikipedia:Copyrights).
- Wikidata carries structured properties: P3490 "muscle origin" (https://www.wikidata.org/wiki/Property:P3490), P3491 "muscle insertion" (https://www.wikidata.org/wiki/Property:P3491), plus muscle action/antagonist properties referenced by the WikiProject Anatomy ontology draft (https://www.wikidata.org/wiki/Wikidata:WikiProject_Anatomy/Ontology_of_Anatomy/draft). Wikidata's structured data is CC0 (https://www.wikidata.org/wiki/Wikidata:Licensing) — no attribution legally required, though best practice.
- Coverage: unverified exact percentage of the ~600 skeletal muscles with complete origin/insertion/action/innervation Wikidata triples; known to be partial (community-maintained, uneven).
- Machine-readability: Wikidata is highly machine-readable (SPARQL endpoint, REST API); Wikipedia infoboxes require template parsing (medium machine-readability, less structured than Wikidata).

**OpenStax Anatomy & Physiology 2e**
- Publisher: OpenStax (Rice University).
- License: CC BY 4.0. https://openstax.org/books/anatomy-and-physiology-2e/pages/preface
- Coverage: Chapter 11 "The Muscular System" contains standard origin/insertion/action tables per muscle group organized by region; good human-readable prose/table source but not natively a machine-readable dataset (would need to be scraped/transcribed from HTML/PDF — permitted since CC BY allows this).
- Commercial use: Yes, with attribution to OpenStax and contributors.

**FMA (Foundational Model of Anatomy)**
- Maintainer: Structural Informatics Group, University of Washington. http://si.washington.edu/projects/fma/
- Coverage: ~75,000 classes, 120,000+ terms, 2.1M+ relationship instances including muscle-to-bone attachment/part-of relations (per OBO Foundry / Wikipedia summary — unverified against primary source directly).
- License: OBO Foundry lists it as "CUSTOM," linking to http://sig.biostr.washington.edu/projects/fm/FMA_Release for the actual terms — **that page could not be fetched during this research (connection error), so the exact commercial-use/redistribution terms are unverified.** Do not assume permissive use; confirm directly before relying on FMA data in a commercial app.
- Machine-readability: High — available in OWL/OBO format via OBO Foundry (https://obofoundry.org/ontology/fma.html) and BioPortal.

**Terminologia Anatomica (TA2 / FIPAT)**
- Maintainer: Federative International Programme for Anatomical Terminology (FIPAT).
- License: CC BY-ND 4.0 per search-result summary of https://fipat.library.dal.ca/ta2/ — **No-Derivatives** clause means the official terminology document/wording cannot be altered/remixed, only reproduced as-is or cited; this is stricter than CC BY. This should be independently re-confirmed on-page before use (not directly fetched in this research pass — unverified against primary page text).
- Coverage: Official Latin + English names for all standard anatomical structures including every skeletal muscle — this is the canonical naming authority, useful as a terminology cross-reference even if we don't redistribute the document itself.
- Machine-readability: TA2Viewer (https://ta2viewer.openanatomy.org/) provides a browsable web app; a bulk machine-readable export's licensing is unverified.

**Uberon**
- Coverage: Cross-species anatomy ontology; useful for stable IDs/interoperability rather than human-specific origin/insertion detail.
- License: CC BY 3.0. https://obofoundry.org/ontology/uberon.html
- Machine-readability: High (OWL/OBO, cross-referenced with FMA terms).

### 3.8 Traditional Chinese muscle terminology

**國家教育研究院 樂詞網 (NAER LeciTerm / Term Bank)**
- Includes an academic-terminology category for 人體解剖學 (Human Anatomy) among ~1.93M academic-term entries. https://terms.naer.edu.tw/
- License: A page titled "copyright clearance / 著作權聲明" exists at https://terms.naer.edu.tw/detail/3258407/ but could not be fetched successfully in this research session (tool error) — **license terms unverified.** Government/academic term banks in Taiwan are often free-to-view but may restrict bulk redistribution; do not assume commercial reuse rights without directly reading that page.

**香港臨床醫療術語表 HKCTT (Hong Kong eHealth / HKSARG)**
- Official Hong Kong standardized clinical terminology (part of the eHealth system), includes anatomical/procedure terms usable for bilingual (Chinese/English) clinical naming. https://www.ehealth.gov.hk/tc/healthcare-provider-and-professional/resources/information-standards/hkctt.html
- Licensing: Governed by a specific "Licence for Use of ELSA and HKCTT eHR Programme" document (https://www.ehealth.gov.hk/filemanager/content/pdf/en/hcp/elsa-hkctt-licence.pdf) rather than a public CC license — appears oriented at registered healthcare providers/software vendors integrating with eHealth, not general app developers. **Terms for a non-clinical consumer wellness app are unverified** — would need direct inquiry to eHealth HKSARG.
- No independent Hong Kong bilingual-muscle-terminology source (distinct from HKCTT) was found in this pass.

## 4. Open Questions

1. FMA's actual license text (http://sig.biostr.washington.edu/projects/fm/FMA_Release) — page did not load; must be re-fetched or requested directly before any FMA data is used.
2. Open Anatomy Project: does "3D Slicer License section B" actually cover atlas *content* (segmentations), or only the Slicer *software*? Needs a direct email to info@openanatomy.org.
3. TA2's CC BY-ND 4.0 status needs on-page re-verification (not directly fetched); also confirm whether a machine-readable bulk export exists and what license covers *that* export specifically (documents and data exports sometimes differ).
4. NAER 樂詞網 copyright/reuse terms — page fetch failed; unresolved whether bulk reuse of the anatomy term category is permitted.
5. HKCTT terms for a non-clinical, non-eHealth-integrated consumer app are unresolved — likely requires direct contact with eHealth HKSARG.
6. All five commercial SDK vendors (BioDigital, Zygote, Complete Anatomy, Visible Body, Primal Pictures) require direct sales contact for actual pricing and embed-rights confirmation; none of this is verifiable from public pages alone.
7. Whether any older (pre-2025) CC BY-SA-licensed BodyParts3D mesh snapshots are still circulating on mirrors (e.g., the Kevin-Mattheus-Moerman GitHub clone) under the old share-alike terms, which would matter if Phasy accidentally pulls from a stale mirror instead of the current CC BY 4.0 source.

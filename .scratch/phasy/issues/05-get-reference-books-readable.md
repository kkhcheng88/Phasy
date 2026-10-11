# Get the reference books into a readable form

Type: task
Label: wayfinder:task
Status: resolved
Blocked by:

## Question

The Library needs the reference books as a source for trigger points, Referral zones and palpation. The owner offered to buy them. This is a HITL task for the owner.

Checklist:

1. Buy, preferably as DRM-free PDF or EPUB (Kindle and VitalSource readers are locked and cannot be read by the agent; photos of pages are the fallback):
   - Travell, Simons & Donnelly's Myofascial Pain and Dysfunction: The Trigger Point Manual, 4th ed., ISBN 9781975223113
   - Davies & Davies, The Trigger Point Therapy Workbook, 3rd ed. (2013)
   - Biel, Trail Guide to the Body, 6th ed. (2019)
   - Optional: Kendall's Muscles: Testing and Function; Neumann, Kinesiology of the Musculoskeletal System; Nelson & Kokkonen, Stretching Anatomy, 3rd ed. (2020)
2. Put the files in a local folder outside this repo (the books are for reference only; the app redraws and rewrites everything).
3. Record the folder path in the answer.

Resolved when at least the first three books are readable.

## Answer

Done 2026-09-24. Folder: `C:\Users\Kaho\Downloads\Physio` (outside the repo).

| Book | Edition found | Form | Readable how |
|---|---|---|---|
| Travell & Simons, Myofascial Pain and Dysfunction | 3rd ed. (2019), not the 4th | PDF with text layer, 2,169 pages, 95 bookmarks | Text search (PyMuPDF / pdftotext) |
| Davies, The Trigger Point Therapy Workbook | Older edition (Clair Davies sole author, index at p. 257 — likely 1st, 2001), not the 3rd | Image-only scan, 276 pages | Page images only |
| Biel, Trail Guide to the Body | 6th ed. per file name (copyright page not checked) | Image-only scan, 460 pages, no bookmarks | Page images only |

Facts for later tickets:
- The 3rd-edition Travell is fine as the authority; trigger point locations change little between editions.
- The two scanned books cannot be searched. Before Library content production, OCR them or build a page index (muscle → page). Tesseract is not installed; PyMuPDF is.
- The Read tool cannot render PDF pages here (pdftoppm missing). Render with PyMuPDF (`page.get_pixmap(dpi=60).save(...)`) into the scratchpad, then Read the PNG.
- The books are reference only. Nothing from them is copied into the repo; content is rewritten and redrawn.

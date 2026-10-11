# Web app storage and backup facts (iPhone Safari / Android Chrome)

## 1. Summary

Plain browser tabs can lose data: Safari deletes script-writable storage after 7 days of no visits, and both browsers evict on disk pressure unless "persistent storage" is granted. **Home Screen / installed web apps are exempt from Safari's 7-day timer** and get the same larger quota as Safari itself; Chrome grants persistence more readily to installed PWAs too. Quotas on modern phones are generous (tens of GB), so size is not the risk — eviction and accidental deletion are.

**Recommended v1 approach:** ship as an installable PWA (prompt "Add to Home Screen"), store records in **IndexedDB** (photos as Blobs), call **`navigator.storage.persist()`** on first run, and add a **"Export backup" button that downloads a JSON file** (plus photos, or base64-embedded) and, where supported, offers **Web Share API** to send that file to iCloud Drive / Files / WhatsApp. No server needed for v1.

## 2. iPhone Safari rules

- **7-day eviction of script-writable storage**: Safari's Intelligent Tracking Prevention deletes all of an origin's IndexedDB, LocalStorage, SessionStorage, Media Keys, Service Worker registrations and Cache after 7 days of Safari use with no user interaction on that site. Shipped in **iOS/iPadOS 13.4 and Safari 13.1 (macOS)**, announced March 2020. Source: WebKit blog, "Full Third-Party Cookie Blocking and More" (https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/).
- **Home Screen web apps are exempt from the 7-day timer**: a standalone web app added to the Home Screen "has its own counter of days of use" tied to actual use of the app, not Safari's browsing counter, so the same WebKit post says developers should not expect data deletion for Home Screen web apps. Source: same WebKit post above.
- **Quota (Safari 17 / iOS 17 / iPadOS 17 / macOS Sonoma, current policy)**: origin quota up to ~60% of total disk for browser apps (Safari itself and Home Screen web apps use this browser-app quota); other embedding apps get ~15%. Overall quota (all origins combined) is up to 80% of disk for the browser, 20% for other apps. Eviction under pressure uses least-recently-used order and removes a whole origin's data at once. Source: WebKit blog, "Updates to Storage Policy" (https://webkit.org/blog/14403/updates-to-storage-policy/), applies from Safari 17.0 / iOS 17 / iPadOS 17 / macOS Sonoma.
- **Home Screen web apps get the same quota as the browser app**, not the smaller "other apps" allowance — confirmed in the same "Updates to Storage Policy" post.
- **`navigator.storage.persist()` is supported**: it requests that the origin be moved to "persistent" mode, which is skipped by the eviction/LRU mechanism and (per the WebKit posts above) is one of the exemption paths independent of Home Screen status. Full support for the Storage API (`persist()`/`persisted()`, including remembering the granted mode across sessions) shipped in **Safari 17 / iOS 17 / iPadOS 17 / macOS Sonoma**; earlier versions had partial/buggy support. Source: MDN, `StorageManager.persist()` (https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) and WebKit "Updates to Storage Policy" above. WebKit does not show a permission prompt for this call; it is granted or denied by heuristic (unverified exactly which heuristic Safari uses — WebKit's post does not spell this out the way Chrome's does).
- **Origin Private File System (OPFS)** shipped in Safari starting **macOS 12.2+ / iOS 15.2+**. Source: web.dev, "The origin private file system" (https://web.dev/articles/origin-private-file-system) and WebKit blog "The File System Access API with Origin Private File System" (https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/). OPFS shares the same per-origin quota as other storage and is unavailable in Private Browsing windows.

## 3. Android Chrome rules

- **Quota**: an origin can use up to **60% of total disk space** in both "best-effort" and "persistent" storage modes (e.g. 1 TiB disk → up to 600 GiB for one origin); eviction under pressure uses LRU across origins. Source: MDN, "Storage quotas and eviction criteria" (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- **No fixed 7-day timer** like Safari's; instead Chrome tracks a per-site "Site Engagement Score" (0–100) that decays with inactivity and is cleared when browsing history is cleared. Low-engagement sites are more likely to be evicted under storage pressure and can lose other permissions (e.g. notifications). Source: Chromium design doc, "Site Engagement" (https://www.chromium.org/developers/design-documents/site-engagement/). Exact eviction trigger tied to engagement score is not spelled out with a numeric threshold in that doc — mark as **unverified** beyond "low engagement increases eviction risk."
- **`navigator.storage.persist()` behaviour**: Chrome does **not** show a user prompt; it silently grants or denies based on heuristics including site engagement level, whether the site "has been installed or bookmarked," and whether it has notification permission. Source: web.dev, "Persistent storage" (https://web.dev/articles/persistent-storage).
- **Effect of installing as a PWA**: installation status is explicitly one of the heuristics Chrome uses to decide persistence, so an installed PWA is materially more likely to be granted persistent (eviction-exempt) storage than a same site opened only in a browser tab. Source: same web.dev article above.

## 4. Storage API choice

| API | Fits Phasy's structured records + photos? | Quota facts |
|---|---|---|
| **IndexedDB** | Yes — recommended. Structured records (complaints, check results, muscle-status history) as objects; photos stored as `Blob`/`File` values in the same records. | Shares the general per-origin quota above (tens of GB typical on modern phones); no separate hard cap on object count/size beyond that quota. Source: MDN IndexedDB docs (https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and MDN storage-quotas page above. |
| **Origin Private File System (OPFS)** | Overkill for v1 — better suited to large binary/file-tree workloads (e.g. SQLite-in-WASM). Supported on iOS Safari 15.2+ and modern Chrome, but the API shape (worker-oriented sync handles) is more complex than IndexedDB for simple record+photo storage. | Same per-origin quota as other storage. Source: web.dev OPFS article above. |
| **localStorage** | No — string-only, synchronous, and capped at **5 MiB** (10 MiB combined with sessionStorage) per origin regardless of platform, far too small for months of records plus photos. | Source: MDN storage-quotas page above. |

**Choice: IndexedDB**, using a small wrapper library or the native API directly, for both records and photo Blobs.

## 5. Export/backup options

- **Download a JSON file** (`Blob` + `<a download>` or the File System Access API's `showSaveFilePicker`): universally works via the classic `<a download>` blob-URL trick on both iPhone Safari and Android Chrome (triggers a normal browser download/share). The newer `showSaveFilePicker` picker is **not** available on iOS Safari or Android Chrome — mobile browsers only ship the Origin Private File System part of the File System Access API, not the local-disk file pickers. Source: caniuse, "File System Access API" (https://caniuse.com/native-filesystem-api) and Chrome for Developers (https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
- **Web Share API (`navigator.share`, with `files` + `navigator.canShare`)**: lets the export button hand the JSON/photo file straight to the OS share sheet (Files, iCloud Drive, WhatsApp, AirDrop, etc.). Supported in Safari (including iOS Safari) and in Chrome for Android; desktop Chrome only supports it on Windows/ChromeOS. Source: MDN, "Web Share API" (https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) and web.dev, "Integrate with the OS sharing UI with the Web Share API" (https://web.dev/articles/web-share).

| Platform | Download JSON (`<a download>`) | File System Access save-picker | Web Share API (files) |
|---|---|---|---|
| iPhone Safari (iOS) | Supported | Not supported (no `showSaveFilePicker`) | Supported |
| Android Chrome | Supported | Not supported on Android (`showOpenFilePicker`/`showSaveFilePicker` not exposed) | Supported |

Citations: caniuse File System Access API (https://caniuse.com/native-filesystem-api); MDN Web Share API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).

## 6. Later cloud backup options (if wanted, low effort)

- **Firebase (Firestore/Realtime Database + Auth)** — generous free tier, official JS SDK, easiest path if already Google-friendly.
- **Supabase** — Postgres-based, free tier, open-source alternative to Firebase with a simple REST/JS client.
- **PocketBase** — single self-hosted binary with a built-in DB and JS SDK, lowest ops effort if self-hosting is acceptable.

## 7. Open questions

- Exact numeric/time threshold Chrome uses to evict a *low-engagement* site's storage (as opposed to the qualitative "increases risk" statement) — unverified, not found in Chromium's public design doc.
- Whether iOS Safari's `navigator.storage.persist()` heuristic is documented anywhere as precisely as Chrome's (site engagement / installed / notifications) — WebKit's posts describe the mechanism but not a published heuristic list; treat as unverified.
- Real-world behavior when a user has *not* added Phasy to the Home Screen (plain bookmarked tab) for months — Safari's 7-day clock would apply; needs an in-app prompt strategy, not just a technical note.

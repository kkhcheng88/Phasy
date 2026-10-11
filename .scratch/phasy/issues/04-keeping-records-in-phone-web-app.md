# Can a phone web app keep Members' records safely for months?

Type: research
Label: wayfinder:research
Status: resolved
Blocked by:

## Question

Can a web app in the phone browser keep Members' records safely for months on iPhone and Android? Needed facts: browser storage eviction rules (e.g. Safari deleting site data after days without use, and whether apps added to the home screen are exempt); persistent-storage requests; and simple export or backup options so records are not lost.

Findings go to `research/web-app-storage.md`.

## Answer

Yes, if the app is installed to the home screen. Plain Safari tabs lose site data after 7 days without a visit (iOS 13.4+), but home-screen web apps have their own usage counter and are exempt; iOS 17+ also supports `navigator.storage.persist()`. Chrome has no fixed timer and grants persistence more readily to installed apps.

v1 approach: installable web app, records in IndexedDB (photos as Blobs), request persistent storage on first run, and an "Export backup" button that saves a JSON file and offers the phone's share sheet (iCloud Drive, Files, WhatsApp). No server needed.

Detail and sources: [research/web-app-storage.md](../research/web-app-storage.md).

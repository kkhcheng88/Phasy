# Can a phone-browser camera place a marker on a person's back within 2 cm?

Type: research
Label: wayfinder:research
Status: resolved
Blocked by:

## Question

Can a phone-browser camera find enough body landmarks on a person seen from behind to place a trigger point marker within about 2 cm? Needed facts: which pose or body-segmentation models run in iPhone Safari and Android Chrome (e.g. MediaPipe); which landmarks they give for a back view; their typical accuracy; and known ways to place a point relative to landmarks (e.g. a point between the neck and the shoulder tip).

Findings go to `research/camera-body-tracking.md`.

## Answer

Pose models alone: uncertain, leaning no. The browser pose models (MediaPipe Pose Landmarker, BlazePose, MoveNet) give only shoulders and hips on the trunk — nothing between the shoulder blades — so a back trigger point must be guessed from body proportions, and errors add up. No published accuracy exists for back views.

With markers: likely yes. If small stickers or printed markers (ArUco/AprilTag) are placed on the skin, the task becomes recognising a known pattern; a phone AR study reports about 5 mm on a live body. Natural fit: the Helper finds two or three bony landmarks by touch (e.g. base of the neck, shoulder tip, lower corner of the shoulder blade), puts a sticker on each, and the app places the trigger point relative to the stickers.

Detail and sources: [research/camera-body-tracking.md](../research/camera-body-tracking.md).

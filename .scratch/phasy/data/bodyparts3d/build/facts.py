"""Print, for each muscle the facts file asks about, the matching parts in manifest.json (after the filter)."""
import json, os, re
from tables import DATA

parts = [p for p in json.load(open(os.path.join(DATA, "manifest.json"), encoding="utf-8")) if p["kind"] == "muscle"]
ASK = ["trapezius", "levator scapulae", "rhomboid", "supraspinatus", "infraspinatus", "teres", "sternocleidomastoid",
       "scalen", "splenius", "rectus capitis|obliquus capitis", "iliocostalis", "longissimus", r"\bspinalis", "multifidus",
       "quadratus lumborum", "gluteus", "piriformis", "psoas|iliacus", "latissimus", "pectoralis", "serratus anterior"]
for q in ASK:
    hit = [p for p in parts if re.search(q, p["name"], re.I)]
    names = sorted({p["name"] for p in hit})
    print(f"{q}: {len(hit)} files; per side: " + "; ".join(
        f"{n} [{','.join(sorted(p['fj'] + ':' + p['side'] for p in hit if p['name'] == n))}]" for n in names))
print("fallback-named files:", [(p["fj"], p["name"]) for p in parts if not p["nameFromHeader"]])
print("sides:", {s: sum(p["side"] == s for p in parts) for s in "LRM"}, "total", len(parts))

"""Pick the BodyParts3D 4.0 IS-A element files for the prototype and name each one.

Muscle filter (IS-A tree): element files of the compounds
  FMA5022  muscle organ
  FMA10474 zone of muscle organ        (quadriceps parts, deltoid parts, pectoralis major parts...)
  FMA85453 head of muscle organ        (biceps / triceps / gastrocnemius heads...)
  FMA32555 ascending part of trapezius  (these two sit directly under "organ zone")
  FMA32557 descending part of trapezius
Bone filter: element files of FMA5018 "bone organ" whose name matches BONE_RE (axial skeleton + shoulder girdle + humerus).
Plus the 18 BodyParts3D 3.0 muscle meshes 4.0 lacks (latissimus dorsi, quadratus lumborum, multifidus, rectus abdominis,
internal oblique, transversus abdominis, masseter, temporalis), already warped onto the 4.0 skeleton
(../../missing-muscles/bp30_warped/, see research/missing-muscle-meshes.md). Their id is the FMA id (4.0 ids are FJ...),
name from the 3.0 parts_list_e.txt, side from geometry; "file" gives their OBJ path relative to DATA.

Name: the "English name" in the OBJ file header; if blank, the smallest IS-A compound that owns the file.
Side: from geometry (BodyParts3D: +X = body's left, -X = body's right), not from the name.
Writes ../manifest.json.
"""
import glob, json, os, re
from tables import elements, cname, DATA

OBJ = os.path.join(DATA, "isa_obj", "isa_BP3D_4.0_obj_99")
BP30 = os.path.join(DATA, "..", "missing-muscles", "bp30_warped")
BP30_NAMES = os.path.join(DATA, "..", "bodyparts3d-3.0", "parts_list_e.txt")
MUSCLE_ROOTS = ["FMA5022", "FMA10474", "FMA85453", "FMA32555", "FMA32557"]
BONE_RE = re.compile(r"vertebra|atlas|axis|\brib\b|sternum|manubrium|xiphoid|hip bone|sacrum|coccyx|scapula|clavicle|humerus|"
                     r"frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|ethmoid|zygomatic bone|maxilla|mandible|"
                     r"nasal bone|lacrimal|palatine bone|vomer|nasal concha|hyoid", re.I)


def header(fj, path=None):
    h = {}
    faces = 0
    xs = []
    with open(path or os.path.join(OBJ, fj + ".obj"), encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("# ") and " : " in line:
                k, _, v = line[2:].partition(" : ")
                h.setdefault(k.strip(), v.strip())
            elif line.startswith("v "):
                xs.append(float(line.split()[1]))
            elif line.startswith("f "):
                faces += 1
    h["faces"] = faces
    h["cx"] = sum(xs) / len(xs)
    h["minx"], h["maxx"] = min(xs), max(xs)
    return h


def fallback_name(fj):
    owners = sorted((len(elements[c]), cname[c]) for c in elements if fj in elements[c])
    return owners[0][1]


def side(h):
    if h["minx"] < -5 and h["maxx"] > 5 and abs(h["cx"]) < 10:
        return "M"  # crosses the midline
    return "L" if h["cx"] > 0 else "R"


def strip_side(name):
    return re.sub(r"\b(left|right)\s+", "", name, flags=re.I).strip()


def entry(fj, kind):
    h = header(fj)
    name = h.get("English name") or fallback_name(fj)
    named_side = "L" if re.search(r"\bleft\b", name, re.I) else "R" if re.search(r"\bright\b", name, re.I) else None
    # small parts hugging the midline (larynx, pharynx): trust the name; otherwise trust geometry
    s = named_side if named_side and abs(h["cx"]) < 30 else side(h)
    return {"fj": fj, "kind": kind, "fma": h.get("Concept ID") or None, "name": strip_side(name).lower(),
            "rawName": name, "side": s, "nameSide": named_side, "faces": h["faces"],
            "nameFromHeader": bool(h.get("English name"))}


def bp30_entries():
    names = dict(l.rstrip("\n").split("\t", 1) for l in open(BP30_NAMES, encoding="utf-8") if l.startswith("FMA"))
    out = []
    for path in sorted(glob.glob(os.path.join(BP30, "FMA*.obj"))):
        fma = os.path.basename(path)[:-4]
        h, name = header(None, path), names[fma]
        named_side = "L" if re.search(r"\bleft\b", name, re.I) else "R" if re.search(r"\bright\b", name, re.I) else None
        out.append({"fj": fma, "kind": "muscle", "fma": fma, "name": strip_side(name).lower(), "rawName": name,
                    "side": side(h), "nameSide": named_side, "faces": h["faces"], "nameFromHeader": True,
                    "source": "BodyParts3D 3.0 (warped)", "file": os.path.relpath(path, DATA).replace("\\", "/")})
    assert len(out) == 18, len(out)
    return out


if __name__ == "__main__":
    muscle_fj = sorted(set().union(*(elements[r] for r in MUSCLE_ROOTS)))
    bone_fj = sorted(f for c in elements if BONE_RE.search(cname[c]) for f in elements[c]
                     if f in elements["FMA5018"] and f not in muscle_fj)
    bone_fj = sorted(set(bone_fj))
    parts = [entry(f, "muscle") for f in muscle_fj] + bp30_entries() + [entry(f, "bone") for f in bone_fj]
    json.dump(parts, open(os.path.join(DATA, "manifest.json"), "w", encoding="utf-8"), indent=1)
    m = [p for p in parts if p["kind"] == "muscle"]
    b = [p for p in parts if p["kind"] == "bone"]
    print("muscle parts", len(m), "faces", sum(p["faces"] for p in m))
    print("bone parts", len(b), "faces", sum(p["faces"] for p in b))
    print("muscle sides", {s: sum(p["side"] == s for p in m) for s in "LRM"})
    print("names from header", sum(p["nameFromHeader"] for p in m), "fallback", sum(not p["nameFromHeader"] for p in m))
    print("name side disagrees with geometry:")
    for p in m:
        if p["nameSide"] and p["nameSide"] != p["side"]:
            print("  ", p["fj"], p["rawName"], "geometry side", p["side"])
    print("midline muscles:", [p["rawName"] for p in m if p["side"] == "M"])
    print("bones:", sorted({p["name"] for p in b}))

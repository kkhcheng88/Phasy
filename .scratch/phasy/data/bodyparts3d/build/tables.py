"""Read the official BodyParts3D 4.0 IS-A tables and work out one name per muscle element file.

Rule: an element file (FJxxxx) is a muscle part if it belongs to the compound concept
FMA5022 "muscle organ" in isa_element_parts.txt. Its name is the concept whose element
list is exactly that one file; if several concepts qualify, take the most specific one
(the one that is not a parent of another qualifying concept in isa_inclusion_relation_list.txt).
"""
import csv, json, os, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.dirname(HERE)


def rows(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        r = csv.reader(f, delimiter="\t")
        next(r)
        return [x for x in r if x]


elements = defaultdict(set)  # concept -> element files
cname = {}
for cid, name, fj in rows("isa_element_parts.txt"):
    elements[cid].add(fj)
    cname[cid] = name
children = defaultdict(set)
for pid, _, cid, _ in rows("isa_inclusion_relation_list.txt"):
    children[pid].add(cid)


def descendants(c, seen=None):
    seen = set() if seen is None else seen
    for ch in children[c]:
        if ch not in seen:
            seen.add(ch)
            descendants(ch, seen)
    return seen


single = defaultdict(list)  # FJ -> concepts made of only that file
for cid, fjs in elements.items():
    if len(fjs) == 1:
        single[next(iter(fjs))].append(cid)


def name_of(fj):
    cands = single.get(fj, [])
    # most specific: drop any candidate that has another candidate below it
    best = [c for c in cands if not (descendants(c) & set(cands))] or cands
    return best[0] if best else None, cands


def side_of(name):
    n = " " + name.lower()
    if " right " in n:
        return "R"
    if " left " in n:
        return "L"
    return "-"


def parts(compound):
    out = []
    for fj in sorted(elements[compound]):
        cid, cands = name_of(fj)
        out.append({"fj": fj, "fma": cid, "name": cname.get(cid, "?"), "side": side_of(cname.get(cid, "")),
                    "all_names": [cname[c] for c in cands]})
    return out


if __name__ == "__main__":
    muscles = parts("FMA5022")  # muscle organ
    assert len(muscles) == len(elements["FMA5022"])
    json.dump(muscles, open(os.path.join(DATA, "muscle_parts.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    unnamed = [m for m in muscles if m["fma"] is None]
    print("muscle element files:", len(muscles), "unnamed:", len(unnamed))
    print("sides:", {s: sum(m["side"] == s for m in muscles) for s in "LR-"})
    if len(sys.argv) > 1:
        for m in muscles:
            print(m["fj"], m["fma"], m["side"], m["name"], "|", "; ".join(m["all_names"]))

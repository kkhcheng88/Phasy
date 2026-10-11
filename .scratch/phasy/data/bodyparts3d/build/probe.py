"""Ad-hoc probe: for each search term, list IS-A concepts whose name matches, their element files,
and whether those files are inside the FMA5022 "muscle organ" set. Also explain unnamed muscle files."""
import sys
from tables import elements, cname, name_of

muscle = elements["FMA5022"]
terms = sys.argv[1:]
for t in terms:
    print("==", t)
    for cid, name in sorted(cname.items(), key=lambda x: x[1]):
        if t.lower() in name.lower():
            fjs = sorted(elements[cid])
            inm = sum(f in muscle for f in fjs)
            print(f"  {cid:10} {name:55} n={len(fjs):3} in_muscle={inm} {' '.join(fjs[:8])}")

if not terms:
    for fj in sorted(muscle):
        if name_of(fj)[0] is None:
            owners = sorted((len(elements[c]), cname[c]) for c in elements if fj in elements[c])
            print(fj, "|", "; ".join(f"{n}:{nm}" for n, nm in owners[:4]))

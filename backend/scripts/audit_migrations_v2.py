import os
import re

versions_dir = "/Users/grandmaestro/Documents/P2PHub/backend/migrations/versions"
files = [f for f in os.listdir(versions_dir) if f.endswith(".py")]

revisions = {} # rev -> filename
parents = {} # rev -> list of parents

for f in files:
    path = os.path.join(versions_dir, f)
    with open(path, "r") as src:
        content = src.read()
        rev_match = re.search(r"revision: str = ['\"]([^'\"]+)['\"]", content)
        if not rev_match: rev_match = re.search(r"revision = ['\"]([^'\"]+)['\"]", content)
        
        if not rev_match: continue
        rev = rev_match.group(1)
        revisions[rev] = f
        
        # Look for parent(s)
        # Single parent
        down_match = re.search(r"down_revision: Union\[str, Sequence\[str\], None\] = ['\"]([^'\"]+)['\"]", content)
        if not down_match: down_match = re.search(r"down_revision = ['\"]([^'\"]+)['\"]", content)
        
        # Multi parent
        multi_match = re.search(r"down_revision: Union\[str, Sequence\[str\], None\] = \(([^)]+)\)", content)
        if not multi_match: multi_match = re.search(r"down_revision = \(([^)]+)\)", content)
        
        if down_match:
            parents[rev] = [down_match.group(1)]
        elif multi_match:
            p_list = [x.strip().strip("'").strip('"') for x in multi_match.group(1).split(",")]
            parents[rev] = [p for p in p_list if p]
        else:
            parents[rev] = []

print("Full Migration History Analysis:")
children = {}
for rev, p_list in parents.items():
    for p in p_list:
        if p not in children: children[p] = []
        children[p].append(rev)

heads = [rev for rev in revisions if rev not in children]
print(f"Heads: {heads}")
for head in heads:
    print(f"  - {head} ({revisions[head]}) -> Parent(s): {parents.get(head)}")

print("\nAll Revisions:")
for rev in sorted(revisions.keys()):
    print(f"{rev} ({revisions[rev]})")

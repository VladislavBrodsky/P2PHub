import os
import re

versions_dir = "/Users/grandmaestro/Documents/P2PHub/backend/migrations/versions"
files = [f for f in os.listdir(versions_dir) if f.endswith(".py")]

graph = {}
revisions = {}

for f in files:
    path = os.path.join(versions_dir, f)
    with open(path, "r") as src:
        content = src.read()
        rev_match = re.search(r"revision: str = ['\"]([^'\"]+)['\"]", content)
        if not rev_match:
            rev_match = re.search(r"revision = ['\"]([^'\"]+)['\"]", content)
            
        down_match = re.search(r"down_revision: Union\[str, Sequence\[str\], None\] = ['\"]([^'\"]+)['\"]", content)
        if not down_match:
            down_match = re.search(r"down_revision = ['\"]([^'\"]+)['\"]", content)
        
        # Check for multiple parents
        multi_match = re.search(r"down_revision: Union\[str, Sequence\[str\], None\] = \(([^)]+)\)", content)
        if not multi_match:
            multi_match = re.search(r"down_revision = \(([^)]+)\)", content)
            
        rev = rev_match.group(1) if rev_match else None
        down = None
        if down_match:
            down = down_match.group(1)
        elif multi_match:
            down = [x.strip().strip("'").strip('"') for x in multi_match.group(1).split(",")]
            
        revisions[rev] = f
        graph[rev] = down

print("Migration Graph:")
for rev, down in graph.items():
    print(f"{rev} ({revisions.get(rev)}) -> {down}")

# Find heads (anything not a parent)
parents = set()
for down in graph.values():
    if isinstance(down, list):
        for d in down:
            parents.add(d)
    elif down:
        parents.add(down)

heads = [rev for rev in graph.keys() if rev not in parents]
print(f"\nHeads found: {heads}")

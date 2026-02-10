import os
import re

versions_dir = "backend/migrations/versions"
revisions = {}

for filename in os.listdir(versions_dir):
    if filename.endswith(".py"):
        with open(os.path.join(versions_dir, filename), "r") as f:
            content = f.read()
            rev_match = re.search(r"^revision: str = ['\"]([^'\"]+)['\"]", content, re.M)
            down_rev_match = re.search(r"^down_revision: Union\[str, Sequence\[str\], None\] = (['\"]([^'\"]+)['\"]|\(([^)]+)\)|None)", content, re.M)
            
            if rev_match:
                rev = rev_match.group(1)
                down_rev = down_rev_match.group(1) if down_rev_match else "None"
                revisions[rev] = down_rev

print("Revisions found:")
for rev, down in revisions.items():
    print(f"  {rev} -> {down}")

# Find heads (those not in any down_revision)
all_down_revs = set()
for down in revisions.values():
    if down.startswith("("):
        # Tuple of revisions
        parts = down.strip("()").split(",")
        for p in parts:
            p = p.strip().strip("'").strip('"')
            if p: all_down_revs.add(p)
    elif down != "None":
        all_down_revs.add(down.strip("'").strip('"'))

heads = [rev for rev in revisions if rev not in all_down_revs]
print("\nHeads found:")
for h in heads:
    print(f"  {h}")

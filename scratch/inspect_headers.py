path = "/Users/grandmaestro/Developer/P2PHub/scratch/parent_messages.md"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "audit" in line.lower() or "report" in line.lower():
        print(f"Line {i}: {line.strip()}")

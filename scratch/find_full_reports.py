import re

def name_to_title(name):
    return name.replace("_", " ").title()

path = "/Users/grandmaestro/Developer/P2PHub/scratch/parent_messages.md"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

sections = [
    ("api_report", r"(# P2PHub Backend API Audit Report.*?)(?=\n---|\Z)"),
    ("frontend_report", r"(# P2PHub Frontend Deep Audit.*?)(?=\n---|\Z)"),
    ("db_report", r"(# P2PHub Database Audit.*?)(?=\n---|\Z)")
]

for name, pattern in sections:
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        report = match.group(1)
        # Unescape any JSON encoding leftovers
        report = report.replace("\\n", "\n")
        report = report.replace('\\"', '"')
        report = report.replace("\\'", "'")
        
        out_path = f"/Users/grandmaestro/Developer/P2PHub/scratch/{name}_full.md"
        with open(out_path, "w", encoding="utf-8") as out:
            out.write(report)
        print(f"Extracted {name_to_title(name)} to {out_path} ({len(report)} chars)")
    else:
        print(f"Failed to find {name}")

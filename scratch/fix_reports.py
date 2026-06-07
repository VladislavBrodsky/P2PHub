import os

files = [
    "api_audit_report.md",
    "frontend_audit_report.md",
    "db_audit_report.md"
]

for filename in files:
    path = f"/Users/grandmaestro/Developer/P2PHub/scratch/{filename}"
    if not os.path.exists(path):
        continue
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Replace literal \n with real newline and unescape quotes
    content = content.replace("\\n", "\n")
    content = content.replace('\\"', '"')
    content = content.replace("\\'", "'")
    content = content.replace("\\\\", "\\")
    
    # Strip any leading/trailing quotes if the JSON string was outputted as a literal string
    if content.startswith('"') and content.endswith('"'):
        content = content[1:-1]
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Fixed formatting for {path}")

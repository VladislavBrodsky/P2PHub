import sys
import os
import re
import json

def de_duplicate_and_clean(filepath, dict_name):
    with open(filepath, 'r') as f:
        content = f.read()

    # Match all entries: "slug": """val""",
    entries = re.findall(r'"(\d+)": """(.*?)""",', content, re.DOTALL)
    
    unique_entries = {}
    for slug, val in entries:
        # Clean val if it has JSON
        if "Viral Article Generated (Parse Error)" in val or "{" in val:
            json_match = re.search(r'\{.*\}', val, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    val = f"\n# {data['title']}\n\n{data['excerpt']}\n\n{data['content']}"
                except:
                    pass
        unique_entries[slug] = val

    # Reconstruct the file with a single dictionary
    # Find the start of the original dict to preserve the header
    header_match = re.search(rf'{dict_name} = \{{', content)
    if not header_match: return
    header = content[:header_match.start()]
    
    new_content = header + f"{dict_name} = {{\n"
    # Sort slugs for consistency
    for slug in sorted(unique_entries.keys(), key=int):
        new_content += f'    "{slug}": """{unique_entries[slug]}""",\n'
    new_content += "}\n"
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Sanitized and De-duplicated {filepath}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    de_duplicate_and_clean(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN")
    de_duplicate_and_clean(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU")

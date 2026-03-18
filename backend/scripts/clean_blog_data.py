import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import os
import re
import sys


def clean_file(filepath, dict_name):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath) as f:
        content = f.read()

    # Find the dictionary content
    pattern = rf'{dict_name} = \{{(.*?)\}}'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"Dict {dict_name} not found in {filepath}")
        return

    # Extract entries using regex to handle the multiline strings
    # Entry format: "slug": """content""",
    entries = re.findall(r'"(\d+)": """(.*?)""",', content, re.DOTALL)
    
    new_entries = []
    for slug, val in entries:
        if "Viral Article Generated (Parse Error)" in val:
            # Try to extract JSON
            json_match = re.search(r'\{.*\}', val, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    new_val = f"\n# {data['title']}\n\n{data['excerpt']}\n\n{data['content']}"
                    new_entries.append((slug, new_val))
                    continue
                except:
                    pass
        new_entries.append((slug, val))

    # Reconstruct the file
    header = content[:match.start()]
    footer = content[match.end():]
    
    dict_content = f"{dict_name} = {{\n"
    for slug, val in new_entries:
        dict_content += f'    "{slug}": """{val}""",\n'
    dict_content += "}"
    
    with open(filepath, 'w') as f:
        f.write(header + dict_content + footer)
    print(f"Cleaned {filepath}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    clean_file(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN")
    clean_file(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU")

import json
import os
import re
import sys


def aggressive_polish(text):
    """
    Final Master Polishing for Pintopay Blog.
    Ensures elite spacing, typography, and structure.
    """
    # 1. AI Error Cleanup
    text = re.sub(r'# Viral Article Generated.*?failed\.', '', text, flags=re.DOTALL)
    if '"title":' in text or '"content":' in text:
        title_m = re.search(r'"title":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        excerpt_m = re.search(r'"excerpt":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        content_m = re.search(r'"content":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        if title_m and content_m:
            title = title_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            excerpt = excerpt_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip() if excerpt_m else ""
            body = content_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            text = f"# {title}\n\n{excerpt}\n\n{body}"

    # 2. Bold Marker Tightening
    text = re.sub(r'\*\*\s*\*\*', '', text)
    # Remove spaces INSIDE double stars: ** text ** -> **text**
    # Using multiple passes or group-based sub
    text = re.sub(r'\*\*\s+', '**', text)
    text = re.sub(r'\s+\*\*', '**', text)
    
    # 3. Structural Markers Separation
    markers = ["The Hook:", "The Meat:", "The Turn:", "CTA & Closing:", "Call to Action & Closing:", "The Hook", "The Meat", "The Turn"]
    for m in markers:
        clean_m = m.replace(':', '')
        text = re.sub(rf'(?:\*\*)?{m}(?::)?(?:\*\*)?\s*', f'\n\n**{clean_m}:** ', text)

    # 4. Sentence/Block Spacing (Manifesto Style)
    # If a sentence ends with punctuation and the next thing is a bold block, ensure double newline
    text = re.sub(r'([.!?])\s*(\*\*)', r'\1\n\n\2', text)
    # If a bold block ends and text follows, ensure double newline
    text = re.sub(r'(\*\*)\s*(\w)', r'\1\n\n\2', text)
    
    # 5. List item polishing: ensure - **Text** format
    text = re.sub(r'-\s*\*\*', r'- **', text)
    
    # 6. Final paragraph normalization
    lines = [l.strip() for l in text.split('\n')]
    cleaned_lines = []
    for l in lines:
        if not l: continue
        # If it's a structural point or header, keep it separate
        if l.startswith('#') or l.startswith('**') or l.startswith('-'):
            cleaned_lines.append(l)
        else:
            # Maybe split long sentences into punchy lines?
            # For now just ensure they are clean paragraphs.
            cleaned_lines.append(l)
            
    text = '\n\n'.join(cleaned_lines)

    # 7. Post-processing cleanups
    text = text.replace('** :', '**:')
    text = text.replace('** .', '**.')
    text = text.replace('  ', ' ')
    
    # 8. H1 Enforcement
    if not text.startswith('# '):
        if text.startswith('## '):
            text = text[1:] 
        elif not text.startswith('#'):
            parts = text.split('\n', 1)
            if len(parts[0]) < 150:
                text = f"# {parts[0]}\n\n{parts[1] if len(parts)>1 else ''}"

    text = re.sub(r'^# (.*?)\n+', r'# \1\n\n', text)
    
    # 9. Link cleaning
    text = re.sub(r'\]\((.*?)\)', r'](\1)', text) # Ensure no weird spaces in links

    return text.strip()

def process_file(filepath, dict_name):
    if not os.path.exists(filepath): return
    with open(filepath) as f:
        content = f.read()
    start_match = re.search(rf'{dict_name} = \{{', content)
    if not start_match: return
    dict_body = content[start_match.end():]
    end_index = dict_body.rfind('}')
    dict_body = dict_body[:end_index]
    entries = re.findall(r'"(\d+)":\s+"""(.*?)"""', dict_body, re.DOTALL)
    unique_entries = {}
    for slug, val in entries:
        unique_entries[slug] = aggressive_polish(val)
    header = content[:start_match.start()]
    new_content = header + f"{dict_name} = {{\n"
    for slug in sorted(unique_entries.keys(), key=int):
        new_content += f'    "{slug}": """{unique_entries[slug]}""",\n'
    new_content += "}\n"
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Master Polishing Complete: {filepath}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    process_file(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN")
    process_file(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU")

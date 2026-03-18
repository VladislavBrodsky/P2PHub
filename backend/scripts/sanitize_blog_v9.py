import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import os
import re
import sys


def repair_markdown_bold(text, lang="en"):
    """
    Repair Markdown Bold formatting (v9).
    fixes the damage caused by v8 which added spaces inside bold tags.
    Converts "** Word **" back to "**Word**".
    """
    
    # 1. Fix internal spaces in bold tags: ** text ** -> **text**
    # We use non-greedy matching .*? to find pairs of **
    # We allow whitespace \s* inside the tags to be captured and removed
    # This also fixes multi-line bold if DOTALL is used (though rare in these blogs)
    
    def replacer(match):
        content = match.group(1)
        # Strip leading/trailing whitespace from the content inside **...**
        return f"**{content.strip()}**"
    
    # Pattern: ** followed by anything (non-greedy), ending with **
    # We explicitly look for spaces to fix, but the generic cleaner is safer
    text = re.sub(r'\*\*(.*?)\*\*', replacer, text, flags=re.DOTALL)
    
    # 2. Ensure External Spacing (re-verified)
    # Ensure space BEFORE ** if it starts a word: "word**Bold**" -> "word **Bold**"
    # Logic: If ** is followed by a non-space char, and preceded by a non-space/non-open-paren/non-quote char
    text = re.sub(r'([a-zA-Z0-9.,:;!?])\*\*([a-zA-Z0-9])', r'\1 **\2', text)
    
    # Ensure space AFTER ** if it ends a word: "**Bold**word" -> "**Bold** word"
    # Logic: If ** is preceded by non-space, and followed by a letter/number (not punctuation)
    text = re.sub(r'([a-zA-Z0-9])\*\*([a-zA-Z0-9])', r'\1** \2', text)

    return text.strip()

def process_file(filepath, dict_name, lang):
    if not os.path.exists(filepath): 
        print(f"File not found: {filepath}")
        return
    print(f"Repairing {filepath} ({lang})...")
    
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
        
    pattern = r'    "(\d+)": """(.*?)""",'
    entries = re.findall(pattern, content, re.DOTALL)
    
    new_content = content
    count = 0
    for slug, text in entries:
        cleaned_text = repair_markdown_bold(text, lang)
        
        if cleaned_text != text:
            # We must replace carefully to avoid partial matches
            old_entry = f'    "{slug}": """{text}""",'
            new_entry = f'    "{slug}": """{cleaned_text}""",'
            
            if old_entry in new_content:
                new_content = new_content.replace(old_entry, new_entry)
                count += 1
            else:
                print(f"Warning: Could not replace content for slug {slug}")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Repaired {count} entries in {dict_name}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    process_file(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN", "en")
    process_file(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU", "ru")

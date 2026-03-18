import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import os
import re
import sys


def professional_polish(text, lang="en"):
    """
    Elite Polishing for Pintopay Blog.
    Fixes grammar glitches, robotic AI signatures, and typographical errors.
    """
    # 1. AI Signature Cleanup (Robotic Bold Slogans)
    # If a paragraph at the end is just a bolded slogan, make it more natural
    slogans = [
        r"Добро пожаловать в Суверенитет\. Добро пожаловать в Империю\.",
        r"Welcome to Sovereignty\. Welcome to the Empire\.",
        r"Будьте ликвидными\. Будьте суверенными\.",
        r"Be liquid\. Be sovereign\."
    ]
    for slogan in slogans:
        # Replace bolded version with unbolded or just clean it up
        text = re.sub(rf"\*\*{slogan}\*\*", slogan, text)
        
    # 2. Markdown Bold Glitch Fixes
    # Remove double-double bolds ****Text**** -> **Text**
    text = re.sub(r"\*\*\*\*", "**", text)
    # Remove spaces inside bolds: ** text ** -> **text**
    text = re.sub(r"\*\*\s+", "**", text)
    text = re.sub(r"\s+\*\*", "**", text)
    # Remove empty bolds
    text = re.sub(r"\*\*\s*\*\*", "", text)
    
    # 3. Punctuation Glitches (Common AI mistakes)
    # No space before punctuation
    text = re.sub(r"\s+([.,!?;:])", r"\1", text)
    # Exactly one space after punctuation if there's text
    text = re.sub(r"([.,!?;:])(?=[^\s\d\)])", r"\1 ", text)
    # Fix double spaces
    text = re.sub(r" {2,}", " ", text)
    
    # 4. Russian Typography Specifics
    if lang == "ru":
        # Use proper em-dash for Russian
        text = re.sub(r" - ", " — ", text)
        # Fix common literal translation glitches
        text = text.replace("Строить трубы", "Прокладывать магистрали")
        text = text.replace("денежная машина", "финансовый двигатель")
        
    # 5. Structural Consistency
    # Ensure H1 Title is unique and properly spaced
    text = re.sub(r"^# (.*?)\n+", r"# \1\n\n", text)
    
    # Ensure all paragraphs are separated by double newline
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    text = '\n\n'.join(paragraphs)
    
    # 6. Final Polish pass on bolds at line starts
    # Ensure **Marker:** has a space after colon
    text = re.sub(r"(\*\*\w+?):(\w)", r"\1: \2", text)

    return text.strip()

def process_file(filepath, dict_name, lang):
    if not os.path.exists(filepath): return
    print(f"Polishing {filepath} ({lang})...")
    
    with open(filepath) as f:
        content = f.read()
        
    # Find all multiline entries
    pattern = r'    "(\d+)": """(.*?)""",'
    entries = re.findall(pattern, content, re.DOTALL)
    
    new_content = content
    for slug, text in entries:
        cleaned_text = professional_polish(text, lang)
        # Escape triple quotes if any (unlikely but safe)
        cleaned_text = cleaned_text.replace('"""', '\"\"\"')
        
        # Replace specifically this entry
        # We use a unique marker for replacement to avoid regex complexity
        old_entry = f'    "{slug}": """{text}""",'
        new_entry = f'    "{slug}": """{cleaned_text}""",'
        new_content = new_content.replace(old_entry, new_entry)
        
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Done polishing {dict_name}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    process_file(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN", "en")
    process_file(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU", "ru")

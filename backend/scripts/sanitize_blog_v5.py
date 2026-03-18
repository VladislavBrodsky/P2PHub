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
    slogans = [
        ("Добро пожаловать в Суверенитет. Добро пожаловать в Империю.", r"Добро пожаловать в Суверенитет\. Добро пожаловать в Империю\."),
        ("Welcome to Sovereignty. Welcome to the Empire.", r"Welcome to Sovereignty\. Welcome to the Empire\."),
        ("Будьте ликвидными. Будьте суверенными.", r"Будьте ликвидными\. Будьте суверенными\."),
        ("Be liquid. Be sovereign.", r"Be liquid\. Be sovereign\.")
    ]
    for clean, pattern in slogans:
        text = re.sub(rf"\*\*\s*{pattern}\s*\*\*", clean, text)
        
    # 2. Markdown Bold Glitch Fixes
    # Remove excessive stars
    text = re.sub(r"\*{3,}", "**", text)
    
    # Ensure space BEFORE opening ** if preceded by an alphanumeric character
    # Use explicit character classes to avoid matching spaces
    text = re.sub(r"([a-zA-Zа-яА-Я0-9])(\*\*)", r"\1 \2", text)
    
    # Ensure space AFTER closing ** if followed by an alphanumeric character
    text = re.sub(r"(\*\*)([a-zA-Zа-яА-Я0-9])", r"\1 \2", text)
    
    # Remove INTERNAL spaces in bolds: ** text ** -> **text**
    text = re.sub(r"\*\*\s+", "**", text)
    text = re.sub(r"\s+\*\*", "**", text)
    
    # Remove empty bolds
    text = re.sub(r"\*\*\s*\*\*", "", text)
    
    # 3. Punctuation Glitches
    # No space before punctuation
    text = re.sub(r" +([.,!?;:])", r"\1", text)
    # Exactly one space after punctuation
    text = re.sub(r"([.,!?;:])(?=[a-zA-Zа-яА-Я])", r"\1 ", text)
    
    # Fix double spaces
    text = re.sub(r" {2,}", " ", text)
    
    # 4. Russian Typography & Cleanup
    if lang == "ru":
        text = re.sub(r" - ", " — ", text)
        text = text.replace("фильнансов", "финансов")
        text = text.replace("Строить трубы", "Прокладывать магистрали")
        text = text.replace("денежная машина", "финансовый двигатель")
        text = text.replace(r"\.", ".")
        
    # 5. Structural Consistency
    text = re.sub(r"^# (.*?)\n+", r"# \1\n\n", text)
    
    # Normalize paragraph breaks
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    text = '\n\n'.join(paragraphs)

    return text.strip()

def process_file(filepath, dict_name, lang):
    if not os.path.exists(filepath): return
    print(f"Polishing {filepath} ({lang})...")
    
    with open(filepath) as f:
        content = f.read()
        
    pattern = r'    "(\d+)": """(.*?)""",'
    entries = re.findall(pattern, content, re.DOTALL)
    
    new_content = content
    for slug, text in entries:
        cleaned_text = professional_polish(text, lang)
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

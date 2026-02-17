import json
import os
import re
import sys


def professional_polish(text, lang="en"):
    """
    Elite Polishing for Pintopay Blog (v7).
    Fixes grammar glitches, robotic AI signatures, and structural header issues.
    """
    # 1. AI Signature Cleanup
    slogans = [
        ("Добро пожаловать в Суверенитет. Добро пожаловать в Империю.", r"Добро пожаловать в Суверенитет\. Добро пожаловать в Империю\."),
        ("Welcome to Sovereignty. Welcome to the Empire.", r"Welcome to Sovereignty\. Welcome to the Empire\."),
        ("Будьте ликвидными. Будьте суверенными.", r"Будьте ликвидными\. Будьте суверенными\."),
        ("Be liquid. Be sovereign.", r"Be liquid\. Be sovereign\.")
    ]
    for clean, pattern in slogans:
        text = re.sub(rf"\*\*\s*{pattern}\s*\*\*", f"**{clean}**", text)
        
    # 2. Markdown Bold Glitch Fixes (Missing spaces around **)
    text = re.sub(r"\*{3,}", "**", text)
    
    # Touch-up: If ** is touching a character (especially words), insert a space
    # Lookbehind for non-space, non-star
    text = re.sub(r"([^\s\*])(\*\*)", r"\1 \2", text)
    # Lookahead for non-space, non-star
    text = re.sub(r"(\*\*)([^\s\*])", r"\1 \2", text)
    
    # 3. Header Structural Fixes (Crucial for the "glitch" reported)
    # Ensure headers (##, ###) always start on a new line and have a space after
    text = re.sub(r"([^\n])(#{2,3}[^#])", r"\1\n\n\2", text)
    text = re.sub(r"(#{2,3})([^\s#])", r"\1 \2", text)
    
    # 4. Spacing around Bold (internal cleanup)
    text = re.sub(r"\*\*\s+", "**", text)
    text = re.sub(r"\s+\*\*", "**", text)
    
    # 5. Punctuation Spacing
    # Ensure no space before punctuation
    text = re.sub(r" +([.,!?;:])", r"\1", text)
    # Ensure space after punctuation if followed by a letter (Russian and English)
    text = re.sub(r"([.,!?;:])([а-яА-Яa-zA-Z])", r"\1 \2", text)
    
    # 6. Specific word glitches reported
    if lang == "en":
        text = text.replace("thatAuthority", "that Authority")
        
    # 7. Russian Typography
    if lang == "ru":
        text = re.sub(r" — ", " — ", text) 
        text = re.sub(r" - ", " — ", text)
        text = text.replace("фильнансов", "финансов")
        text = text.replace("Прокладывать трубы", "Прокладывать магистрали")
        
    # 8. Spacing normalization
    text = re.sub(r" {2,}", " ", text)
    
    # 9. Final Structural Cleanup
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    cleaned_paragraphs = []
    for p in paragraphs:
        # If a line contains a header in the middle because it was joined, split it further
        if "###" in p and not p.startswith("###"):
            parts = re.split(r"(###.*)", p)
            for part in parts:
                if part.strip(): cleaned_paragraphs.append(part.strip())
        elif "##" in p and not p.startswith("##"):
            parts = re.split(r"(##.*)", p)
            for part in parts:
                if part.strip(): cleaned_paragraphs.append(part.strip())
        else:
            cleaned_paragraphs.append(p)
            
    text = '\n\n'.join(cleaned_paragraphs)

    return text.strip()

def process_file(filepath, dict_name, lang):
    if not os.path.exists(filepath): return
    print(f"Polishing {filepath} ({lang})...")
    
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
        
    # Match multiline strings carefully
    pattern = r'    "(\d+)": """(.*?)""",'
    entries = re.findall(pattern, content, re.DOTALL)
    
    new_content = content
    for slug, text in entries:
        cleaned_text = professional_polish(text, lang)
        
        # Exact string replacement
        old_entry = f'    "{slug}": """{text}""",'
        new_entry = f'    "{slug}": """{cleaned_text}""",'
        new_content = new_content.replace(old_entry, new_entry)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done polishing {dict_name}")

if __name__ == "__main__":
    base_dir = "/Users/grandmaestro/Documents/P2PHub/backend/scripts/data"
    process_file(os.path.join(base_dir, "blog_content_en.py"), "BLOG_CONTENT_EN", "en")
    process_file(os.path.join(base_dir, "blog_content_ru.py"), "BLOG_CONTENT_RU", "ru")

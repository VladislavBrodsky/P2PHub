import re
import os

file_paths = [
    '/Users/grandmaestro/Documents/P2PHub/backend/scripts/data/blog_content_en.py',
    '/Users/grandmaestro/Documents/P2PHub/backend/scripts/data/blog_content_ru.py'
]

actual_link = "https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"

def fix_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the Literal {cta_link} placeholders
    content = content.replace('{cta_link}', actual_link)
    
    # 2. Fix potential broken Markdown like [Text]({actual_link}) where actual link might have been wrongly inserted or doubled
    # Ensure it's exactly [Text](URL)
    
    # 3. Clean up trailing ** that sometimes get orphaned
    # Often articles end with ***""" or **""" - we should ensure it's clean.
    # Pattern: body content then ** and then closing quotes
    content = re.sub(r'\*\*\s*"""', r'"""', content)
    
    # 4. Fix double-triple quotes if any (unlikely but safe)
    
    # 5. Fix common spacing issues in CTAs
    # Example: duplicate newlines or missing ones
    
    # Let's perform a more surgical fix on the CTA block specifically
    cta_pattern_ru = r'### Ваша Свобода в Одном Клике.*?👉 \*\*\[Забрать Карту Pintopay и Начать Жить\]\(.*?\)'
    def cta_replacer_ru(match):
        return f"""### Ваша Свобода в Одном Клике

Pintopay — это решение. Дверь перед вами.

👉 **[Забрать Карту Pintopay и Начать Жить]({actual_link})**
*(Спрос высокий. Действуйте быстро.)*"""

    cta_pattern_en = r'### Your Freedom in One Click.*?👉 \*\*\[Claim Your Pintopay Card and Start Living\]\(.*?\)'
    def cta_replacer_en(match):
        return f"""### Your Freedom in One Click

Pintopay is the solution. The door is right here.

👉 **[Claim Your Pintopay Card and Start Living]({actual_link})**
*(High Demand. Act Fast.)*"""

    if "blog_content_ru.py" in file_path:
        content = re.sub(cta_pattern_ru, cta_replacer_ru, content, flags=re.DOTALL)
    else:
        content = re.sub(cta_pattern_en, cta_replacer_en, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {file_path}")

for path in file_paths:
    fix_content(path)

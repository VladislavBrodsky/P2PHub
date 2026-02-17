import asyncio
import json
import os
import re
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.core.config import settings
from app.services.copywriter import ViralCopywriter
from scripts.data.blog_content_en import BLOG_CONTENT_EN
from scripts.data.blog_content_ru import BLOG_CONTENT_RU


async def audit_and_improve(batch_start: int = 1, batch_size: int = 5):
    copywriter = ViralCopywriter(api_key=settings.OPENAI_API_KEY)
    
    en_file = os.path.join(os.path.dirname(__file__), "data", "blog_content_en.py")
    ru_file = os.path.join(os.path.dirname(__file__), "data", "blog_content_ru.py")
    
    # Slugs to process
    slugs = [str(i) for i in range(batch_start, batch_start + batch_size)]
    
    for slug in slugs:
        print(f"--- Processing Article {slug} ---")
        
        # Improvement for EN
        current_en = BLOG_CONTENT_EN.get(slug, "")
        if current_en:
            print(f"  Improving EN {slug} (current len: {len(current_en)})...")
            res_en = await copywriter.improve_article(current_en, language="en")
            if "error" not in res_en:
                await update_blog_file(en_file, slug, res_en, "BLOG_CONTENT_EN")
                print(f"  ✅ EN {slug} updated.")
            else:
                print(f"  ❌ Error EN {slug}: {res_en['error']}")
        
        # Improvement for RU (Mandatory audit/native-ify)
        current_ru = BLOG_CONTENT_RU.get(slug, "")
        if current_ru:
            print(f"  Improving RU {slug} (current len: {len(current_ru)})...")
            res_ru = await copywriter.improve_article(current_ru, language="ru")
            if "error" not in res_ru:
                await update_blog_file(ru_file, slug, res_ru, "BLOG_CONTENT_RU")
                print(f"  ✅ RU {slug} updated (Professional Native Quality).")
            else:
                print(f"  ❌ Error RU {slug}: {res_ru['error']}")
        
        # Sync to Locale
        if "error" not in res_en and "error" not in res_ru:
            await sync_to_locale(slug, res_en, res_ru)

async def update_blog_file(filepath: str, slug: str, res: dict, dict_name: str):
    title = res.get("title", "")
    excerpt = res.get("excerpt", "")
    content = res.get("content", "")
    
    # Format properly
    full_text = f"\n# {title}\n\n{excerpt}\n\n{content}"
    
    with open(filepath) as f:
        file_content = f.read()
    
    # Regex to replace the multiline string for the slug
    pattern = rf'    "{slug}": """(.*?)""",'
    replacement = f'    "{slug}": """{full_text}""",'
    
    new_content = re.sub(pattern, replacement, file_content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

async def sync_to_locale(slug: str, res_en: dict, res_ru: dict):
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    locales = {
        "en": os.path.join(base_path, "frontend/src/locales/en/marketing.json"),
        "ru": os.path.join(base_path, "frontend/src/locales/ru/marketing.json")
    }
    
    for lang, path in locales.items():
        res = res_en if lang == "en" else res_ru
        if not os.path.exists(path): continue
        
        with open(path) as f:
            data = json.load(f)
            
        if "blog" not in data: data["blog"] = {}
        if "posts" not in data["blog"]: data["blog"]["posts"] = {}
        
        # Keep existing category if possible, or update from content
        category = "Wealth Strategy"
        if slug in data["blog"]["posts"]:
            category = data["blog"]["posts"][slug].get("category", category)
            
        data["blog"]["posts"][slug] = {
            "title": res.get("title", ""),
            "excerpt": res.get("excerpt", ""),
            "category": category
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    # Process batch 1-10
    batch_start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    asyncio.run(audit_and_improve(batch_start, batch_size))

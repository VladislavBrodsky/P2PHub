import json
import os
import re
import sys


def sync_all_locales():
    base_path = os.getcwd()
    en_file = os.path.join(base_path, "backend/scripts/data/blog_content_en.py")
    ru_file = os.path.join(base_path, "backend/scripts/data/blog_content_ru.py")
    
    locales = {
        "en": os.path.join(base_path, "frontend/src/locales/en/marketing.json"),
        "ru": os.path.join(base_path, "frontend/src/locales/ru/marketing.json")
    }

    # Extract all titles and excerpts from data files
    with open(en_file) as f: en_text = f.read()
    with open(ru_file) as f: ru_text = f.read()

    def get_metadata(text):
        # Entry format: "slug": """# Title\n\nExcerpt\n\nContent"""
        entries = re.findall(r'"(\d+)":\s+"""(?:#\s*)?(.*?)\n\n(.*?)\n\n', text, re.DOTALL)
        return {slug: {"title": title.strip(), "excerpt": excerpt.strip()} for slug, title, excerpt in entries}

    en_meta = get_metadata(en_text)
    ru_meta = get_metadata(ru_text)

    # Categories from generate_blog_expansion.py
    # We'll just use a default or try to match if we can find the list.
    # For now, let's use the premium categories we defined.
    
    PREMIUM_CATEGORIES = {
        "20": "Geopolitical Shifts",
        "21": "Financial Shift",
        "22": "Sovereign Mindset",
        "23": "Tactical Blueprints",
        "24": "Wealth Strategy",
        "25": "Sovereign Mindset",
        "26": "Web3 Intelligence",
        "27": "Global Trends",
        "28": "Viral Marketing",
        "29": "Global Trends",
        "30": "Sovereign Mindset",
        "31": "Tactical Blueprints",
        "32": "Problem & Solution",
        "33": "Global Trends",
        "34": "Sovereign Mindset",
        "35": "Intelligence Culture",
        "36": "Wealth Strategy",
        "37": "Network Velocity",
        "38": "Intelligence Culture",
        "39": "Tactical Blueprints",
        "40": "Innovation",
        "41": "Sovereign Mindset",
        "42": "Innovation",
        "43": "Wealth Strategy",
        "44": "Global Trends",
        "45": "Intelligence Culture",
        "46": "Sovereign Mindset",
        "47": "Geopolitical Shifts",
        "48": "Network Velocity",
        "49": "Tactical Blueprints"
    }

    for lang, path in locales.items():
        if not os.path.exists(path):
            print(f"Skipping {lang} - path not found: {path}")
            continue
            
        with open(path) as f:
            data = json.load(f)
            
        if "blog" not in data: data["blog"] = {}
        if "posts" not in data["blog"]: data["blog"]["posts"] = {}
        
        meta = en_meta if lang == "en" else ru_meta
        for slug, info in meta.items():
            # Only update if slug is 20+ (expansion articles)
            if int(slug) < 20: continue
            
            # Map category
            cat = PREMIUM_CATEGORIES.get(slug, "Intelligence Hub")
            
            data["blog"]["posts"][slug] = {
                "title": info["title"],
                "excerpt": info["excerpt"],
                "category": cat
            }
            print(f"Synced slug {slug} for {lang} with category {cat}")
            
        with open(path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    sync_all_locales()

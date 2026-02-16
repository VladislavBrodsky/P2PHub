import sys
import os
import asyncio
import json
import re
from typing import Dict

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
# Load .env from backend directory FIRST
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.services.copywriter import ViralCopywriter
from app.core.config import settings

# topics for expansion (Slugs 20-49) - 30 Articles
TOPICS = [
    {"topic": "The 2026 Financial Reset: Why CBDCs are the ultimate surveillance trap", "category": "Geopolitical Shifts"},
    {"topic": "The Death of SWIFT: Why international banking is a sinking ship", "category": "Financial Shift"},
    {"topic": "The Privacy Premium: Why staying off-radar is the new luxury flex", "category": "Sovereign Mindset"},
    {"topic": "Mathematics of Scale: Building a 10,000 Partner Network without working harder", "category": "Tactical Blueprints"},
    {"topic": "Digital Nomad 2.0: Managing global wealth from a beach in Bali", "category": "Wealth Strategy"},
    {"topic": "The Sovereign Mindset: Escaping the employee cage forever", "category": "Sovereign Mindset"},
    {"topic": "Quantum-Safe Wealth: How to secure your digital empire for decades", "category": "Web3 Intelligence"},
    {"topic": "Global Arbitrage: How smart money spends USD in emerging markets", "category": "Global Trends"},
    {"topic": "AI Referral Engines: Using Pintopay PRO tools to automate your growth", "category": "Viral Marketing"},
    {"topic": "The Legacy Trap: Why 401ks and Pensions are failing in the new economy", "category": "Global Trends"},
    {"topic": "Financial Ghosting: Moving through the economy without leaving a trace", "category": "Sovereign Mindset"},
    {"topic": "The $100K Blueprint: How to hit Rank Elite in 90 days", "category": "Tactical Blueprints"},
    {"topic": "Crypto Cards vs Traditional Credit: The hidden costs of legacy plastic", "category": "Problem & Solution"},
    {"topic": "The Great Wealth Migration: Why capital is moving on-chain", "category": "Global Trends"},
    {"topic": "Sovereign Individuals: The new class of global citizens", "category": "Sovereign Mindset"},
    {"topic": "Automated Prosperity: Setting up your first passive crypto-fiat bridge", "category": "Intelligence Culture"},
    {"topic": "The Inflation Hedge: Real-time settlement vs devaluing fiat", "category": "Wealth Strategy"},
    {"topic": "Network Velocity: Why speed of money is more important than amount", "category": "Network Velocity"},
    {"topic": "The Pintopay Manifest: Our vision for a world without financial borders", "category": "Intelligence Culture"},
    {"topic": "Elite Networking: Accessing the rooms where the whales swim", "category": "Tactical Blueprints"},
    {"topic": "Weaponized AI: How automation outruns traditional markets", "category": "Innovation"},
    {"topic": "Invisible Borders: Navigating the world with a crypto-first lifestyle", "category": "Sovereign Mindset"},
    {"topic": "The QR Code Revolution: Why plastic cards are becoming obsolete", "category": "Innovation"},
    {"topic": "Yield Farming vs. P2P Networking: Where the real wealth is built", "category": "Wealth Strategy"},
    {"topic": "Global Mobility: How to move your wealth as fast as you move your body", "category": "Global Trends"},
    {"topic": "The Frictionless Future: A deep dive into Pintopay's invisible engine", "category": "Intelligence Culture"},
    {"topic": "Psychology of Wealth: Why 99% of users never cross the $1000/day mark", "category": "Sovereign Mindset"},
    {"topic": "Digital Gold Rush: Why 2026 is the last chance for early adoption", "category": "Geopolitical Shifts"},
    {"topic": "Autonomous Replication: The secret to building a self-growing network", "category": "Network Velocity"},
    {"topic": "Strategic Positioning: How to become the go-to Node in your city", "category": "Tactical Blueprints"},
]

async def generate_batch(batch_size: int = 5):
    copywriter = ViralCopywriter(api_key=settings.OPENAI_API_KEY)
    
    # Files
    en_file = os.path.join(os.path.dirname(__file__), "data", "blog_content_en.py")
    ru_file = os.path.join(os.path.dirname(__file__), "data", "blog_content_ru.py")
    
    # Check existing slugs
    with open(en_file, 'r') as f:
        en_content = f.read()
    
    # Start from slug 20
    start_slug = 20
    
    for i, item in enumerate(TOPICS[:batch_size]):
        slug = str(start_slug + i)
        if f'"{slug}":' in en_content:
            print(f"Skipping article {slug} as it already exists.")
            continue
            
        print(f"Generating article {slug}: {item['topic']}...")
        
        # Map premium categories to ViralCopywriter's internal templates
        cat_map = {
            "Geopolitical Shifts": "brand_awareness",
            "Financial Shift": "problem_solution",
            "Sovereign Mindset": "brand_awareness",
            "Tactical Blueprints": "hype_viral",
            "Wealth Strategy": "brand_awareness",
            "Web3 Intelligence": "brand_awareness",
            "Global Trends": "brand_awareness",
            "Viral Marketing": "promotional",
            "Problem & Solution": "problem_solution",
            "Intelligence Culture": "brand_awareness",
            "Network Velocity": "hype_viral",
            "Innovation": "brand_awareness"
        }
        cat = cat_map.get(item['category'], "brand_awareness")
        
        # EN
        print(f"  Writing English version...")
        en_res = await copywriter.generate_article(category=cat, topic=item['topic'], language="en")
        if "error" in en_res:
            print(f"  Error EN: {en_res['error']}")
            continue
            
        # RU
        print(f"  Writing Russian version...")
        ru_res = await copywriter.generate_article(category=cat, topic=item['topic'], language="ru")
        if "error" in ru_res:
             # Fallback: Translate EN to RU using the same agent logic if possible or just skip
             print(f"  Error RU: {ru_res['error']}")
             continue

        # Append to files
        await append_to_blog_data(en_file, slug, en_res, "BLOG_CONTENT_EN")
        await append_to_blog_data(ru_file, slug, ru_res, "BLOG_CONTENT_RU")
        
        # Sync Locales - pass the premium category name, not the internal mapping
        await sync_locales(slug, en_res, ru_res, item['category'])
        
        print(f"  Successfully saved and synced article {slug}!")

async def sync_locales(slug: str, en_res: Dict, ru_res: Dict, category: str):
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    locales = {
        "en": os.path.join(base_path, "frontend/src/locales/en/marketing.json"),
        "ru": os.path.join(base_path, "frontend/src/locales/ru/marketing.json")
    }
    
    for lang, path in locales.items():
        res = en_res if lang == "en" else ru_res
        if not os.path.exists(path): continue
        
        with open(path, 'r') as f:
            data = json.load(f)
            
        if "blog" not in data: data["blog"] = {}
        if "posts" not in data["blog"]: data["blog"]["posts"] = {}
        
        data["blog"]["posts"][slug] = {
            "title": res.get("title", ""),
            "excerpt": res.get("excerpt", ""),
            "category": category.replace("_", " ").title()
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

def aggressive_polish(text):
    """
    Master manifesto polishing - with robust JSON extraction fallback.
    """
    # 1. First, remove the "Viral Article Generated" header if it exists
    text = re.sub(r'# Viral Article Generated.*?failed\.', '', text, flags=re.DOTALL)

    # 2. Try to extract from JSON if it looks like a parse error block
    if '"title":' in text or '"content":' in text:
        title_m = re.search(r'"title":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        excerpt_m = re.search(r'"excerpt":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        content_m = re.search(r'"content":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        
        if title_m and content_m:
            title = title_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            excerpt = excerpt_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip() if excerpt_m else ""
            body = content_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            text = f"# {title}\n\n{excerpt}\n\n{body}"

    # 3. Fix bolding glitches and spacing
    text = re.sub(r'\*\*\s*\*\*', '', text)
    
    # 4. Handle structural markers ensure they are bold and separate
    markers = ["The Hook:", "The Meat:", "The Turn:", "CTA & Closing:", "Call to Action & Closing:", "The Hook", "The Meat", "The Turn"]
    for m in markers:
        clean_m = m.replace(':', '')
        text = re.sub(rf'(?:\*\*)?{m}(?::)?(?:\*\*)?\s*', f'\n\n**{clean_m}:** ', text)

    # 5. Spacing for manifestos: split by common patterns like **Text** and ensure newlines
    text = re.sub(r'(\w)\s*\*\*', r'\1\n\n**', text)
    text = re.sub(r'\*\*\s*(\w)', r'**\n\n\1', text)

    # 6. Final paragraph cleanup
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    text = '\n\n'.join(paragraphs)
    
    # 7. Final micro-fixes
    text = text.replace('** :', '**:')
    text = text.replace('** .', '**.')
    text = text.replace('  ', ' ')
    
    # 8. Ensure H1 starts the document
    if not text.startswith('# '):
        if text.startswith('## '):
            text = text[1:] 
        elif not text.startswith('#'):
            lines = text.split('\n')
            if len(lines[0]) < 100:
                lines[0] = f"# {lines[0]}"
                text = '\n'.join(lines)

    text = re.sub(r'^# (.*?)\n+', r'# \1\n\n', text)
    
    return text.strip()

async def append_to_blog_data(filepath: str, slug: str, res: Dict, dict_name: str):
    # If the response was a parse error from the service, try to re-parse it here
    if res.get("title") == "Viral Article Generated (Parse Error)":
        content_str = res.get("content", "")
        # Try to find JSON block
        match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                res = parsed
            except:
                pass

    content = res.get("content", "")
    title = res.get("title", "")
    excerpt = res.get("excerpt", "")
    
    # Format properly
    full_text = f"\n# {title}\n\n{excerpt}\n\n{content}"
    full_text = aggressive_polish(full_text)
    
    # Read the file
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Find the last closing brace
    for i in range(len(lines) - 1, -1, -1):
        if "}" in lines[i]:
            # Found end of dict
            # Add entry before the closing brace
            new_entry = f'    "{slug}": """{full_text}""",\n'
            lines.insert(i, new_entry)
            break
            
    with open(filepath, 'w') as f:
        f.writelines(lines)

if __name__ == "__main__":
    # Generate batch of 30 to complete the expansion
    asyncio.run(generate_batch(batch_size=30))

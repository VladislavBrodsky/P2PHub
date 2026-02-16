import sys
import os
import asyncio
import json
from typing import Dict

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
# Load .env from backend directory FIRST
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.services.copywriter import ViralCopywriter
from app.core.config import settings

# topics for expansion (Slugs 20-39)
TOPICS = [
    {"topic": "The 2026 Financial Reset: Why CBDCs are the ultimate surveillance trap", "category": "global_trends"},
    {"topic": "The Death of SWIFT: Why international banking is a sinking ship", "category": "problem_solution"},
    {"topic": "The Privacy Premium: Why staying off-radar is the new luxury flex", "category": "brand_awareness"},
    {"topic": "Mathematics of Scale: Building a 10,000 Partner Network without working harder", "category": "hype_viral"},
    {"topic": "Digital Nomad 2.0: Managing global wealth from a beach in Bali", "category": "visionary"}, # visionary is handled by brand_awareness
    {"topic": "The Sovereign Mindset: Escaping the employee cage forever", "category": "brand_awareness"},
    {"topic": "Quantum-Safe Wealth: How to secure your digital empire for decades", "category": "global_trends"},
    {"topic": "Global Arbitrage: How smart money spends USD in emerging markets", "category": "problem_solution"},
    {"topic": "AI Referral Engines: Using Pintopay PRO tools to automate your growth", "category": "promotional"},
    {"topic": "The Legacy Trap: Why 401ks and Pensions are failing in the new economy", "category": "problem_solution"},
    {"topic": "Financial Ghosting: Moving through the economy without leaving a trace", "category": "brand_awareness"},
    {"topic": "The $100K Blueprint: How to hit Rank Elite in 90 days", "category": "hype_viral"},
    {"topic": "Crypto Cards vs Traditional Credit: The hidden costs of legacy plastic", "category": "problem_solution"},
    {"topic": "The Great Wealth Migration: Why capital is moving on-chain", "category": "global_trends"},
    {"topic": "Sovereign Individuals: The new class of global citizens", "category": "brand_awareness"},
    {"topic": "Automated Prosperity: Setting up your first passive crypto-fiat bridge", "category": "promotional"},
    {"topic": "The Inflation Hedge: Real-time settlement vs devaluing fiat", "category": "global_trends"},
    {"topic": "Network Effects: Why your network is your only real net worth", "category": "brand_awareness"},
    {"topic": "The Pintopay Manifest: Our vision for a world without financial boarders", "category": "brand_awareness"},
    {"topic": "Elite Networking: Accessing the rooms where the whales swim", "category": "hype_viral"},
    {"topic": "The Art of the P2P Swap: Mastering internal transfers for speed", "category": "entertainment"},
    {"topic": "Unbanked but Wealthy: The paradox of the modern crypto age", "category": "global_trends"},
    {"topic": "Exit Strategy: How to transition your business to a crypto-first model", "category": "problem_solution"},
    {"topic": "The Velocity of Money: Why fast transactions create more wealth", "category": "global_trends"},
    {"topic": "Digital Gold vs Digital Dollars: Balancing your Pintopay portfolio", "category": "brand_awareness"},
    {"topic": "Travel Light, Pay Global: The ultimate packing list for the sovereign nomad", "category": "entertainment"},
    {"topic": "Security Hygiene: Protecting your keys in a world of high-tech threats", "category": "problem_solution"},
    {"topic": "The Referral Flywheel: Turning 1 partner into 100 with viral magnets", "category": "hype_viral"},
    {"topic": "Future Proofing: What the next 5 years of FinTech look like", "category": "global_trends"},
    {"topic": "The Pintopay Lifestyle: Freedom is a tap away", "category": "brand_awareness"}
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
        
        # Adjust category name if needed (visionary -> brand_awareness)
        cat = item['category']
        if cat == "visionary": cat = "brand_awareness"
        
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
        
        # Sync Locales
        await sync_locales(slug, en_res, ru_res, cat)
        
        print(f"  Successfully saved and synced article {slug}!")

async def sync_locales(slug: str, en_res: Dict, ru_res: Dict, category: str):
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    locales = {
        "en": os.path.join(base_path, "frontend/src/locales/en.json"),
        "ru": os.path.join(base_path, "frontend/src/locales/ru.json")
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

async def append_to_blog_data(filepath: str, slug: str, res: Dict, dict_name: str):
    # If the response was a parse error from the service, try to re-parse it here
    if res.get("title") == "Viral Article Generated (Parse Error)":
        content_str = res.get("content", "")
        import re
        import json
        
        # Try to find JSON block
        match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if match:
            try:
                clean_json = match.group(0)
                # handle potential trailing commas or other minor issues
                parsed = json.loads(clean_json)
                res = parsed
            except:
                pass

    content = res.get("content", "")
    title = res.get("title", "")
    excerpt = res.get("excerpt", "")
    
    # Format properly
    full_text = f"\n# {title}\n\n{excerpt}\n\n{content}"
    
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
    # Generate first batch of 10 as requested
    asyncio.run(generate_batch(batch_size=10))

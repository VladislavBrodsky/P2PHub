
import asyncio
import os
import random
import sys

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner

# Enhanced Avatar Pool (30+ Unique + Generics)
ALL_AVATARS = [
    # New Cyber/Crypto Themed
    "/avatars/portrait_eth_boy.webp",
    "/avatars/portrait_btc_maxi.webp",
    "/avatars/portrait_defi_queen.webp",
    "/avatars/portrait_cyber_m_1.webp",
    "/avatars/portrait_cyber_f_1.webp",
    "/avatars/portrait_nomad_m_1.webp",
    "/avatars/portrait_studio_m_1.webp",
    "/avatars/portrait_studio_f_1.webp",
    
    # Previous Portraits
    "/avatars/portrait_ru_m_1.webp",
    "/avatars/portrait_jp_f_1.webp",
    "/avatars/portrait_kr_f_2.webp",
    "/avatars/portrait_br_f_2.webp",
    "/avatars/portrait_tr_m_1.webp",
    
    # Country Specific (High Quality)
    "/avatars/us_m_1.webp", "/avatars/us_f_1.webp",
    "/avatars/ca_m_1.webp", "/avatars/de_m_1.webp",
    "/avatars/es_m_1.webp", "/avatars/fr_f_1.webp",
    "/avatars/it_f_1.webp", "/avatars/ru_m_1.webp",
    "/avatars/br_f_1.webp", "/avatars/jp_f_1.webp",
    "/avatars/ae_f_1.webp", "/avatars/in_m_1.webp",
    "/avatars/ng_m_1.webp",

    # Generic Fallbacks (Lower Priority)
    "/avatars/m1.webp", "/avatars/m2.webp", "/avatars/m3.webp", "/avatars/m4.webp",
    "/avatars/f1.webp", "/avatars/f2.webp", "/avatars/f3.webp"
]

# Diverse Name Dataset (Crypto, Real, Slang) - 60+ Entries
NAMES_DATA = [
    # Top Tier (Crypto Legends & Whales)
    {"name": "Satoshi_Nakamoto", "type": "crypto"},
    {"name": "Vitalik_Fan", "type": "crypto"},
    {"name": "HODL_King", "type": "crypto"},
    {"name": "Moon_Walker", "type": "crypto"},
    {"name": "DeFi_Wizard", "type": "crypto"},
    {"name": "Alpha_Wolf", "type": "crypto"},
    {"name": "Diamond_Hands", "type": "crypto"},
    {"name": "Crypto_Ninja", "type": "crypto"},
    {"name": "Whale_Alert", "type": "crypto"},
    {"name": "Bull_Run_2026", "type": "crypto"},

    # International Real Names (Full)
    {"name": "Alexander Volkov", "type": "real", "lang": "ru"},
    {"name": "Sarah Jenkins", "type": "real", "lang": "en"},
    {"name": "Wei Chen", "type": "real", "lang": "cn"},
    {"name": "Sofia Rossi", "type": "real", "lang": "it"},
    {"name": "Ahmed Al-Fayed", "type": "real", "lang": "ae"},
    {"name": "Yuki Tanaka", "type": "real", "lang": "jp"},
    {"name": "Isabella Silva", "type": "real", "lang": "br"},
    {"name": "Lars Johansson", "type": "real", "lang": "se"},
    {"name": "Elena Petrova", "type": "real", "lang": "ru"},
    {"name": "Mateo Garcia", "type": "real", "lang": "es"},
    {"name": "Chloe Dubois", "type": "real", "lang": "fr"},
    {"name": "Hiroshi Sato", "type": "real", "lang": "jp"},
    {"name": "Olivia Smith", "type": "real", "lang": "en"},
    {"name": "Liam Connor", "type": "real", "lang": "en"},
    {"name": "Fatima Khan", "type": "real", "lang": "pk"},

    # Slang / Gamer / Anon
    {"name": "Pixelprefix", "type": "slang"},
    {"name": "Glitch_01", "type": "slang"},
    {"name": "ShadowCoder", "type": "slang"},
    {"name": "Neon_Rider", "type": "slang"},
    {"name": "Bit_Maxi", "type": "slang"},
    {"name": "Eth_Goddess", "type": "slang"},
    {"name": "Solana_Surfer", "type": "slang"},
    {"name": "Web3_Native", "type": "slang"},
    {"name": "Meta_Traveler", "type": "slang"},
    {"name": "Zero_Cool", "type": "slang"},
    
    # Native Scripts (For authenticity)
    {"name": "Дмитрий", "type": "native", "lang": "ru"},
    {"name": "田中 結衣", "type": "native", "lang": "jp"},
    {"name": "佐藤 健三", "type": "native", "lang": "jp"},
    {"name": "김민준", "type": "native", "lang": "kr"},
    {"name": "Anastasia", "type": "real", "lang": "ru"},
    {"name": "Maxim", "type": "real", "lang": "ru"},
    
    # More Filler
    {"name": "Trader_X", "type": "crypto"},
    {"name": "Profit_Seeker", "type": "crypto"},
    {"name": "Chart_Master", "type": "crypto"},
    {"name": "Stop_Loss_Hunter", "type": "crypto"},
    {"name": "Green_Candle", "type": "crypto"},
    {"name": "FUD_Buster", "type": "crypto"},
    {"name": "Bag_Holder", "type": "crypto"},
    {"name": "Mint_Condition", "type": "crypto"},
    {"name": "Gas_Fee_Hater", "type": "crypto"},
    {"name": "Layer2_Enjoyer", "type": "crypto"}
]

FLAGS = {
    "RU": "🇷🇺", "US": "🇺🇸", "GB": "🇬🇧", "JP": "🇯🇵",
    "CN": "🇨🇳", "IN": "🇮🇳", "BR": "🇧🇷", "NG": "🇳🇬",
    "DE": "🇩🇪", "FR": "🇫🇷", "AE": "🇦🇪", "TR": "🇹🇷",
    "KR": "🇰🇷", "IT": "🇮🇹", "ES": "🇪🇸", "CA": "🇨🇦"
}

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL is not set!")
        return
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get top 60 partners by XP to apply our new curated list
        statement = select(Partner).order_by(Partner.xp.desc()).limit(60)
        results = await session.exec(statement)
        partners = results.all()
        
        print(f"🔄 Updating {len(partners)} partners with unique identities...")
        
        # Determine "premium" avatars (The entire unique list)
        premium_avatars = list(ALL_AVATARS) 
        random.shuffle(premium_avatars)
        
        # Explicit fallback pool for users beyond the unique count
        generic_avatars = [
            "/avatars/m1.webp", "/avatars/m2.webp", "/avatars/m3.webp", "/avatars/m4.webp",
            "/avatars/f1.webp", "/avatars/f2.webp", "/avatars/f3.webp"
        ]
        
        for i, p in enumerate(partners):
            # 1. Assign Name
            # Pick a name record based on index to ensure we use our good list first
            if i < len(NAMES_DATA):
                name_record = NAMES_DATA[i]
            else:
                # Fallback to random choice if we have more users than data
                name_record = random.choice(NAMES_DATA)
            
            # Apply Name
            final_name = name_record["name"]
            
            # Add Flag ONLY for Top 3
            if i < 3:
                # Top 3 Flags
                flag = "🏆"
                if i == 0: flag = "🥇"
                elif i == 1: flag = "🥈"
                elif i == 2: flag = "🥉"
                final_name = f"{flag} {final_name}"
            
            p.first_name = final_name
            p.last_name = "" # Clear last names for cleaner look as many are single name or nicknames
            p.username = final_name.replace(" ", "_").lower().replace("🏆_", "") + ("_" + str(random.randint(10,99)) if random.random() > 0.5 else "")
            
            # 2. Assign Avatar (Strict Uniqueness Logic)
            selected_avatar = ""
            
            if i < len(premium_avatars):
                # Unique assignment from premium pool
                selected_avatar = premium_avatars[i]
            else:
                # Reuse generic pool sequentially
                idx = (i - len(premium_avatars)) % len(generic_avatars)
                selected_avatar = generic_avatars[idx]

            p.photo_url = selected_avatar
            p.photo_file_id = None # Clear telegram file ID to force URL usage
            
            session.add(p)
            print(f"✅ User #{i+1}: {final_name} -> {selected_avatar}")

        await session.commit()
        print("🚀 Successfully globalized and beautified user profiles!")

if __name__ == "__main__":
    asyncio.run(main())

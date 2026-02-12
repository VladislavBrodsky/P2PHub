
import asyncio
import os
import requests
from io import BytesIO
from PIL import Image
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

# Update paths for the new generated images
IMAGE_MAPPING = {
    2: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_2_hasan_1770920464475.png",
    3: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_3_larisa_1770920485145.png",
    4: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_4_alex_v2_1770920504934.png",
    5: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_5_sarah_v2_1770920520353.png",
    6: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_6_dmitry_v2_1770920534529.png",
    8: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_8_maxim_v3_1770920569412.png",
    10: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_10_v2_1770920548628.png",
    11: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_11_ali_v2_1770920583204.png",
    13: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_13_olga_v2_1770920597714.png",
    14: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_14_ashley_v2_1770920618546.png",
    16: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_16_artur_v2_1770920632365.png",
    22: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_22_v2_1770920659980.png",
    30: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_crypto_30_v3_1770920684142.png"
}

# New specific photo seeds for 40, 41, 42, 46, 47, 48 (Pravatar IDs that match gender)
NEW_SEEDS = {
    40: 15, # Female
    41: 28, # Female
    42: 32, # Male
    46: 45, # Female
    47: 48, # Female
    48: 52  # Male
}

AVATARS_DIR = "app_images/avatars"
PROD_BASE_URL = "https://p2phub-production.up.railway.app"

async def process_images():
    # 1. Process custom high-res ones
    for avatar_idx, source_path in IMAGE_MAPPING.items():
        if not os.path.exists(source_path):
            print(f"⚠️ Source missing: {source_path}")
            continue
        
        target_filename = f"avatar_{avatar_idx}.webp"
        target_path = os.path.join(AVATARS_DIR, target_filename)
        
        try:
            img = Image.open(source_path)
            img.save(target_path, "WEBP", quality=80, method=6)
            print(f"✅ Processed avatar_{avatar_idx}.webp")
        except Exception as e:
            print(f"❌ Error processing {avatar_idx}: {e}")

    # 2. Download missing ones from Pravatar seeds
    for avatar_idx, seed in NEW_SEEDS.items():
        target_filename = f"avatar_{avatar_idx}.webp"
        target_path = os.path.join(AVATARS_DIR, target_filename)
        
        try:
            response = requests.get(f"https://i.pravatar.cc/300?u={seed}", timeout=10)
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content))
                img.save(target_path, "WEBP", quality=80, method=6)
                print(f"✅ Downloaded avatar_{avatar_idx}.webp (Seed {seed})")
        except Exception as e:
            print(f"❌ Error downloading {avatar_idx}: {e}")

async def update_db():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Fix existing ones with avatar_N tags
        res = await session.exec(select(Partner))
        partners = res.all()
        
        updated_count = 0
        for p in partners:
            if p.photo_url and "avatar_" in p.photo_url:
                try:
                    parts = p.photo_url.split("avatar_")
                    idx_str = parts[-1].split(".")[0]
                    avatar_idx = int(idx_str)
                    
                    if avatar_idx == 11:
                        p.first_name = "Ali"
                        p.username = "ali_web3_king"
                    elif avatar_idx == 14:
                        p.first_name = "Ashley"
                        p.last_name = "O'relis"
                        p.username = "ashley_orelis"
                    
                    p.photo_url = f"{PROD_BASE_URL}/images/avatars/avatar_{avatar_idx}.webp"
                    session.add(p)
                    updated_count += 1
                except: continue
        
        # 2. Assign the NEW accounts (30, 40 etc) to users who have None
        # Mapping specific users from my dump
        USERS_TO_UPDATE = {
            "SuperhumanRyzn": 30, # Ryan Conley (Web3)
            "PAO_web3": 40,       # Paola (Female)
            "alina_demirci": 41,  # Alina (Female)
            "Ragvaloddd": 42,     # Dmitriy (Male)
            "OVS27": 46,          # Olga (Female)
            "sunnyuae": 47,       # sunny (Female)
            "Bestpetrol326": 48   # Вадим (Male)
        }
        
        for username, avatar_idx in USERS_TO_UPDATE.items():
            stmt = select(Partner).where(Partner.username == username)
            u = (await session.exec(stmt)).first()
            if u:
                u.photo_url = f"{PROD_BASE_URL}/images/avatars/avatar_{avatar_idx}.webp"
                session.add(u)
                updated_count += 1
                print(f"🎯 Assigned avatar_{avatar_idx} to {username}")

        await session.commit()
        print(f"✅ DB updated! {updated_count} profiles polished.")

async def main():
    await process_images()
    await update_db()

if __name__ == "__main__":
    asyncio.run(main())

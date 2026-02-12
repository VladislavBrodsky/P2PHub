
import asyncio
import os
from PIL import Image
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

# #comment Mapping top leaders to their custom-generated photorealistic matching avatars.
LEADER_IMAGE_MAPPING = {
    181: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_male_1_vitaliy_v2_1770921270673.png",
    183: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_male_2_den_1770921159651.png",
    187: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_male_3_stas_1770921172086.png",
    179: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_male_4_nikita_1770921186646.png",
    175: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_male_5_artur_1770921201955.png",
    180: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_female_6_anna_1770921285643.png",
    169: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_m_4_alex_v2_1770920504934.png", # Andrey
    176: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_female_7_svetlana_1770921299851.png",
    188: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/avatar_f_5_sarah_v2_1770920520353.png", # Elena
    174: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_female_10_marina_1770921312958.png",
    164: "/Users/grandmaestro/.gemini/antigravity/brain/d8b9bfac-15cf-4d2c-8e54-0e01ec45090f/leader_female_11_sarah_v2_1770921326416.png"
}

AVATARS_DIR = "app_images/avatars"
PROD_BASE_URL = "https://p2phub-production.up.railway.app"

async def process_and_update():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for p_id, source_path in LEADER_IMAGE_MAPPING.items():
            if not os.path.exists(source_path):
                print(f"⚠️ Source missing for ID {p_id}: {source_path}")
                continue
            
            target_filename = f"leader_{p_id}.webp"
            target_path = os.path.join(AVATARS_DIR, target_filename)
            
            try:
                # 1. Process Image
                img = Image.open(source_path)
                img.save(target_path, "WEBP", quality=85, method=6) # Slightly higher quality for top leaders
                
                # 2. Update Partner in DB
                stmt = select(Partner).where(Partner.id == p_id)
                p = (await session.exec(stmt)).first()
                if p:
                    p.photo_url = f"{PROD_BASE_URL}/images/avatars/{target_filename}"
                    p.photo_file_id = None # Clear file_id to force URL use
                    session.add(p)
                    print(f"✅ Updated Leader {p_id} ({p.first_name}) with new photo.")
                else:
                    print(f"⚠️ Partner {p_id} not found in DB.")
            except Exception as e:
                print(f"❌ Error processing {p_id}: {e}")

        await session.commit()
        print("🎉 All top leader profiles successfully polished and gender-aligned!")

if __name__ == "__main__":
    asyncio.run(process_and_update())

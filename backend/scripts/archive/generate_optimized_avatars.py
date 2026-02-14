
import asyncio
import os
import requests
from io import BytesIO
from PIL import Image
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

# Configuration
BASE_URL = "https://p2phub-production.up.railway.app"
AVATARS_DIR = "app_images/avatars"
NUM_AVATARS = 50 # Let's generate a healthy pool

async def generate_avatars():
    if not os.path.exists(AVATARS_DIR):
        os.makedirs(AVATARS_DIR)
    
    print(f"🚀 Generating {NUM_AVATARS} unique photorealistic avatars...")
    
    avatar_paths = []
    for i in range(1, NUM_AVATARS + 1):
        filename = f"avatar_{i}.webp"
        filepath = os.path.join(AVATARS_DIR, filename)
        
        if os.path.exists(filepath):
            avatar_paths.append(f"/images/avatars/{filename}")
            continue
            
        try:
            # Fetch photorealistic avatar from Pravatar (Seed ensures uniqueness)
            # pravatar.cc is a well-known service for realistic profile pics
            response = requests.get(f"https://i.pravatar.cc/300?u={i}", timeout=10)
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content))
                # Optimize and convert to WebP
                img.save(filepath, "WEBP", quality=80, method=6)
                avatar_paths.append(f"/images/avatars/{filename}")
                print(f"✅ Saved {filename}")
            else:
                print(f"❌ Failed to fetch avatar {i}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error generating avatar {i}: {e}")
            
    return avatar_paths

async def update_users(avatar_paths):
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find users without photos
        statement = select(Partner).where(
            (Partner.photo_url.is_(None)) & 
            (Partner.photo_file_id.is_(None))
        )
        result = await session.exec(statement)
        users = result.all()
        
        if not users:
            print("✨ All users already have profiles! No updates needed.")
            return

        print(f"🔄 Updating {len(users)} users with new avatars...")
        
        for idx, user in enumerate(users):
            # Cycle through the unique avatars
            local_path = avatar_paths[idx % len(avatar_paths)]
            # We use absolute URL for frontend compatibility
            user.photo_url = f"{BASE_URL}{local_path}"
            session.add(user)
            
        await session.commit()
        print(f"🎉 Successfully updated {len(users)} users!")

async def main():
    paths = await generate_avatars()
    if paths:
        await update_users(paths)
    else:
        print("❌ No avatars generated, skipping DB update.")

if __name__ == "__main__":
    asyncio.run(main())


import asyncio
import os
import sys

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Load .env manually
env_path = os.path.join(parent_dir, ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                try:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip("'").strip('"')
                except ValueError:
                    pass

async def inspect_top_partners():
    from sqlmodel import select

    from app.models.partner import Partner, async_session_maker
    from app.services.redis_service import redis_service
    
    print("🔍 INSPECTING TOP PARTNERS PHOTO STATUS")
    
    async with async_session_maker() as session:
        statement = select(Partner).order_by(Partner.xp.desc()).limit(10)
        result = await session.exec(statement)
        partners = result.all()
        
        for i, p in enumerate(partners, 1):
            print(f"{i}. {p.first_name} {p.last_name} (@{p.username})")
            print(f"   XP: {p.xp}")
            print(f"   Photo File ID: {p.photo_file_id}")
            print(f"   Photo URL: {p.photo_url}")
            
            if p.photo_file_id:
                try:
                    cache_key = f"tg_photo_bin_v1:{p.photo_file_id}"
                    cached = await redis_service.get_bytes(cache_key)
                    print(f"   Cache Status: {'✅ HIT' if cached else '❌ MISS'}")
                except Exception as e:
                    print(f"   Cache Status: ⚠️ Error (Redis down?): {e}")
            else:
                print("   Cache Status: N/A (No File ID)")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(inspect_top_partners())

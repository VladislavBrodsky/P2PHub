import asyncio
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.redis_service import redis_service

async def check():
    keys = await redis_service.client.keys('partner:profile:v5:*')
    print(f"Keys left (v5): {len(keys)}")
    
    old_keys = await redis_service.client.keys('partner:profile:[^v]*')
    print(f"Old keys left: {len(old_keys)}")

if __name__ == "__main__":
    asyncio.run(check())

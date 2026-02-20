import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
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

from app.services.redis_service import redis_service


async def main():
    try:
        await redis_service.client.delete("partners:top")
        print("Cleared partners:top")
        
        # Also clear any orbit caches just in case
        for i in range(10): # window numbers can be current
            await redis_service.client.delete(f"partners:orbit:v3:{i}")
            
        print("Cleared caches.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

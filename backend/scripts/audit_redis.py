import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.getcwd())

from app.services.redis_service import redis_service

async def audit_redis():
    # Attempt to connect using the proxy URL
    # (The service uses settings.REDIS_URL internally)
    
    print("\n--- REDIS CACHE AUDIT ---")
    
    # List some keys
    try:
        keys = await redis_service.client.keys("partner:profile:v5:*")
        print(f"Found {len(keys)} profile cache keys (v5).")
        
        for key in keys[:5]:
            val = await redis_service.get_json(key)
            print(f"\nKey: {key}")
            if val:
                print(f"  User: {val.get('username')} | ID: {val.get('id')} | Network: {val.get('network_size_real')}")
                # Check for suspect empty/null values
                if not val.get('username') and not val.get('first_name'):
                    print("  ⚠️ WARNING: Profile data looks EMPTY!")
            else:
                print("  (Empty or invalid JSON)")
                
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(audit_redis())

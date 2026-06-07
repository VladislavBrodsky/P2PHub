import asyncio
import os
import json
import redis.asyncio as redis

async def check():
    redis_url = "redis://default:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@shuttle.proxy.rlwy.net:58748"
    client = redis.from_url(redis_url, decode_responses=True, socket_timeout=10.0)
    
    print("🔍 Scanning Redis keys matching '*716720099*'...")
    keys = []
    async for key in client.scan_iter(match="*716720099*"):
        keys.append(key)
        
    print(f"Found keys: {keys}")
    for k in keys:
        val = await client.get(k)
        print(f"\nKey: {k}")
        try:
            parsed = json.loads(val)
            print(json.dumps(parsed, indent=2))
        except Exception:
            print(f"Raw: {val}")
            
    await client.aclose()

if __name__ == "__main__":
    asyncio.run(check())

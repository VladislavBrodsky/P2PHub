import asyncio
import redis.asyncio as redis

async def run():
    redis_url = "redis://default:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@shuttle.proxy.rlwy.net:58748"
    client = redis.from_url(redis_url, decode_responses=True, socket_timeout=10.0)
    
    tg_id = "716720099"
    partner_id = "1"
    
    keys = [
        f"partner:profile:v7:{tg_id}",
        f"partner:profile:v6:{tg_id}",
        f"partner:profile:v5:{tg_id}",
        f"partner:profile:v4:{tg_id}",
        f"partner:profile:{tg_id}",
        f"profile_cache_v5:{tg_id}",
        f"profile_cache_v5:{partner_id}",
        f"profile_cache_v3:{partner_id}"
    ]
    
    print("🗑 Deleting keys from Redis...")
    for key in keys:
        deleted = await client.delete(key)
        if deleted:
            print(f"✅ Deleted Key: {key}")
        else:
            print(f"❌ Key not found/already deleted: {key}")
            
    await client.aclose()

if __name__ == "__main__":
    asyncio.run(run())

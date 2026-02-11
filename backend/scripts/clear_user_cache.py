import asyncio
import os
import sys

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.redis_service import redis_service


async def clear_cache(tg_id: str, partner_id: int):
    # Keys used in partner_service.py and partner.py
    keys = [
        f"partner:profile:{tg_id}",
        f"ref_tree_stats:{partner_id}",
    ]
    # Also level members if any
    for i in range(1, 10):
        keys.append(f"ref_tree_members:{partner_id}:{i}")

    for k in keys:
        res = await redis_service.client.delete(k)
        print(f"🧹 Deleted {k}: {res}")

if __name__ == "__main__":
    # From previous debug, TG=716720099 is ID=1
    tg_id = "716720099"
    partner_id = 1
    asyncio.run(clear_cache(tg_id, partner_id))

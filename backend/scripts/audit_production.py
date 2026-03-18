import asyncio
import os
import sys
import json

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.partner import Partner, get_session
from app.services.redis_service import redis_service
from sqlmodel import select

async def audit():
    print(f"--- STARTING AUDIT ---")
    print(f"DATABASE_URL (mask): {settings.DATABASE_URL[:20]}...")
    print(f"REDIS_URL (mask): {settings.REDIS_URL[:20]}...")
    
    admin_ids = ["537873096", "716720099"]
    
    try:
        async for session in get_session():
            for tid in admin_ids:
                print(f"\nChecking TG ID: {tid}")
                
                # 1. DB CHECK
                stmt = select(Partner).where(Partner.telegram_id == tid)
                res = await session.exec(stmt)
                p = res.first()
                if p:
                    print(f"  [DB] FOUND: ID={p.id}, PRO={p.is_pro}, Plan={p.subscription_plan}, XP={p.xp}, Balance={p.balance}")
                else:
                    print(f"  [DB] NOT FOUND")
                
                # 2. REDIS CHECK
                cache_key = f"partner:profile:{tid}"
                cached = await redis_service.get_json(cache_key)
                if cached:
                    print(f"  [REDIS] FOUND: PRO={cached.get('is_pro')}, Plan={cached.get('subscription_plan')}, XP={cached.get('xp')}, Balance={cached.get('balance')}")
                    if "network_size_real" in cached:
                        print(f"  [REDIS] network_size_real={cached.get('network_size_real')}")
                else:
                    print(f"  [REDIS] NOT FOUND (MISSING CACHE)")
            
            # 3. GLOBAL STATS
            from sqlalchemy import func
            stmt_count = select(func.count()).select_from(Partner)
            res_total = await session.execute(stmt_count)
            total = res_total.scalar()
            print(f"\n[DB] Total Partners: {total}")
            
            # 4. LEADERBOARD CHECK (Redis)
            top_3 = await redis_service.client.zrevrange("leaderboard:xp", 0, 2, withscores=True)
            print(f"[REDIS] Top 3 on Leaderboard: {top_3}")
            
            break
    except Exception as e:
        print(f"❌ AUDIT FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(audit())

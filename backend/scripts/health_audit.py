import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

PROD_URL = "https://p2phub-production.up.railway.app"
FRONTEND_URL = "https://p2phub-frontend-production.up.railway.app"

ok = "✅"
warn = "⚠️ "
fail = "❌"

async def check_database(session):
    print("\n━━━ 1. DATABASE (PostgreSQL) ━━━")
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM partner"))
        count = r.scalar()
        print(f"  {ok} Connection: ONLINE")
        print(f"  {ok} Partners: {count}")
        
        r2 = await session.execute(text("SELECT COUNT(*) FROM partner WHERE referrer_id IS NOT NULL"))
        linked = r2.scalar()
        print(f"  {ok} Partners with referrer: {linked}")
        
        r3 = await session.execute(text("SELECT COUNT(*) FROM partner WHERE path IS NULL AND referrer_id IS NOT NULL"))
        broken = r3.scalar()
        if broken > 0:
            print(f"  {fail} Partners with broken paths (no path but has referrer): {broken}")
        else:
            print(f"  {ok} All materialized paths: INTACT")
            
        r4 = await session.execute(text("SELECT COUNT(*) FROM earning"))
        earnings = r4.scalar()
        print(f"  {ok} Earning records: {earnings}")
        
        r5 = await session.execute(text("SELECT COUNT(*) FROM xptransaction"))
        xp_tx = r5.scalar()
        print(f"  {ok} XP Transaction records: {xp_tx}")
        
    except Exception as e:
        print(f"  {fail} DATABASE ERROR: {e}")

async def check_redis():
    print("\n━━━ 2. REDIS (Cache) ━━━")
    try:
        from app.services.redis_service import redis_service
        await redis_service.client.ping()
        print(f"  {ok} Connection: ONLINE")
        
        # Count keys to see if things are being cached
        all_keys = await redis_service.client.dbsize()
        profile_keys = len(await redis_service.client.keys("partner:profile:*"))
        tree_keys = len(await redis_service.client.keys("ref_tree_stats_v2:*"))
        
        print(f"  {ok} Total Redis keys: {all_keys}")
        print(f"  {ok} Profile cache entries: {profile_keys}")
        print(f"  {ok} Tree stats cache entries: {tree_keys}")
    except Exception as e:
        print(f"  {fail} REDIS ERROR: {e}")

async def check_api():
    print("\n━━━ 3. BACKEND API (Railway) ━━━")
    async with httpx.AsyncClient(timeout=10) as client:
        # Health check
        try:
            r = await client.get(f"{PROD_URL}/health")
            print(f"  {ok} /health: HTTP {r.status_code}")
        except Exception as e:
            print(f"  {fail} /health: {e}")

        # Docs (verifies app is running and routing works)
        try:
            r = await client.get(f"{PROD_URL}/docs")
            print(f"  {ok} /docs: HTTP {r.status_code}")
        except Exception as e:
            print(f"  {fail} /docs: {e}")
            
        # Webhook endpoint exists
        try:
            r = await client.post(f"{PROD_URL}/api/bot/webhook", json={})
            status = "OK" if r.status_code in [200, 400, 401, 422] else f"UNEXPECTED {r.status_code}"
            symbol = ok if r.status_code in [200, 400, 401, 422] else fail
            print(f"  {symbol} /api/bot/webhook: HTTP {r.status_code} ({status})")
        except Exception as e:
            print(f"  {fail} /api/bot/webhook: {e}")

async def check_frontend():
    print("\n━━━ 4. FRONTEND (Railway) ━━━")
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(FRONTEND_URL)
            print(f"  {ok} Frontend: HTTP {r.status_code}")
        except Exception as e:
            print(f"  {fail} Frontend: {e}")

async def check_top_users(session):
    print("\n━━━ 5. TOP USER STATS (Data Integrity) ━━━")
    from app.services.analytics_service import get_referral_tree_stats
    
    res = await session.execute(text("SELECT id, username, referral_count, balance, xp FROM partner ORDER BY referral_count DESC LIMIT 3"))
    top = res.fetchall()
    for u in top:
        tree_stats = await get_referral_tree_stats(session, u.id)
        network_size = sum(tree_stats.values())
        status = ok if network_size > 0 or u.referral_count == 0 else fail
        print(f"  {status} {u.username}: DB refs={u.referral_count} | API network={network_size} | balance=${u.balance:.2f} | XP={u.xp:.0f}")

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print("=" * 50)
    print("  P2PHUB FULL SYSTEM HEALTH AUDIT")
    print("=" * 50)
    
    async with async_session() as session:
        await check_database(session)
        await check_redis()
        await check_api()
        await check_frontend()
        await check_top_users(session)
    
    print("\n" + "=" * 50)
    print("  AUDIT COMPLETE")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())

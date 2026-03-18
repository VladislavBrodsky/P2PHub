import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Search for the user USLINCOLN
        query = text("SELECT id, telegram_id, username, balance, xp, path, depth, referral_count, created_at FROM partner WHERE username ILIKE '%USLINCOLN%'")
        res = await session.execute(query)
        users = res.fetchall()
        
        print(f"Found {len(users)} users matching USLINCOLN:")
        for u in users:
            print(f"ID: {u.id} | TG_ID: {u.telegram_id} | Username: {u.username}")
            print(f"  Balance: {u.balance} | XP: {u.xp} | RefCount: {u.referral_count}")
            print(f"  Path: {u.path} | Depth: {u.depth} | Created: {u.created_at}")
            
            # Count actual children in DB
            child_query = text("SELECT count(*) FROM partner WHERE referrer_id = :id")
            c_res = await session.execute(child_query, {"id": u.id})
            child_count = c_res.scalar()
            print(f"  Actual Direct Referrals in DB (referrer_id={u.id}): {child_count}")
            
            # Count total network size in DB
            net_query = text("SELECT count(*) FROM partner WHERE path LIKE :path OR path = :exact")
            search_path = f"{u.path or ''}.{u.id}".lstrip(".")
            n_res = await session.execute(net_query, {"path": f"{search_path}.%", "exact": search_path})
            net_count = n_res.scalar()
            print(f"  Actual Total Network in DB (path based): {net_count}")
            print("-" * 40)

        # If we didn't find them by username, let's find the top users by network size to see who the "big" account is
        print("\nTop 5 Users by direct referrals:")
        top_res = await session.execute(text("SELECT id, username, referral_count, telegram_id FROM partner ORDER BY referral_count DESC LIMIT 5"))
        for t in top_res.fetchall():
            print(f"  ID: {t.id} | Username: {t.username} | Refs: {t.referral_count}")

if __name__ == "__main__":
    asyncio.run(main())

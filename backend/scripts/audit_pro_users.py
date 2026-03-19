import sys
import os
import asyncio
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_path)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def audit():
    url = settings.async_database_url
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        # Audit PRO users
        pro_res = await conn.execute(text("SELECT count(*) FROM partner WHERE is_pro = true"))
        pro_count = pro_res.scalar()
        
        # Audit PRO+ users
        pro_plus_res = await conn.execute(text("SELECT count(*) FROM partner WHERE subscription_plan LIKE 'PRO_PLUS%'"))
        pro_plus_count = pro_plus_res.scalar()
        
        # Total users
        total_res = await conn.execute(text("SELECT count(*) FROM partner"))
        total_count = total_res.scalar()
        
        print(f"Total Partners: {total_count}")
        print(f"PRO Partners (is_pro=true): {pro_count}")
        print(f"PRO+ Partners (by plan): {pro_plus_count}")
        
        # Show recent PRO users
        print("\nAdmin Users Status:")
        admin_res = await conn.execute(text("SELECT id, telegram_id, username, subscription_plan, is_pro, pro_expires_at FROM partner WHERE telegram_id IN ('716720099', '537873096')"))
        for row in admin_res:
            print(f"ID: {row[0]}, TG: {row[1]}, User: {row[2]}, Plan: {row[3]}, is_pro: {row[4]}, Expires: {row[5]}")

        print("\nRecent PRO Users:")
        recent_res = await conn.execute(text("SELECT id, telegram_id, username, subscription_plan, is_pro FROM partner WHERE is_pro = true ORDER BY created_at DESC LIMIT 5"))
        for row in recent_res:
                print(f"ID: {row[0]}, TG: {row[1]}, User: {row[2]}, Plan: {row[3]}, is_pro: {row[4]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(audit())

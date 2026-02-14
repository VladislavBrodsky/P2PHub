import asyncio
import os
from aiogram import Bot
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def inspect():
    token = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    bot = Bot(token=token)
    me = await bot.get_me()
    print(f"BOT_ME: @{me.username} ({me.id})")
    await bot.session.close()

    db_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        # Check recent registrations
        res = await conn.execute(text("SELECT id, telegram_id, username, first_name, referrer_id, referral_code, created_at FROM partner ORDER BY created_at DESC LIMIT 10"))
        print("\nRECENT PARTNERS:")
        for row in res:
            print(f"ID: {row.id}, TG: {row.telegram_id}, User: {row.username}, RefBy: {row.referrer_id}, Code: {row.referral_code}, Joined: {row.created_at}")

        # Check if anyone refers back to uslincoln (ID 12 or whatever)
        # First find uslincoln's ID
        res_us = await conn.execute(text("SELECT id FROM partner WHERE username = 'uslincoln'"))
        us_id = res_us.scalar()
        print(f"\nUSLINCOLN_ID: {us_id}")

        if us_id:
            res_refs = await conn.execute(text("SELECT COUNT(*) FROM partner WHERE referrer_id = :uid"), {"uid": us_id})
            print(f"TOTAL REFERRALS FOR @uslincoln: {res_refs.scalar()}")
            
            res_list = await conn.execute(text("SELECT username, telegram_id, created_at FROM partner WHERE referrer_id = :uid ORDER BY created_at DESC"), {"uid": us_id})
            print("REFERRAL LIST:")
            for row in res_list:
                print(f"- {row.username or row.telegram_id} at {row.created_at}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(inspect())

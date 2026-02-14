import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.services.referral_service import process_referral_logic
from app.models.partner import engine

async def catch_up():
    print("🚀 Starting catch-up for pending referrals for @uslincoln...")
    
    # uslincoln's ID is 1 from previous logs
    us_id = 1
    
    db_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    temp_engine = create_async_engine(db_url)
    
    async with temp_engine.connect() as conn:
        # Tables names are lowercase in Postgres: 'xptransaction'
        pending_stmt = text("""
            SELECT p.id, p.username, p.telegram_id 
            FROM partner p
            LEFT JOIN xptransaction xt ON (xt.reference_id = CAST(p.id AS VARCHAR) AND xt.partner_id = :us_id AND xt.type = 'REFERRAL_L1')
            WHERE p.referrer_id = :us_id AND xt.id IS NULL
        """)
        
        res_pending = await conn.execute(pending_stmt, {"us_id": us_id})
        pending_partners = res_pending.all()
        
        print(f"🔍 Found {len(pending_partners)} pending direct referrals for uslincoln.")
        
        for p_id, p_username, p_tg in pending_partners:
            # We skip 'audit_tester' (197) and 'VALERWN' (198) if needed, but the logic handles idempotency
            print(f"⚡ Processing referral logic for {p_username or p_tg} (ID: {p_id})...")
            try:
                await process_referral_logic(p_id)
                print(f"✅ Success for partner {p_id}")
            except Exception as e:
                print(f"❌ Error processing partner {p_id}: {e}")

    await temp_engine.dispose()
    print("🏁 Catch-up sequence complete.")

if __name__ == "__main__":
    os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    asyncio.run(catch_up())

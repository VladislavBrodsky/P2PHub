import asyncio
from sqlmodel import select
from app.models.partner import Partner, get_session
from app.core.config import settings

async def check_db():
    print(f"Connecting to: {settings.async_database_url}")
    try:
        async for session in get_session():
            # 1. Check connectivity
            result = await session.exec(select(Partner).limit(1))
            partner = result.first()
            if partner:
                print(f"✅ Database connection successful. Found at least one partner: {partner.username}")
            else:
                print("✅ Database connection successful, but no partners found.")

            # 2. Find uslincoln
            # Searching by username specifically
            stmt = select(Partner).where(Partner.username == 'uslincoln')
            res = await session.exec(stmt)
            user = res.first()
            if user:
                print(f"✅ Found user @uslincoln: ID={user.id}, TG_ID={user.telegram_id}, XP={user.xp}")
            else:
                # Also try searching for any user with lincoln in name just in case
                stmt2 = select(Partner).where(Partner.username.ilike('%lincoln%'))
                res2 = await session.exec(stmt2)
                user2 = res2.first()
                if user2:
                    print(f"ℹ️ Found potential match: @{user2.username} (TG_ID={user2.telegram_id})")
                else:
                    print("❌ User @uslincoln not found in database.")
            
            break
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())

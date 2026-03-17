import asyncio
import sys
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, UTC

sys.path.append("/Users/grandmaestro/Developer/P2PHub/backend")
from app.models.partner import Partner

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def grant_pro_plus(username: str):
    if username.startswith('@'):
        username = username[1:]
        
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username.ilike(f"%{username}%"))
        result = await session.exec(stmt)
        partner = result.first()
        
        if not partner:
            print(f"User with username {username} not found.")
            return

        print(f"Found user: {partner.username} (Telegram ID: {partner.telegram_id})")
        print(f"Granting PRO+ (LIFETIME)...")
        
        partner.is_pro = True
        partner.subscription_plan = "PRO_PLUS_LIFETIME"
        partner.pro_purchased_at = datetime.now(UTC).replace(tzinfo=None)
        partner.pro_started_at = datetime.now(UTC).replace(tzinfo=None)
        partner.pro_notification_seen = False # Ensure they see the notification if any
        # PRO+ usually has more tokens or things, but we'll stick to the core fields for now
        partner.pro_tokens = getattr(partner, 'pro_tokens', 0) + 5000
        
        session.add(partner)
        await session.commit()
        print("PRO+ granted successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python grant_pro_plus_by_username.py <username>")
        sys.exit(1)
    asyncio.run(grant_pro_plus(sys.argv[1]))

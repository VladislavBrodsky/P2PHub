import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import os

# Manually read .env
try:
    with open(".env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                os.environ[key] = value
except Exception:
    pass

# Hardcode env vars for script (fallback)
if "BOT_TOKEN" not in os.environ:
    os.environ["BOT_TOKEN"] = "8245884329:AAEy0UaI2zGuwTHdkRXHa1f-kzhY6t1_lG4"
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")

from app.models.partner import Partner


async def main():
    try:
        # We need to create a new engine because settings might use the wrong URL
        # But here we import it AFTER setting env vars (hopefully).

        from app.core.config import settings
        # Ensure correct driver is used
        db_url = os.environ["DATABASE_URL"]
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        settings.DATABASE_URL = db_url

        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.orm import sessionmaker
        from sqlmodel import delete, select
        from sqlmodel.ext.asyncio.session import AsyncSession

        engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            # Delete users with ui-avatars photo_url
            stmt = select(Partner).where(Partner.photo_url.like("%ui-avatars.com%"))
            result = await session.exec(stmt)
            fake_users = result.all()

            print(f"Found {len(fake_users)} fake users to delete.")
            for user in fake_users:
                print(f"Deleting {user.username} (ID: {user.id})")
                # Handle circular dependency and child records
                user.last_transaction_id = None
                session.add(user)
                await session.flush()
                
                # Delete child records
                from app.models.partner import (
                    Earning,
                    PartnerTask,
                    SocialPost,
                    ViralGeneration,
                    XPTransaction,
                )
                from app.models.transaction import PartnerTransaction
                
                await session.execute(delete(PartnerTransaction).where(PartnerTransaction.partner_id == user.id))
                await session.execute(delete(XPTransaction).where(XPTransaction.partner_id == user.id))
                await session.execute(delete(Earning).where(Earning.partner_id == user.id))
                await session.execute(delete(PartnerTask).where(PartnerTask.partner_id == user.id))
                await session.execute(delete(ViralGeneration).where(ViralGeneration.partner_id == user.id))
                await session.execute(delete(SocialPost).where(SocialPost.partner_id == user.id))

                await session.delete(user)

            # Delete users with name 'Test' and no photo
            stmt2 = select(Partner).where(Partner.first_name == "Test").where(Partner.photo_url.is_(None))
            result2 = await session.exec(stmt2)
            test_users = result2.all()

            print(f"Found {len(test_users)} test users to delete.")
            for user in test_users:
                print(f"Deleting Test user (ID: {user.id})")
                # Handle circular dependency and child records
                user.last_transaction_id = None
                session.add(user)
                await session.flush()
                
                await session.execute(delete(PartnerTransaction).where(PartnerTransaction.partner_id == user.id))
                await session.execute(delete(XPTransaction).where(XPTransaction.partner_id == user.id))
                await session.execute(delete(Earning).where(Earning.partner_id == user.id))
                await session.execute(delete(PartnerTask).where(PartnerTask.partner_id == user.id))
                
                await session.delete(user)

            await session.commit()
            print("Cleanup complete.")

    except Exception as e:
        await session.rollback()
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

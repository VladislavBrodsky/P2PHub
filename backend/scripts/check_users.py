
import asyncio
import os

# Hardcode env vars for script
os.environ["BOT_TOKEN"] = "8245884329:AAEy0UaI2zGuwTHdkRXHa1f-kzhY6t1_lG4"
# Use PUBLIC URL for local script access
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")
print("DEBUG: Set hardcoded env vars")

from sqlmodel import select

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

        # Now use session
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession

        # Re-create engine with new URL
        engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
            result = await session.exec(statement)
            partners = result.all()
            print(f"Found {len(partners)} partners.")
            for p in partners:
                print(f"ID: {p.id}, Name: {p.first_name}, PhotoURL: {p.photo_url}, CreatedAt: {p.created_at}")
    except Exception as e:
        print(f"Error: {e}")
        # Fallback if get_session_context is not available or differs
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession

        from app.models.partner import engine

        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        async with async_session() as session:
             statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
             result = await session.exec(statement)
             partners = result.all()
             print(f"Found {len(partners)} partners (fallback).")
             for p in partners:
                  print(f"ID: {p.id}, Name: {p.first_name}, PhotoURL: {p.photo_url}, CreatedAt: {p.created_at}")

if __name__ == "__main__":
    asyncio.run(main())


import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Minimal imports first
print("Starting script...")
try:
    import asyncpg
    print("asyncpg imported successfully")
except ImportError:
    print("ERROR: asyncpg not found")
    sys.exit(1)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner

# Hardcoded for debugging
database_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

print(f"Using DB URL: {database_url}")

engine = create_async_engine(database_url, echo=False, future=True)

async def main():
    print("Connecting to DB...")
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with async_session() as session:
            print("Session created, executing query...")
            statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
            result = await session.exec(statement)
            partners = result.all()

            print(f"Found {len(partners)} recent partners:")
            for p in partners:
                print(f"ID: {p.id}, Name: {p.first_name} {p.last_name}, Username: {p.username}, PhotoURL: {p.photo_url}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

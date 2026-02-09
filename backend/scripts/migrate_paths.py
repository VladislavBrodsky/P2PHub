import asyncio
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load env vars
from app.core.config import settings
from app.models.partner import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.partner_service import migrate_paths

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def main():
    print("🚀 Starting Path Migration...")
    async with async_session_factory() as session:
        await migrate_paths(session)
    print("✅ Migration Complete!")

if __name__ == "__main__":
    asyncio.run(main())

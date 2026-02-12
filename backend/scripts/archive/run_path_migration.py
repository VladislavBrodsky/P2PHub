import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.models.partner import get_session
from app.services.partner_service import migrate_paths


async def run_migration():
    print("🚀 Running path migration for all partners...")
    async for session in get_session():
        await migrate_paths(session)
        print("✅ Path migration completed.")
        break

if __name__ == "__main__":
    asyncio.run(run_migration())

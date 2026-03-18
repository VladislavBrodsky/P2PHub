import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import asyncpg
import sys
import os

# Add backend to sys.path
from app.core.config import settings

async def list_tables():
    try:
        url = settings.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
        
        conn = await asyncpg.connect(url)
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        print("TABLES FOUND:")
        for t in tables:
            print(f"- {t['table_name']}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_tables())

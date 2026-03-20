import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.append(str(Path.cwd() / "backend"))

# Explicitly load .env from root
env_path = Path.cwd() / ".env"
print(f"🔍 Loading .env from: {env_path}")
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded .env. DATABASE_URL set: {'DATABASE_URL' in os.environ}")
else:
    print("❌ .env NOT FOUND in root")

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

async def check_recent():
    async with AsyncSession(engine) as session:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
        result = await session.exec(statement)
        partners = result.all()
        
        print("\n--- RECENT USERS ---")
        for p in partners:
            print(f"ID: {p.id} | TG: {p.telegram_id} | User: {p.username} | Created: {p.created_at} | Path: {p.path} | Test: {p.is_test} | XP: {p.xp}")
        print("--------------------\n")

if __name__ == "__main__":
    asyncio.run(check_recent())

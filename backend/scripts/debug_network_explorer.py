import asyncio
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

print(f"Current Directory: {os.getcwd()}")
print(f"DATABASE_URL from env: {os.getenv('DATABASE_URL')}")

from sqlmodel import select, text
from app.models.partner import Partner, get_session
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def debug_network():
    database_url = settings.DATABASE_URL
    if database_url and database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(database_url, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. List some partners and their paths
        print("\n--- Recent Partners ---")
        stmt = select(Partner).order_by(Partner.id.desc()).limit(10)
        result = await session.exec(stmt)
        for p in result.all():
            print(f"ID: {p.id}, TG: {p.telegram_id}, Path: {p.path}, Ref: {p.referrer_id}, First: {p.first_name}")

        # 2. Check a specific user who might have referrals
        # Let's find someone with referrals
        print("\n--- Partners with Referrals ---")
        stmt = select(Partner).where(Partner.referrer_id != None).limit(5)
        result = await session.exec(stmt)
        referrals = result.all()
        for r in referrals:
            print(f"Referral ID: {r.id}, Referrer ID: {r.referrer_id}, Path: {r.path}")

        # 3. Test the Tree Query for someone
        if referrals:
            ref_id = referrals[0].referrer_id
            print(f"\n--- Testing Tree Query for Partner ID {ref_id} ---")
            partner = await session.get(Partner, ref_id)
            base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
            base_dots = base_path.count('.') if base_path else -1
            target_level = 1
            target_dots = base_dots + target_level
            
            print(f"Base Path: {base_path}, Base Dots: {base_dots}, Target Dots: {target_dots}")
            
            query = text("""
                SELECT id, first_name, path, (length(path) - length(replace(path, '.', ''))) as dots
                FROM partner
                WHERE (path = :base_path OR path LIKE :base_path || '.%')
            """)
            result = await session.execute(query, {"base_path": base_path})
            print("Query results (direct and indirect):")
            for row in result:
                print(f"ID: {row[0]}, Name: {row[1]}, Path: {row[2]}, Dots: {row[3]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_network())

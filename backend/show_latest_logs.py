
import asyncio
import os
import sys

# Hardcoding environment variables
os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.orm import sessionmaker
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: True

from app.models.partner import engine
from app.models.audit_log import AuditLog

async def show_latest():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        query = select(AuditLog).order_by(AuditLog.id.desc()).limit(100)
        result = await session.execute(query)
        logs = result.scalars().all()
        print(f"Total AuditLog count: {(await session.execute(select(func.count(AuditLog.id)))).scalar()}")
        for log in logs:
            if log.id >= 490:
                print(f"ID: {log.id} | {log.created_at} | {log.entity_type} | {log.action}")

if __name__ == "__main__":
    asyncio.run(show_latest())

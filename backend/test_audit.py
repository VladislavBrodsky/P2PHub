
import asyncio
import os
import sys

# Hardcoding environment variables due to permission issues with .env files
os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add backend directory to sys.path so 'app' can be found
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Monkeypatch load_dotenv
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: True

async def test_audit():
    print("Testing audit log entry...")
    from app.models.partner import engine
    from app.services.audit_service import audit_service
    from sqlmodel.ext.asyncio.session import AsyncSession
    from sqlalchemy.orm import sessionmaker

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        print("Connected to DB, logging event...")
        await audit_service.log_event(
            session=session,
            entity_type="notification",
            entity_id="test_run",
            action="verify_check",
            details={"msg": "Checking if audit works"}
        )
        print("Committing...")
        await session.commit()
        print("✅ Audit log entry committed!")

if __name__ == "__main__":
    asyncio.run(test_audit())

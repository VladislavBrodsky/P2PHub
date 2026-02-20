
import asyncio
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to direct string if env fails for some reason
    DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check_pending_notifications():
    from app.models.notification_retry import NotificationRetry
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Count by status
        stmt = select(NotificationRetry.status, func.count(NotificationRetry.id)).group_by(NotificationRetry.status)
        result = await session.execute(stmt)
        counts = result.all()
        
        print("Notification Status Counts:")
        for status, count in counts:
            print(f"- {status}: {count}")
            
        # Get latest pending notifications
        stmt_pending = select(NotificationRetry).where(NotificationRetry.status == "pending").order_by(NotificationRetry.created_at.desc()).limit(5)
        result_pending = await session.execute(stmt_pending)
        pending_items = result_pending.scalars().all()
        
        if pending_items:
            print("\nLatest Pending Notifications:")
            for item in pending_items:
                print(f"- ID: {item.id}, Chat ID: {item.chat_id}, Created At: {item.created_at}, Attempts: {item.attempts}, Last Error: {item.last_error}")
        else:
            print("\nNo pending notifications found.")

if __name__ == "__main__":
    import os
    import sys
    # Add backend to path
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    asyncio.run(check_pending_notifications())

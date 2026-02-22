
import asyncio
from app.models.notification_retry import NotificationRetry
from app.models.partner import engine
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

async def cleanup_stuck_retries():
    async with AsyncSession(engine) as session:
        # Mark all 'chat not found' items as failed
        stmt = text("UPDATE notificationretry SET status = 'failed' WHERE last_error LIKE '%chat not found%' AND status = 'pending'")
        res = await session.execute(stmt)
        print(f"Updated {res.rowcount} stuck messages with 'chat not found' to 'failed'.")
        
        # Also handle any other pending ones that are clearly junk (optional, but let's be safe)
        # For now, just the ones we identified.
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(cleanup_stuck_retries())

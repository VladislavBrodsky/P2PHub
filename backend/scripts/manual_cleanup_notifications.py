import asyncio
import logging
from app.services.maintenance_service import cleanup_notification_retries

logging.basicConfig(level=logging.INFO)

async def main():
    print("🚀 Manually triggering Notification Cleanup (Aggressive Wipe)...")
    from sqlmodel.ext.asyncio.session import AsyncSession
    from sqlmodel import delete
    from app.models.partner import engine
    from app.models.notification_retry import NotificationRetry
    
    async with AsyncSession(engine) as session:
        # Delete ALL failed items
        stmt = delete(NotificationRetry).where(NotificationRetry.status == "failed")
        res = await session.execute(stmt)
        await session.commit()
        print(f"✅ Cleaned up failed notifications.")

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import logging

from app.services.maintenance_service import cleanup_notification_retries

logging.basicConfig(level=logging.INFO)

async def main():
    print("🚀 Manually triggering Notification Cleanup (Aggressive Wipe)...")
    from sqlmodel import delete
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.notification_retry import NotificationRetry
    from app.models.partner import engine
    
    async with AsyncSession(engine) as session:
        # Delete ALL failed items
        stmt = delete(NotificationRetry).where(NotificationRetry.status == "failed")
        await session.execute(stmt)
        await session.commit()
        print("✅ Cleaned up failed notifications.")

if __name__ == "__main__":
    asyncio.run(main())

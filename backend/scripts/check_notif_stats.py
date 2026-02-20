import asyncio

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.notification_retry import NotificationRetry
from app.models.partner import engine


async def main():
    async with AsyncSession(engine) as session:
        # Check counts by status
        for status in ["pending", "sent", "failed"]:
            stmt = select(func.count(NotificationRetry.id)).where(NotificationRetry.status == status)
            count = (await session.execute(stmt)).scalar()
            print(f"Status {status}: {count}")

if __name__ == "__main__":
    asyncio.run(main())

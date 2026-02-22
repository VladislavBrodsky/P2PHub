
import asyncio
from app.models.notification_retry import NotificationRetry
from app.models.partner import engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import UTC, datetime

async def check_retries():
    async with AsyncSession(engine) as session:
        stmt = select(NotificationRetry).where(NotificationRetry.status == "pending")
        res = await session.execute(stmt)
        items = res.scalars().all()
        print(f"Total Pending: {len(items)}")
        for item in items:
            print(f"ID: {item.id}, ChatID: {item.chat_id}, Text: {item.text[:50]}, Error: {item.last_error}, Attempts: {item.attempts}, CreatedAt: {item.created_at}")

if __name__ == "__main__":
    asyncio.run(check_retries())

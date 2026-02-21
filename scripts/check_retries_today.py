
import asyncio
import os
import sys
from datetime import datetime, UTC

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.notification_retry import NotificationRetry
from app.models.partner import async_session_maker

async def check_retries_today():
    async with async_session_maker() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        stmt = select(NotificationRetry).where(NotificationRetry.created_at >= today)
        res = await session.exec(stmt)
        rs = res.all()
        
        print(f"🔄 Retries today: {len(rs)}")
        for r in rs:
            print(f"[{r.created_at}] | TID: {r.chat_id} | Status: {r.status} | Last Error: {r.last_error}")

if __name__ == "__main__":
    asyncio.run(check_retries_today())

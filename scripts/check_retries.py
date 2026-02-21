
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.notification_retry import NotificationRetry
from app.models.partner import async_session_maker

async def check_retries(chat_id):
    async with async_session_maker() as session:
        stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id).order_by(NotificationRetry.created_at.desc()).limit(20)
        res = await session.exec(stmt)
        retries = res.all()
        
        print(f"🔄 Notification Retries for {chat_id}:")
        if not retries:
            print("❌ No retries found.")
        for r in retries:
            print(f"- {r.created_at} | Status: {r.status} | Error: {r.last_error} | Text: {r.text[:100]}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_retries.py <chat_id>")
    else:
        asyncio.run(check_retries(int(sys.argv[1])))

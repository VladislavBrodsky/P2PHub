
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select, func
from app.models.notification_retry import NotificationRetry
from app.models.partner import async_session_maker

async def audit_backlog():
    async with async_session_maker() as session:
        # Total pending
        stmt = select(func.count(NotificationRetry.id)).where(NotificationRetry.status == "pending")
        total_pending = (await session.exec(stmt)).one()
        
        # Newest 5
        stmt_new = select(NotificationRetry).where(NotificationRetry.status == "pending").order_by(NotificationRetry.created_at.desc()).limit(5)
        res_new = await session.exec(stmt_new)
        newest = res_new.all()
        
        print(f"📦 BACKLOG AUDIT:")
        print(f"Total Pending Notifications: {total_pending}")
        if newest:
            print("\nLatest 5 Pending Items:")
            for item in newest:
                print(f"- [{item.created_at}] Chat ID: {item.chat_id} | Error: {item.last_error}")
        else:
            print("No pending notifications in the retry table.")

if __name__ == "__main__":
    asyncio.run(audit_backlog())

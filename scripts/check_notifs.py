
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def check_notifications(telegram_id):
    async with async_session_maker() as session:
        # Check AuditLog for notifications to this user
        stmt = select(AuditLog).where(AuditLog.entity_type == "notification", AuditLog.entity_id == str(telegram_id)).order_by(AuditLog.created_at.desc()).limit(20)
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"🔔 Notification Audit for {telegram_id}:")
        if not logs:
            print("❌ No notifications found in AuditLog.")
        for log in logs:
            print(f"- {log.created_at} | Action: {log.action} | Details: {log.details}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_notifs.py <telegram_id>")
    else:
        asyncio.run(check_notifications(sys.argv[1]))

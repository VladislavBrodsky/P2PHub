
import asyncio
import os
import sys
from datetime import datetime, UTC

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def audit_notifs_today(chat_id):
    async with async_session_maker() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        stmt = select(AuditLog).where(
            AuditLog.entity_id == str(chat_id),
            AuditLog.entity_type == "notification",
            AuditLog.created_at >= today_start
        )
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"📊 Notification Audit for {chat_id} (Today):")
        print(f"Total Logs: {len(logs)}")
        for l in logs:
            action = l.action
            details = l.details
            text_preview = details.get("text_preview", "N/A")
            print(f"- {l.created_at} | {action} | {text_preview[:50]}...")

if __name__ == "__main__":
    cid = sys.argv[1] if len(sys.argv) > 1 else "716720099"
    asyncio.run(audit_notifs_today(cid))

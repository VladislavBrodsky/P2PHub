
import asyncio
import os
import sys
from datetime import datetime, UTC

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def check_today_notifs():
    async with async_session_maker() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        stmt = select(AuditLog).where(AuditLog.entity_type == "notification", AuditLog.created_at >= today_start)
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"🔔 Notifications Today ({len(logs)}):")
        for l in logs:
            print(f"- {l.created_at} | Target: {l.entity_id} | Action: {l.action} | Details: {l.details}")

if __name__ == "__main__":
    asyncio.run(check_today_notifs())

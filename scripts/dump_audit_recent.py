
import asyncio
import os
import sys
from datetime import datetime, UTC, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def dump_audit_logs(start_time_utc):
    async with async_session_maker() as session:
        stmt = select(AuditLog).where(AuditLog.created_at >= start_time_utc).order_by(AuditLog.created_at.asc())
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"📋 Audit Logs since {start_time_utc} (Total: {len(logs)}):")
        for l in logs:
            print(f"[{l.created_at}] | User: {l.actor_id or l.partner_id} | Type: {l.entity_type} | Action: {l.action} | ID: {l.entity_id}")
            if l.details:
                print(f"   Details: {l.details}")

if __name__ == "__main__":
    # 1 hour ago
    start = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=1)
    asyncio.run(dump_audit_logs(start))

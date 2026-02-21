
import asyncio
import os
import sys
from datetime import datetime, UTC, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def dump_audit_logs():
    async with async_session_maker() as session:
        # Looking at the 18:50 - 19:10 window
        start = datetime(2026, 2, 21, 18, 50)
        end = datetime(2026, 2, 21, 19, 10)
        stmt = select(AuditLog).where(AuditLog.created_at >= start, AuditLog.created_at <= end).order_by(AuditLog.created_at.asc())
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"📋 Audit Logs between {start} and {end} (Total: {len(logs)}):")
        for l in logs:
            print(f"[{l.created_at}] | User: {l.actor_id or l.partner_id} | Type: {l.entity_type} | Action: {l.action}")
            if l.details:
                print(f"   Details: {l.details}")

if __name__ == "__main__":
    asyncio.run(dump_audit_logs())

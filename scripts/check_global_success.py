
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def check_global_success():
    async with async_session_maker() as session:
        stmt = select(AuditLog).where(AuditLog.action == "send_success").order_by(AuditLog.created_at.desc()).limit(1)
        res = await session.exec(stmt)
        l = res.first()
        if l:
            print(f"Last global send_success: {l.created_at} for User {l.entity_id}")
        else:
            print("No send_success found in AuditLog.")

if __name__ == "__main__":
    asyncio.run(check_global_success())

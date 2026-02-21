
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.audit_log import AuditLog
from app.models.partner import async_session_maker

async def check_send_success(chat_id):
    async with async_session_maker() as session:
        stmt = select(AuditLog).where(AuditLog.entity_id == str(chat_id), AuditLog.action == "send_success").order_by(AuditLog.created_at.desc()).limit(10)
        res = await session.exec(stmt)
        logs = res.all()
        
        print(f"✅ send_success logs for {chat_id}:")
        if not logs:
            print("❌ No send_success logs found today.")
        for l in logs:
            print(f"- {l.created_at} | Action: {l.action}")

if __name__ == "__main__":
    asyncio.run(check_send_success("716720099"))

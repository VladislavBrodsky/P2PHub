
import asyncio
import os
import sys
from datetime import datetime, UTC, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.models.transaction import PartnerTransaction

async def audit_user_activity(tg_id: str):
    async with async_session_maker() as session:
        # Find user
        stmt_user = select(Partner).where(Partner.telegram_id == str(tg_id))
        user = (await session.exec(stmt_user)).first()
        if not user:
            print(f"❌ User {tg_id} not found.")
            return
            
        print(f"👤 Auditing Activity for: {user.username} (ID: {user.id})")
        
        # 1. Check Earnings Today (UTC)
        from app.models.partner import Earning
        today = datetime.now(UTC).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt_earn = select(Earning).where(
            Earning.partner_id == user.id,
            Earning.type == "COMMISSION",
            Earning.created_at >= today
        )
        earns = (await session.exec(stmt_earn)).all()
        
        print(f"💰 Commissions Today: {len(earns)}")
        for e in earns:
            print(f"- [{e.created_at}] {e.amount} {e.currency} | Desc: {e.description}")

        # 2. Check Audit Logs for notifications
        from app.models.audit_log import AuditLog
        stmt_audit = select(AuditLog).where(
            AuditLog.entity_id == str(tg_id),
            AuditLog.entity_type == "notification",
            AuditLog.created_at >= today
        ).order_by(AuditLog.created_at.desc())
        logs = (await session.exec(stmt_audit)).all()
        
        print(f"\n📊 Notification Logs Today: {len(logs)}")
        for l in logs:
            print(f"- [{l.created_at}] Action: {l.action} | Details: {l.details}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "716720099"
    asyncio.run(audit_user_activity(target))

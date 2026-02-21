
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from datetime import datetime, UTC, timedelta
from sqlmodel import select, func
from app.models.partner import Partner, Earning, async_session_maker
from app.models.audit_log import AuditLog

async def manual_audit():
    async with async_session_maker() as session:
        telegram_id = '716720099'
        today = datetime.now(UTC).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get user
        stmt_u = select(Partner).where(Partner.telegram_id == telegram_id)
        u = (await session.exec(stmt_u)).first()
        if not u:
            print("User not found.")
            return

        print(f"Stats for {u.username} (ID: {u.id}) today:")
        
        # Commissions Count
        stmt_c = select(func.count(Earning.id)).where(Earning.partner_id == u.id, Earning.created_at >= today)
        c = (await session.exec(stmt_c)).one()
        print(f"Total actions in Earnings table today: {c}")

        # Check notification audit
        stmt_n = select(func.count(AuditLog.id)).where(AuditLog.entity_id == telegram_id, AuditLog.entity_type == 'notification', AuditLog.created_at >= today)
        n = (await session.exec(stmt_n)).one()
        print(f"Total notification audits today: {n}")

if __name__ == "__main__":
    asyncio.run(manual_audit())


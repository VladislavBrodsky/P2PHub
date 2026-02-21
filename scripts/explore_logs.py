
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from datetime import datetime, UTC, timedelta
from sqlmodel import select, func
from app.models.partner import Partner, Earning, async_session_maker
from app.models.audit_log import AuditLog

async def explore_logs():
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
        
        # All actions in Earnings today
        stmt_c = select(Earning).where(Earning.partner_id == u.id, Earning.created_at >= today)
        earns = (await session.exec(stmt_c)).all()
        for e in earns:
            print(f"- [EARN] [{e.created_at}] Type: {e.type} | {e.amount} {e.currency} | {e.description}")

if __name__ == "__main__":
    asyncio.run(explore_logs())

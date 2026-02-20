
import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.notification_retry import NotificationRetry
from app.models.partner import engine


async def audit_system():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # 1. Check Stuck Notifications
        stmt_stuck = select(func.count(NotificationRetry.id)).where(NotificationRetry.status == 'pending')
        stuck_count = (await session.execute(stmt_stuck)).scalar()
        
        # 2. Check Failed Notifications
        stmt_failed = select(func.count(NotificationRetry.id)).where(NotificationRetry.status == 'failed')
        failed_count = (await session.execute(stmt_failed)).scalar()
        
        # 3. Check for any "broken" paths (integrity)
        from app.models.partner import Partner
        stmt_orphans = select(func.count(Partner.id)).where(Partner.referrer_id.is_not(None), Partner.path.is_(None))
        orphans_count = (await session.execute(stmt_orphans)).scalar()
        
        # 4. Check for high-velocity creation (potential loop/spam)
        from datetime import UTC, datetime, timedelta
        ten_mins_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=10)
        stmt_recent = select(func.count(Partner.id)).where(Partner.created_at >= ten_mins_ago)
        recent_partners = (await session.execute(stmt_recent)).scalar()

        print("--- SYSTEM AUDIT RESULTS ---")
        print(f"Pending Notifications (Stuck): {stuck_count}")
        print(f"Failed Notifications: {failed_count}")
        print(f"Orphaned Partners (Missing path): {orphans_count}")
        print(f"Recent Partners (10 min): {recent_partners}")
        
        if stuck_count > 500:
            print("ALERT: Notification queue is backed up!")
        if orphans_count > 0:
            print("ALERT: Tree integrity issues detected!")
        if recent_partners > 1000:
             print("ALERT: High partner registration velocity!")

if __name__ == "__main__":
    asyncio.run(audit_system())

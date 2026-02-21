import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import List, Any

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, get_session, engine
from app.models.broadcast import Broadcast, BroadcastStatus, AudienceFilter
from app.services.notification_service import notification_service
from app.core.broker import broker
from app.core.retry import async_retry

logger = logging.getLogger(__name__)

class BroadcastService:
    async def create_broadcast(self, admin_id: str, message_text: str, audience_type: AudienceFilter) -> Broadcast:
        """
        Initializes a new broadcast task. 
        Calculates the total audience size before starting.
        """
        async for session in get_session():
            total_targets = await self._count_targets(session, audience_type)
            broadcast = Broadcast(
                admin_id=admin_id,
                message_text=message_text,
                audience_type=audience_type,
                total_targets=total_targets,
                status=BroadcastStatus.PENDING
            )
            session.add(broadcast)
            await session.commit()
            await session.refresh(broadcast)
            
            # Auto-trigger execution
            await run_broadcast_task.kiq(broadcast.id)
            return broadcast

    async def _count_targets(self, session: AsyncSession, audience_type: AudienceFilter) -> int:
        stmt = select(func.count(Partner.id)).where(Partner.notifications_paused == False)
        
        if audience_type == AudienceFilter.PRO_ONLY:
            stmt = stmt.where(Partner.is_pro == True)
        elif audience_type == AudienceFilter.FREE_ONLY:
            stmt = stmt.where(Partner.is_pro == False)
        elif audience_type == AudienceFilter.LEVEL_1:
            stmt = stmt.where(Partner.level == 1)
        elif audience_type == AudienceFilter.INACTIVE_7D:
            week_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
            stmt = stmt.where(Partner.updated_at < week_ago)
            
        result = await session.execute(stmt)
        return result.scalar() or 0

    async def get_active_broadcasts(self) -> List[Broadcast]:
        async for session in get_session():
            stmt = select(Broadcast).where(Broadcast.status.in_([BroadcastStatus.SENDING, BroadcastStatus.PENDING])).order_by(Broadcast.created_at.desc())
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_broadcast_history(self, limit: int = 50) -> List[Broadcast]:
        async for session in get_session():
            stmt = select(Broadcast).order_by(Broadcast.created_at.desc()).limit(limit)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def cancel_broadcast(self, broadcast_id: int):
        async for session in get_session():
            broadcast = await session.get(Broadcast, broadcast_id)
            if broadcast and broadcast.status == BroadcastStatus.SENDING:
                broadcast.status = BroadcastStatus.CANCELLED
                broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
                session.add(broadcast)
                await session.commit()
                return True
        return False

broadcast_service = BroadcastService()

@broker.task(task_name="run_broadcast_task")
async def run_broadcast_task(broadcast_id: int):
    """
    Core engine for mass messaging. 
    Processes users in batches to maintain high throughput without blocking Redis/Broker.
    """
    from sqlalchemy.orm import sessionmaker
    from app.models.partner import engine
    from app.services.audit_service import audit_service
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        broadcast = await session.get(Broadcast, broadcast_id)
        if not broadcast or broadcast.status != BroadcastStatus.PENDING:
            return

        broadcast.status = BroadcastStatus.SENDING
        broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(broadcast)
        await session.commit()
        
        # Determine audience query
        stmt = select(Partner.telegram_id).where(Partner.notifications_paused == False)
        if broadcast.audience_type == AudienceFilter.PRO_ONLY:
            stmt = stmt.where(Partner.is_pro == True)
        elif broadcast.audience_type == AudienceFilter.FREE_ONLY:
            stmt = stmt.where(Partner.is_pro == False)
        elif broadcast.audience_type == AudienceFilter.LEVEL_1:
            stmt = stmt.where(Partner.level == 1)
        elif broadcast.audience_type == AudienceFilter.INACTIVE_7D:
            week_ago = broadcast.created_at - timedelta(days=7)
            stmt = stmt.where(Partner.updated_at < week_ago)

        # Process in batches of 100
        BATCH_SIZE = 100
        offset = 0
        
        while True:
            # Re-fetch broadcast to check for cancellation/pause
            await session.refresh(broadcast)
            if broadcast.status == BroadcastStatus.CANCELLED:
                logger.info(f"🛑 Broadcast {broadcast_id} was cancelled.")
                break
            
            batch_stmt = stmt.offset(offset).limit(BATCH_SIZE)
            result = await session.execute(batch_stmt)
            telegram_ids = result.scalars().all()
            
            if not telegram_ids:
                break
            
            success_count = 0
            fail_count = 0
            
            # Dispatch to the primary notification queue (which handles rate limiting)
            for telegram_id in telegram_ids:
                try:
                    # Priority is 'low' for broadcasts to avoid delaying critical system txn notices
                    from app.services.notification_service import send_telegram_task
                    await send_telegram_task.kiq({
                        "chat_id": telegram_id,
                        "text": broadcast.message_text,
                        "priority": "low",
                        "parse_mode": "HTML"
                    })
                    success_count += 1
                except Exception as e:
                    logger.error(f"❌ Failed to queue broadcast message for {telegram_id}: {e}")
                    fail_count += 1
            
            # Update progress
            broadcast.sent_count += success_count
            broadcast.failed_count += fail_count
            broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
            session.add(broadcast)
            await session.commit()
            
            offset += BATCH_SIZE
            # Yield control
            await asyncio.sleep(0.5)

        # Finalize
        if broadcast.status == BroadcastStatus.SENDING:
            broadcast.status = BroadcastStatus.COMPLETED
            broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
            session.add(broadcast)
            await session.commit()
            
            # Log successful completion
            await audit_service.log_event(
                session=session,
                entity_type="broadcast",
                entity_id=str(broadcast_id),
                action="mass_message_completed",
                details={"total": broadcast.total_targets, "sent": broadcast.sent_count}
            )
            await session.commit()

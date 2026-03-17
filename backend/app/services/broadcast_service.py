import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any, List

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.retry import async_retry
from app.models.broadcast import AudienceFilter, Broadcast, BroadcastStatus
from app.models.partner import Partner, engine, get_session
from app.services.notification_service import notification_service

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
        stmt = select(func.count(Partner.id)).where(Partner.notifications_paused.is_(False))
        
        if audience_type == AudienceFilter.PRO_ONLY:
            stmt = stmt.where(Partner.is_pro.is_(True))
        elif audience_type == AudienceFilter.FREE_ONLY:
            stmt = stmt.where(Partner.is_pro.is_(False))
        elif audience_type == AudienceFilter.LEVEL_1:
            stmt = stmt.where(Partner.level == 1)
        elif audience_type == AudienceFilter.INACTIVE_7D:
            week_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
            stmt = stmt.where(Partner.updated_at < week_ago)
            
        result = await session.execute(stmt)
        return result.scalar() or 0

    async def get_active_broadcasts(self) -> list[Broadcast]:
        async for session in get_session():
            stmt = select(Broadcast).where(Broadcast.status.in_([BroadcastStatus.SENDING, BroadcastStatus.PENDING])).order_by(Broadcast.created_at.desc())
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_broadcast_history(self, limit: int = 50) -> list[Broadcast]:
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
    Mass Messaging Engine (Scale-Optimized).
    Uses cursor-based chunking (id > last_id) to maintain performance at 200K users.
    Recursive re-queuing ensures we don't hog a worker for hours.
    """
    from sqlalchemy.orm import sessionmaker

    from app.services.audit_service import audit_service
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    CHUNK_SIZE = 250 # Smaller chunks for better responsiveness
    
    async with async_session() as session:
        # 1. Fetch with standard locking to avoid double-processing
        broadcast = await session.get(Broadcast, broadcast_id)
        if not broadcast or broadcast.status in [BroadcastStatus.COMPLETED, BroadcastStatus.CANCELLED, BroadcastStatus.FAILED]:
            return

        broadcast.status = BroadcastStatus.SENDING
        broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
        await session.commit()
        
        # 2. Build Cursor Query (Much faster than OFFSET for deep pagination)
        stmt = select(Partner.id, Partner.telegram_id).where(
            Partner.notifications_paused.is_(False),
            Partner.id > broadcast.last_partner_id
        ).order_by(Partner.id.asc()).limit(CHUNK_SIZE)
        
        if broadcast.audience_type == AudienceFilter.PRO_ONLY:
            stmt = stmt.where(Partner.is_pro.is_(True))
        elif broadcast.audience_type == AudienceFilter.FREE_ONLY:
            stmt = stmt.where(Partner.is_pro.is_(False))
        elif broadcast.audience_type == AudienceFilter.LEVEL_1:
            stmt = stmt.where(Partner.level == 1)
        elif broadcast.audience_type == AudienceFilter.INACTIVE_7D:
            week_ago = broadcast.created_at - timedelta(days=7)
            stmt = stmt.where(Partner.updated_at < week_ago)

        result = await session.execute(stmt)
        batch = result.all()
        
        if not batch:
            # Broadcast Finished
            broadcast.status = BroadcastStatus.COMPLETED
            broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
            await session.commit()
            
            await audit_service.log_event(
                session=session, entity_type="broadcast", entity_id=str(broadcast_id),
                action="mass_message_completed",
                details={"total": broadcast.total_targets, "sent": broadcast.sent_count}
            )
            await session.commit()
            logger.info(f"✨ Broadcast {broadcast_id} finished: {broadcast.sent_count} sent.")
            return

        # 3. Dispatch Chunk
        success_count = 0
        last_id = broadcast.last_partner_id
        
        for p_id, telegram_id in batch:
            try:
                # Priority 'low' respects global 30ms throttling window
                await notification_service.send_low_prio(
                    chat_id=telegram_id,
                    text=broadcast.message_text,
                    salt=f"bc_{broadcast_id}" # Salt prevents double-send in 60s window
                )
                success_count += 1
            except Exception as e:
                logger.error(f"❌ Broadcast Queue fail: {e}")
            last_id = p_id

        # 4. Update Progress & Re-queue
        broadcast.sent_count += success_count
        broadcast.last_partner_id = last_id
        broadcast.updated_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(broadcast)
        await session.commit()
        
        # Self-recurse for next chunk
        # Delay of 1s prevents "spinning" and gives other tasks breathing room
        await run_broadcast_task.kiq(broadcast_id)
        logger.info(f"📡 Broadcast {broadcast_id} progress: {broadcast.sent_count}/{broadcast.total_targets} (Next ID: {last_id})")


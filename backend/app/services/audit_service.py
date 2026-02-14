from typing import Any, Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger(__name__)

class AuditService:
    async def log_event(
        self,
        session: AsyncSession,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_id: str = "system",
        details: Optional[dict] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Logs a system event to the audit table.
        """
        try:
            log_entry = AuditLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                actor_id=actor_id,
                details=details or {},
                ip_address=ip_address
            )
            session.add(log_entry)
            # We don't commit here to allow atomic transactions with the main operation
            # But we flush to get the ID if needed
            await session.flush()
            return log_entry
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            # Don't raise, audit logging should not break business logic ideally
            # unless strict auditing is required. Here we log error and continue.
            return None

    async def log_xp_award(
        self,
        session: AsyncSession,
        partner_id: int,
        new_user_id: int,
        xp_amount: int,
        level: int,
        is_pro: bool,
        xp_before: int,
        xp_after: int
    ):
        """Logs an XP award event."""
        await self.log_event(
            session=session,
            entity_type="partner",
            entity_id=str(partner_id),
            action="xp_award",
            details={
                "new_user_id": new_user_id,
                "xp_amount": xp_amount,
                "level": level,
                "is_pro": is_pro,
                "xp_before": xp_before,
                "xp_after": xp_after
            }
        )

    async def log_commission(
        self,
        session: AsyncSession,
        partner_id: int,
        buyer_id: int,
        amount: float,
        level: int,
        balance_before: float,
        balance_after: float
    ):
        """Logs a commission award event."""
        await self.log_event(
            session=session,
            entity_type="partner",
            entity_id=str(partner_id),
            action="commission_award",
            details={
                "buyer_id": buyer_id,
                "amount": amount,
                "level": level,
                "balance_before": balance_before,
                "balance_after": balance_after
            }
        )

    async def log_task_completion(
        self,
        session: AsyncSession,
        partner_id: int,
        task_id: str,
        xp_amount: int,
        xp_before: int,
        xp_after: int
    ):
        """Logs a task completion event."""
        await self.log_event(
            session=session,
            entity_type="partner",
            entity_id=str(partner_id),
            action="task_completion",
            details={
                "task_id": task_id,
                "xp_amount": xp_amount,
                "xp_before": xp_before,
                "xp_after": xp_after
            }
        )

audit_service = AuditService()

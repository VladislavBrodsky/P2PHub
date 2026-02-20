import logging

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit_log import ActionType, AuditLog
from app.core.retry import async_retry

logger = logging.getLogger(__name__)

class AuditService:
    @async_retry(max_attempts=3, base_delay=1.0)
    async def log_event(
        self,
        session: AsyncSession,
        entity_type: str | None = None,
        entity_id: str | None = None,
        action: str | None = None,
        actor_id: str | None = "system",
        details: dict | None = None,
        ip_address: str | None = None,
        # New Phase 3 Architecture
        partner_id: int | None = None,
        action_type: ActionType = ActionType.MISC,
        description: str | None = None
    ) -> AuditLog | None:
        """
        Logs a system event to the audit table.
        #comment Updated for Scaling Phase 3: Supports partner_id linking and strict ENUM action_types.
        """
        try:
            log_entry = AuditLog(
                partner_id=partner_id,
                action_type=action_type,
                description=description,
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
        new_user_id: int | None = None,
        xp_amount: int = 0,
        level: int | None = None,
        is_pro: bool = False,
        xp_before: int = 0,
        xp_after: int = 0,
        buyer_id: int | None = None # Sometimes passed by referral_service
    ):
        """Logs an XP award event."""
        # #comment Phase 3 mapped metrics
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.COMMISSION,
            description=f"XP Awarded: +{xp_amount}",
            entity_type="partner",
            entity_id=str(partner_id),
            action="xp_award",
            details={
                "new_user_id": new_user_id,
                "buyer_id": buyer_id,
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
            partner_id=partner_id,
            action_type=ActionType.COMMISSION,
            description=f"Commission Earned: ${amount:0.2f} from Level {level}",
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
            partner_id=partner_id,
            action_type=ActionType.SYSTEM,
            description=f"Task Completed: {task_id}",
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

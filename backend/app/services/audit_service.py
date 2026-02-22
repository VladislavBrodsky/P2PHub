import logging

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.retry import async_retry
from app.models.audit_log import ActionType, AuditLog

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
        partner_id: int | None = None,
        action_type: ActionType = ActionType.MISC,
        description: str | None = None
    ) -> AuditLog | None:
        """
        Core audit log method. Used by all specialized helpers below.
        Never raises — audit failure must NEVER break business logic.
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
            return log_entry
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            return None

    @async_retry(max_attempts=3, base_delay=1.0)
    async def log_events_bulk(
        self,
        session: AsyncSession,
        logs: list[dict]
    ) -> bool:
        """
        Efficiently creates multiple audit logs in a single batch operation.
        Each log dict should contain AuditLog fields.
        """
        try:
            entries = [AuditLog(**log) for log in logs]
            session.add_all(entries)
            return True
        except Exception as e:
            logger.error(f"Failed to create bulk audit logs: {e}")
            return False


    # ──────────────────────────────────────────────────────────
    # XP Events
    # ──────────────────────────────────────────────────────────

    async def log_xp_award(
        self,
        session: AsyncSession,
        partner_id: int,
        new_user_id: int | None = None,
        xp_amount: float = 0,
        level: int | None = None,
        is_pro: bool = False,
        xp_before: float = 0,
        xp_after: float = 0,
        buyer_id: int | None = None,
        details: dict | None = None
    ):
        """Logs an XP award with before/after snapshot for emergency reconciliation."""
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.XP_AWARD,
            description=f"XP Awarded: +{round(xp_amount, 2)} (L{level or '?'})",
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
                "xp_after": xp_after,
                **(details or {})
            }
        )

    # ──────────────────────────────────────────────────────────
    # Commission Events
    # ──────────────────────────────────────────────────────────

    async def log_commission(
        self,
        session: AsyncSession,
        partner_id: int,
        buyer_id: int,
        amount: float,
        level: int,
        balance_before: float,
        balance_after: float,
        details: dict | None = None
    ):
        """Logs commission award with before/after balance snapshot."""
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.COMMISSION,
            description=f"Commission Earned: ${amount:0.4f} from Level {level}",
            entity_type="partner",
            entity_id=str(partner_id),
            action="commission_award",
            details={
                "buyer_id": buyer_id,
                "amount": amount,
                "level": level,
                "balance_before": balance_before,
                "balance_after": balance_after,
                **(details or {})
            }
        )

    # ──────────────────────────────────────────────────────────
    # Task / Academy Events
    # ──────────────────────────────────────────────────────────

    async def log_task_completion(
        self,
        session: AsyncSession,
        partner_id: int,
        task_id: str,
        xp_amount: float,
        xp_before: float,
        xp_after: float
    ):
        """Logs task or academy stage completion."""
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

    # ──────────────────────────────────────────────────────────
    # Referral Events
    # ──────────────────────────────────────────────────────────

    async def log_referral_signup(
        self,
        session: AsyncSession,
        new_partner_id: int,
        new_partner_tg: str,
        referrer_id: int,
        referrer_tg: str,
        level: int = 1
    ):
        """
        Logs every referral join event.
        Provides a traceable chain: who joined, under whom, at what depth.
        Enables 'Was @user notified when @X joined under them?' queries.
        """
        await self.log_event(
            session=session,
            partner_id=referrer_id,
            action_type=ActionType.REFERRAL,
            description=f"New referral (L{level}): @{new_partner_tg} joined under #{referrer_id}",
            entity_type="referral",
            entity_id=str(new_partner_id),
            action="referral_signup",
            details={
                "new_partner_id": new_partner_id,
                "new_partner_tg": new_partner_tg,
                "referrer_id": referrer_id,
                "referrer_tg": referrer_tg,
                "level": level
            }
        )

    # ──────────────────────────────────────────────────────────
    # Notification Events
    # ──────────────────────────────────────────────────────────

    async def log_notification(
        self,
        session: AsyncSession,
        chat_id: str,
        event_type: str,
        status: str,
        priority: str = "medium",
        partner_id: int | None = None,
        error: str | None = None,
        salt: str | None = None
    ):
        """
        Logs every notification dispatch attempt.
        Enables emergency reconciliation: 'Was user X notified about event Y?'

        event_type: e.g. 'referral_l1_congrats', 'commission_received',
                    'referral_upgrade_announcement', 'level_up', 'pro_welcome'
        status:     'enqueued' | 'sent' | 'failed' | 'dedup_skipped' | 'blocked'
        """
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.NOTIFICATION,
            description=f"[{status.upper()}] {event_type} → {chat_id}",
            entity_type="notification",
            entity_id=chat_id,
            action=f"notification_{status}",
            details={
                "chat_id": chat_id,
                "event_type": event_type,
                "priority": priority,
                "salt": salt,
                "error": error
            }
        )

    # ──────────────────────────────────────────────────────────
    # Payment Events
    # ──────────────────────────────────────────────────────────

    async def log_payment(
        self,
        session: AsyncSession,
        partner_id: int,
        transaction_id: int,
        amount: float,
        currency: str,
        plan: str,
        status: str,
        tx_hash: str | None = None
    ):
        """
        Logs every payment/upgrade event with full details.
        status: 'initiated' | 'verified' | 'failed' | 'refunded'
        """
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.PAYMENT,
            description=f"Payment [{status.upper()}]: {plan} — ${amount} {currency}",
            entity_type="transaction",
            entity_id=str(transaction_id),
            action=f"payment_{status}",
            details={
                "transaction_id": transaction_id,
                "amount": amount,
                "currency": currency,
                "plan": plan,
                "tx_hash": tx_hash
            }
        )

    # ──────────────────────────────────────────────────────────
    # Reconciliation Flags
    # ──────────────────────────────────────────────────────────

    async def log_reconciliation_flag(
        self,
        session: AsyncSession,
        partner_id: int,
        flag_type: str,
        expected: float,
        actual: float,
        diff: float,
        context: dict | None = None
    ):
        """
        Logs data discrepancies detected by nightly reconciliation jobs.

        flag_type: 'XP_MISMATCH' | 'BALANCE_MISMATCH' | 'MISSING_COMMISSION' |
                   'MISSING_XP' | 'ORPHAN_NOTIFICATION' | 'REFERRAL_CHAIN_BREAK'
        """
        await self.log_event(
            session=session,
            partner_id=partner_id,
            action_type=ActionType.RECONCILIATION,
            description=f"⚠️ [{flag_type}]: expected={expected}, actual={actual}, diff={diff:+.4f}",
            entity_type="reconciliation",
            entity_id=str(partner_id),
            action="reconciliation_flag",
            details={
                "flag_type": flag_type,
                "expected": expected,
                "actual": actual,
                "diff": diff,
                **(context or {})
            }
        )


audit_service = AuditService()

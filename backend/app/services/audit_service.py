"""
Audit logging service for tracking all important system events.

#comment: This service provides a simple API for creating audit logs throughout the application.
Usage:
    await audit_service.log_commission(
        partner_id=ref.id,
        amount=commission,
        level=1,
        buyer_id=buyer.id
    )
"""

import json
import logging
from datetime import datetime
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit_log import AuditLog, AuditEventType, AuditCategory

logger = logging.getLogger(__name__)


class AuditService:
    """Service for creating audit log entries."""
    
    async def log_event(
        self,
        session: AsyncSession,
        event_type: str,
        category: str = AuditCategory.SYSTEM,
        partner_id: Optional[int] = None,
        related_partner_id: Optional[int] = None,
        amount: Optional[float] = None,
        currency: str = "XP",
        balance_before: Optional[float] = None,
        balance_after: Optional[float] = None,
        metadata: dict = None,
        success: bool = True,
        error_message: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """
        Create a generic audit log entry.
        
        #comment: This is the base method - use specific helpers below for common events.
        
        Args:
            session: Database session
            event_type: Type of event (use AuditEventType constants)
            category: Event category (use AuditCategory constants)
            partner_id: ID of partner this event relates to
            related_partner_id: ID of related partner (e.g., referrer)
            amount: Financial amount involved
            currency: Currency type (XP, USDT, TON)
            balance_before: Balance before operation
            balance_after: Balance after operation
            metadata: Additional context as dict (will be JSON-encoded)
            success: Whether operation succeeded
            error_message: Error message if failed
            request_id: Request ID from middleware
        
        Returns:
            Created AuditLog instance
        """
        log = AuditLog(
            event_type=event_type,
            event_category=category,
            partner_id=partner_id,
            related_partner_id=related_partner_id,
            amount=amount,
            currency=currency,
            balance_before=balance_before,
            balance_after=balance_after,
            extra_data=json.dumps(metadata or {}),
            success=success,
            error_message=error_message,
            request_id=request_id,
        )
        
        session.add(log)
        # #comment: Don't commit here - let caller control transaction
        # This way audit logs are part of the same transaction as the operation
        
        logger.info(
            f"📝 Audit: {event_type} | Partner: {partner_id} | "
            f"Amount: {amount} {currency} | Success: {success}"
        )
        
        return log
    
    # #comment: Convenience methods for common events
    # These methods make it easy to log events with correct parameters
    
    async def log_commission(
        self,
        session: AsyncSession,
        partner_id: int,
        buyer_id: int,
        amount: float,
        level: int,
        balance_before: float,
        balance_after: float,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a commission payment."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.COMMISSION_PAID,
            category=AuditCategory.FINANCIAL,
            partner_id=partner_id,
            related_partner_id=buyer_id,
            amount=amount,
            currency="USDT",
            balance_before=balance_before,
            balance_after=balance_after,
            metadata={
                "level": level,
                "percentage": self._get_commission_percentage(level),
                "pro_buyer_id": buyer_id,
            },
            request_id=request_id,
        )
    
    async def log_xp_award(
        self,
        session: AsyncSession,
        partner_id: int,
        new_user_id: int,
        xp_amount: int,
        level: int,
        is_pro: bool,
        xp_before: int,
        xp_after: int,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log an XP award."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.XP_AWARDED,
            category=AuditCategory.REFERRAL,
            partner_id=partner_id,
            related_partner_id=new_user_id,
            amount=xp_amount,
            currency="XP",
            balance_before=xp_before,
            balance_after=xp_after,
            metadata={
                "level": level,
                "is_pro": is_pro,
                "multiplier": 5 if is_pro else 1,
            },
            request_id=request_id,
        )
    
    async def log_pro_upgrade(
        self,
        session: AsyncSession,
        partner_id: int,
        amount_paid: float,
        payment_method: str,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a PRO upgrade."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.PRO_UPGRADE,
            category=AuditCategory.FINANCIAL,
            partner_id=partner_id,
            amount=amount_paid,
            currency="USDT",
            metadata={
                "payment_method": payment_method,
                "subscription_type": "PRO",
            },
            request_id=request_id,
        )
    
    async def log_referral_created(
        self,
        session: AsyncSession,
        new_user_id: int,
        referrer_id: int,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a new referral."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.REFERRAL_CREATED,
            category=AuditCategory.REFERRAL,
            partner_id=new_user_id,
            related_partner_id=referrer_id,
            metadata={
                "referrer_id": referrer_id,
            },
            request_id=request_id,
        )
    
    async def log_payment_failure(
        self,
        session: AsyncSession,
        partner_id: int,
        amount: float,
        error_message: str,
        payment_method: str,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a failed payment."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.PAYMENT_FAILED,
            category=AuditCategory.FINANCIAL,
            partner_id=partner_id,
            amount=amount,
            currency="USDT",
            success=False,
            error_message=error_message,
            metadata={
                "payment_method": payment_method,
            },
            request_id=request_id,
        )
    
    async def log_task_completion(
        self,
        session: AsyncSession,
        partner_id: int,
        task_id: str,
        xp_amount: int,
        xp_before: int,
        xp_after: int,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log a task completion."""
        return await self.log_event(
            session=session,
            event_type=AuditEventType.TASK_COMPLETED,
            category=AuditCategory.SYSTEM,
            partner_id=partner_id,
            amount=xp_amount,
            currency="XP",
            balance_before=xp_before,
            balance_after=xp_after,
            metadata={
                "task_id": task_id,
            },
            request_id=request_id,
        )

    async def log_admin_action(
        self,
        session: AsyncSession,
        admin_id: str,
        action: str,
        target_partner_id: Optional[int] = None,
        metadata: dict = None,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        """Log an admin action."""
        log = AuditLog(
            event_type=AuditEventType.ADMIN_ACTION,
            event_category=AuditCategory.ADMIN,
            partner_id=target_partner_id,
            admin_id=admin_id,
            extra_data=json.dumps(metadata or {}),
            request_id=request_id,
        )
        session.add(log)
        logger.info(f"📝 Audit: Admin {admin_id} performed {action}")
        return log
    
    # Helper methods
    def _get_commission_percentage(self, level: int) -> float:
        """Get commission percentage for a given level."""
        percentages = { 1: 0.30, 2: 0.05, 3: 0.03, 4: 0.01, 5: 0.01, 
                       6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01}
        return percentages.get(level, 0.0)
    
    # Query methods for retrieving audit logs
    async def get_partner_audit_logs(
        self,
        session: AsyncSession,
        partner_id: int,
        limit: int = 100,
        offset: int = 0,
        category: Optional[str] = None,
    ) -> list[AuditLog]:
        """
        Get audit logs for a specific partner.
        
        #comment: This allows partners to see their financial history.
        Can be used for "My Earnings History" page.
        """
        from sqlmodel import select
        
        stmt = select(AuditLog).where(AuditLog.partner_id == partner_id)
        
        if category:
            stmt = stmt.where(AuditLog.event_category == category)
        
        stmt = stmt.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        
        result = await session.exec(stmt)
        return list(result.all())
    
    async def get_failed_transactions(
        self,
        session: AsyncSession,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get recent failed transactions for admin review.
        
        #comment: This helps admins quickly find and fix issues.
        """
        from sqlmodel import select
        
        stmt = (
            select(AuditLog)
            .where(AuditLog.success == False)
            .where(AuditLog.event_category == AuditCategory.FINANCIAL)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        
        result = await session.exec(stmt)
        return list(result.all())


# Global instance
audit_service = AuditService()

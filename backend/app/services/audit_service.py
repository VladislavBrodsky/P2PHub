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

audit_service = AuditService()

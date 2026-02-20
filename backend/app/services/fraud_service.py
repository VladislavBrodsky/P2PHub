import logging

from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

class FraudDetectionService:
    """
    Service to detect and prevent automated abuse of the referral system.
    Focuses on 'XP farming' and 'Referral spam'.
    """

    async def is_referral_velocity_ok(self, referrer_id: int) -> bool:
        """
        Implements a sliding window rate limit for referrals.
        Limit: max 20 referrals per hour.
        """
        if not referrer_id:
            return True
            
        key = f"fraud:ref_velocity_hr:{referrer_id}"
        try:
            # Atomic increment
            count = await redis_service.client.incr(key)
            
            if count == 1:
                # Set TTL on first hit
                await redis_service.client.expire(key, 3600) # 1 hour
                
            if count > 20:
                logger.warning(f"🚨 FRAUD ALERT: High referral velocity for partner {referrer_id} ({count} refs/1hr). Max allowed is 20/hr.")
                from app.services.audit_service import audit_service
                from app.models.audit_log import ActionType
                
                # Using a generic DB session may be tricky here, but we can just use logging or run a fire-and-forget task
                # A simple log is sufficient per the requirement "Logging of violations"
                return False
                
            return True
        except Exception as e:
            # Fallback to allow if Redis fails
            logger.error(f"Fraud check failed (Redis error): {e}")
            return True

    async def block_suspicious_partner(self, partner_id: int, reason: str):
        """
        Placeholder for future automated blocking logic.
        Currently just logs the event for manual admin review.
        """
        logger.error(f"🚫 SUSPICIOUS ACTIVITY: Partner {partner_id} flagged. Reason: {reason}")
        # In the future, we could set a 'is_blocked' flag on the Partner model.

fraud_service = FraudDetectionService()

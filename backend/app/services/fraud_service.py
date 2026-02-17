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
        Limit: max 10 referrals per 5 minutes.
        """
        if not referrer_id:
            return True
            
        key = f"fraud:ref_velocity:{referrer_id}"
        try:
            # Atomic increment
            count = await redis_service.client.incr(key)
            
            if count == 1:
                # Set TTL on first hit
                await redis_service.client.expire(key, 300) # 5 minutes
                
            if count > 10:
                logger.warning(f"🚨 FRAUD ALERT: High referral velocity for partner {referrer_id} ({count} refs/5min)")
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

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
                # #comment: Phase 3: Auto-block the partner immediately in Redis.
                # We need a telegram_id to block by- flag by partner DB ID as a fallback.
                await self.block_suspicious_partner(referrer_id, reason=f"High referral velocity: {count}/hr")
                return False
                
            return True
        except Exception as e:
            # Fallback to allow if Redis fails
            logger.error(f"Fraud check failed (Redis error): {e}")
            return True

    async def block_suspicious_partner(self, partner_id: int, reason: str):
        """
        Automatically flags a suspicious partner.
        Sets a 7-day Redis block on the partner to prevent notifications and further system abuse.
        """
        logger.error(f"🚫 SUSPICIOUS ACTIVITY: Partner {partner_id} flagged. Reason: {reason}")
        
        # #comment: Phase 3: Actively block the partner in Redis for 7 days.
        # rate_limit_service.mark_user_blocked works on telegram_id OR partner_id string.
        from app.services.rate_limit_service import rate_limit_service
        try:
            await rate_limit_service.mark_user_blocked(str(partner_id), duration=86400 * 7)
            logger.warning(f"🔒 Partner {partner_id} blocked in Redis for 7 days.")
        except Exception as e:
            logger.error(f"Failed to auto-block partner {partner_id} in Redis: {e}")

fraud_service = FraudDetectionService()

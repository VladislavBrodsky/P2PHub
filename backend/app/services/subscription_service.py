import asyncio
import logging
from datetime import datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

class SubscriptionService:
    async def check_expiring_subscriptions(self, session: AsyncSession):
        """
        Finds users whose subscription expires in exactly 3 days or 1 day.
        """
        now = datetime.utcnow()

        # 1. Check for 3-day warning
        three_days_start = now + timedelta(days=3)
        three_days_end = three_days_start + timedelta(hours=1)

        stmt_3d = select(Partner).where(
            Partner.is_pro,
            Partner.pro_expires_at >= three_days_start,
            Partner.pro_expires_at < three_days_end
        )
        res_3d = await session.exec(stmt_3d)
        for partner in res_3d.all():
            await self.send_expiration_warning(partner, 3)

        # 2. Check for 1-day warning
        one_day_start = now + timedelta(days=1)
        one_day_end = one_day_start + timedelta(hours=1)

        stmt_1d = select(Partner).where(
            Partner.is_pro,
            Partner.pro_expires_at >= one_day_start,
            Partner.pro_expires_at < one_day_end
        )
        res_1d = await session.exec(stmt_1d)
        for partner in res_1d.all():
            await self.send_expiration_warning(partner, 1)

        # 3. Handle actually expired
        stmt_expired = select(Partner).where(
            Partner.is_pro,
            Partner.pro_expires_at < now
        )
        res_expired = await session.exec(stmt_expired)
        for partner in res_expired.all():
            partner.is_pro = False
            session.add(partner)
            await self.send_expired_notification(partner)

        await session.commit()

    async def send_expiration_warning(self, partner: Partner, days_left: int):
        text = (
            f"⚠️ *PRO Subscription Notice*\n\n"
            f"Your PRO membership will expire in *{days_left} day{'s' if days_left > 1 else ''}*.\n\n"
            f"💰 *Price to Extend:* $39\n\n"
            f"Extend it now to keep all your premium benefits and affiliate bonuses!\n"
            f"👉 Use /start and click 'Open App' to go to the Subscription section."
        )
        # In a real bot, we'd add an Inline Keyboard with an "Extend" button
        # For now, we use the notification service which supports Markdown
        await notification_service.enqueue_notification(int(partner.telegram_id), text)

    async def send_expired_notification(self, partner: Partner):
        text = (
            "❌ *Subscription Expired*\n\n"
            "Your PRO membership has expired. You have lost access to premium features.\n\n"
            "👉 Use /start and click 'Open App' to re-activate your PRO status for $39."
        )
        await notification_service.enqueue_notification(int(partner.telegram_id), text)

    async def run_checker_task(self):
        """
        Background task that runs the checker every hour.
        """
        logger.info("🕒 Subscription Checker Started")
        while True:
            try:
                # We need to create a session manually since this is a background task
                from app.models.partner import engine
                async with AsyncSession(engine) as session:
                    await self.check_expiring_subscriptions(session)
            except Exception as e:
                logger.error(f"Error in Subscription Checker: {e}")

            await asyncio.sleep(3600) # Check every hour

subscription_service = SubscriptionService()

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.config import settings
from app.core.i18n import get_msg
from app.models.partner import Partner
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

class SubscriptionService:
    async def check_expiring_subscriptions(self, session: AsyncSession):
        """
        Finds users whose subscription expires in exactly 3 days or 1 day.
        """
        now = datetime.now(UTC)

        # 1. Check for 5-day warning
        five_days_start = now + timedelta(days=5)
        five_days_end = five_days_start + timedelta(hours=1)

        stmt_5d = select(Partner).where(
            Partner.is_pro,
            Partner.pro_expires_at >= five_days_start,
            Partner.pro_expires_at < five_days_end
        )
        res_5d = await session.exec(stmt_5d)
        for partner in res_5d.all():
            await self.send_expiration_warning(partner, 5)

        # 2. Check for 3-day warning
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

        # 3. Check for 1-day warning
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

        # 4. Handle actually expired
        # #comment: Phase 4: Chunked processing to prevent OOM at 200K users.
        # At scale, many subscriptions may expire simultaneously (e.g., after a promo batch).
        CHUNK = 500
        offset = 0
        while True:
            stmt_expired = (
                select(Partner)
                .where(
                    Partner.is_pro,
                    Partner.pro_expires_at < now,
                    Partner.subscription_plan != "PRO_LIFETIME"
                )
                .order_by(Partner.id)
                .offset(offset)
                .limit(CHUNK)
            )
            expired_chunk = (await session.exec(stmt_expired)).all()
            if not expired_chunk:
                break

            from app.services.audit_service import audit_service
            from app.services.redis_service import redis_service

            for partner in expired_chunk:
                partner.is_pro = False
                last_plan = partner.subscription_plan or "PRO"
                partner.subscription_plan = None
                session.add(partner)

                await audit_service.log_payment(
                    session=session,
                    partner_id=partner.id,
                    transaction_id=0,
                    amount=0.0,
                    currency="USD",
                    plan=last_plan,
                    status="expired"
                )

                try:
                    await redis_service.delete_partner_profile(partner.telegram_id, partner.id)
                except Exception as e:
                    logger.warning(f"Failed to invalidate cache for expired user {partner.telegram_id}: {e}")

                await self.send_expired_notification(partner)

            # Commit each chunk to avoid long-running transactions
            await session.commit()
            offset += CHUNK
            if len(expired_chunk) < CHUNK:
                break

    async def send_expiration_warning(self, partner: Partner, days_left: int):
        lang = partner.language_code or "en"
        text = get_msg(lang, "sub_warning_body", days=days_left, price=settings.PRO_PRICE_USD)
        title = get_msg(lang, "sub_warning_title")
        full_text = f"{title}\n\n{text}"
        
        buttons = [[
            {"text": get_msg(lang, "btn_extend_sub"), "web_app": {"url": settings.FRONTEND_URL}},
            {"text": get_msg(lang, "btn_open_app"), "web_app": {"url": settings.FRONTEND_URL}}
        ]]
        await notification_service.send_standard(str(partner.telegram_id), full_text, buttons=buttons)

    async def send_expired_notification(self, partner: Partner):
        lang = partner.language_code or "en"
        text = get_msg(lang, "sub_expired_body")
        title = get_msg(lang, "sub_expired_title")
        full_text = f"{title}\n\n{text}"
        
        buttons = [[
            {"text": get_msg(lang, "btn_reactivate_sub"), "web_app": {"url": settings.FRONTEND_URL}},
            {"text": get_msg(lang, "btn_open_app"), "web_app": {"url": settings.FRONTEND_URL}}
        ]]
        await notification_service.send_critical(str(partner.telegram_id), full_text, buttons=buttons)

    async def run_checker_task(self):
        """
        #comment: This method is now DEPRECATED in favor of the TaskIQ 'check_expiring_subscriptions_task'.
        It remains here for fallback/dev purposes but is no longer called in main.py lifespan.
        """
        logger.info("🕒 DEPRECATED: Subscription Checker Local Loop")
        while True:
            try:
                from app.models.partner import async_session_maker
                async with async_session_maker() as session:
                    await self.check_expiring_subscriptions(session)
            except Exception as e:
                logger.error(f"Error in Subscription Checker: {e}")

            await asyncio.sleep(3600)

subscription_service = SubscriptionService()

# #comment: CRITICAL FIX — @broker.task MUST be a module-level function, NOT an instance method.
# TaskIQ cannot serialize `self` when enqueueing. Moving to module-level fixes silent task failures.
@broker.task(task_name="check_expiring_subscriptions_task", schedule=[{"cron": "0 * * * *"}])
async def check_expiring_subscriptions_task():
    """
    Scheduled task: checks expiring/expired PRO subscriptions every hour.
    Runs once per cluster (not per worker) via TaskIQ distributed locking.
    """
    from app.models.partner import async_session_maker
    # async_session_maker uses expire_on_commit=False — prevents MissingGreenlet after commits
    async with async_session_maker() as session:
        await subscription_service.check_expiring_subscriptions(session)

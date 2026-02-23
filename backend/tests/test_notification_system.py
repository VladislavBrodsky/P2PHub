"""
Comprehensive Notification & Commission Tests.

Tests cover:
1. Core notification service (enqueue, skip, fallback)
2. Commission payouts for each plan (Free / PRO / PRO+) across all 20 levels
3. XP referral notifications per plan type

Commission table (config.py):
  L1: 30%   L2: 10%   L3: 3%
  L4-L10: 1% each          (PRO required for L4+)
  L11-L20: 0.6% each       (PRO+ required for L11+)

Qualification rules:
  Free  -> L1-L3 unlocked
  PRO   -> L1-L9 unlocked
  PRO+  -> L1-L20 unlocked (all)
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.services.notification_service import notification_service, send_telegram_task
from app.services.referral_service import (
    distribute_pro_commissions,
    process_referral_logic,
)

# ---------------------------------------------------------------------------
# 1. Core Notification Service
# ---------------------------------------------------------------------------

class TestNotificationEnqueue:
    """Core tests for notification service enqueueing."""

    async def test_enqueue_valid_notification(self):
        """kiq is called once with correct payload dict."""
        from app.services.notification_service import NotificationService
        from app.services.rate_limit_service import rate_limit_service
        
        # 1. Restore the REAL method (bypassing conftest.py's autouse mock)
        real_enqueue = NotificationService.enqueue_notification
        original_instance_enqueue = notification_service.enqueue_notification
        notification_service.enqueue_notification = real_enqueue.__get__(notification_service, NotificationService)

        original_kiq = send_telegram_task.kiq
        send_telegram_task.kiq = AsyncMock(return_value=None)
        
        original_is_dup = rate_limit_service.is_duplicate
        rate_limit_service.is_duplicate = AsyncMock(return_value=False)
        original_is_blocked = rate_limit_service.is_blocked
        rate_limit_service.is_blocked = AsyncMock(return_value=False)

        try:
            await notification_service.enqueue_notification(
                chat_id=12345,
                text="Test message",
                parse_mode="Markdown"
            )
            send_telegram_task.kiq.assert_called_once()
            payload = send_telegram_task.kiq.call_args[0][0]
            assert payload["chat_id"] == "12345"
            assert payload["text"] == "Test message"
            assert payload["priority"] == "medium"
        finally:
            send_telegram_task.kiq = original_kiq
            rate_limit_service.is_duplicate = original_is_dup
            rate_limit_service.is_blocked = original_is_blocked
            notification_service.enqueue_notification = original_instance_enqueue

    async def test_priority_methods(self):
        """Verifies that send_critical/standard/low_prio set correct priority and dedup flags."""
        from app.services.notification_service import (
            NotificationService,
            notification_service,
        )
        
        # 1. Restore REAL methods (bypassing conftest.py) for testing the internal logic
        r_critical = NotificationService.send_critical
        r_standard = NotificationService.send_standard
        r_low      = NotificationService.send_low_prio

        orig_enqueue = notification_service.enqueue_notification
        orig_crit    = notification_service.send_critical
        orig_std     = notification_service.send_standard
        orig_low     = notification_service.send_low_prio

        # Patch instance with REAL logic but mock the destination (enqueue_notification)
        notification_service.enqueue_notification = AsyncMock()
        notification_service.send_critical = r_critical.__get__(notification_service, NotificationService)
        notification_service.send_standard = r_standard.__get__(notification_service, NotificationService)
        notification_service.send_low_prio = r_low.__get__(notification_service, NotificationService)

        try:
            # Critical should bypass dedup by default and be high priority
            await notification_service.send_critical(123, "Critical")
            notification_service.enqueue_notification.assert_called_with(
                "123", "Critical", parse_mode="Markdown", buttons=None, priority="high", bypass_dedup=True, salt=""
            )

            # Standard should NOT bypass dedup and be medium priority
            await notification_service.send_standard(123, "Standard")
            notification_service.enqueue_notification.assert_called_with(
                "123", "Standard", parse_mode="Markdown", buttons=None, priority="medium", bypass_dedup=False, salt=""
            )

            # Low Prio should NOT bypass dedup and be low priority
            await notification_service.send_low_prio(123, "Low")
            notification_service.enqueue_notification.assert_called_with(
                "123", "Low", parse_mode="Markdown", buttons=None, priority="low", bypass_dedup=False, salt=""
            )
        finally:
            notification_service.enqueue_notification = orig_enqueue
            notification_service.send_critical = orig_crit
            notification_service.send_standard = orig_std
            notification_service.send_low_prio = orig_low


# ---------------------------------------------------------------------------
# 2. Free User — L1-L3 Unlocked, L4+ Locked
# ---------------------------------------------------------------------------

class TestFreeUserNotifications:
    """Free plan: commission L1=30%, L2=10%, L3=3%, L4+ locked."""

    async def test_free_l1_commission(self, session: AsyncSession, create_referral_chain):
        """L1 Free user receives 30% ($11.70 of $39)."""
        chain = await create_referral_chain(levels=2)
        await distribute_pro_commissions(session, chain[1].id, 39.0)
        await session.commit()
        await session.refresh(chain[0])
        assert abs(chain[0].balance - 39.0 * 0.30) < 0.01

    async def test_free_l2_commission(self, session: AsyncSession, create_referral_chain):
        """L2 Free user receives 10% ($3.90 of $39)."""
        chain = await create_referral_chain(levels=3)
        await distribute_pro_commissions(session, chain[2].id, 39.0)
        await session.commit()
        for u in chain[:2]:
            await session.refresh(u)
        assert abs(chain[1].balance - 39.0 * 0.30) < 0.01, "L1: 30%"
        assert abs(chain[0].balance - 39.0 * 0.10) < 0.01, "L2: 10%"

    async def test_free_l3_commission(self, session: AsyncSession, create_referral_chain):
        """L3 Free user receives 3% ($1.17 of $39)."""
        chain = await create_referral_chain(levels=4)
        await distribute_pro_commissions(session, chain[3].id, 39.0)
        await session.commit()
        for u in chain[:3]:
            await session.refresh(u)
        assert abs(chain[2].balance - 39.0 * 0.30) < 0.01, "L1: 30%"
        assert abs(chain[1].balance - 39.0 * 0.10) < 0.01, "L2: 10%"
        assert abs(chain[0].balance - 39.0 * 0.03) < 0.01, "L3: 3%"

    async def test_free_l4_locked(self, session: AsyncSession, create_referral_chain):
        """L4 position for Free user → $0 (commission compresses to company)."""
        chain = await create_referral_chain(levels=5)
        await distribute_pro_commissions(session, chain[4].id, 39.0)
        await session.commit()
        await session.refresh(chain[0])  # L4 position
        assert chain[0].balance == 0.0, f"L4 Free should get $0, got ${chain[0].balance}"

    async def test_free_user_xp_notifications_l1_to_l3(
        self, session: AsyncSession, create_referral_chain
    ):
        """Free chain: exactly 3 XP notifications sent (L1, L2, L3)."""
        chain = await create_referral_chain(levels=4)  # [L3, L2, L1, buyer]
        notification_service.send_low_prio.reset_mock()
        await process_referral_logic(chain[3].id)
        count = notification_service.send_low_prio.call_count
        assert count == 3, f"Expected 3 XP notifications for Free L3 chain, got {count}"


# ---------------------------------------------------------------------------
# 3. PRO User — L1-L9 Unlocked, L10+ Locked
# ---------------------------------------------------------------------------

class TestPROUserNotifications:
    """PRO plan: L1-L9 unlocked (1% for L4-L9), L10+ locked."""

    async def test_pro_all_9_levels_commission(
        self, session: AsyncSession, create_referral_chain
    ):
        """All 9 levels receive correct commission for PRO buyer."""
        chain = await create_referral_chain(levels=10, make_pro=list(range(10)))
        await distribute_pro_commissions(session, chain[9].id, 39.0)
        await session.commit()
        for u in chain[:9]:
            await session.refresh(u)

        # chain[9]=buyer, chain[8]=L1, ..., chain[0]=L9
        rates = {8: 0.30, 7: 0.10, 6: 0.03,
                 5: 0.01, 4: 0.01, 3: 0.01, 2: 0.01, 1: 0.01, 0: 0.01}
        for idx, rate in rates.items():
            lvl = 9 - idx
            expected = 39.0 * rate
            actual = chain[idx].balance
            assert abs(actual - expected) < 0.01, \
                f"L{lvl} PRO: expected ${expected:.3f}, got ${actual:.3f}"

    async def test_pro_l10_locked(self, session: AsyncSession, create_referral_chain):
        """PRO (non-PRO+) user at L10 gets $0."""
        chain = await create_referral_chain(levels=11, make_pro=list(range(11)))
        # All have is_pro=True but subscription_plan is NOT "PRO_PLUS_MONTHLY"
        await distribute_pro_commissions(session, chain[10].id, 39.0)
        await session.commit()
        await session.refresh(chain[0])  # L10 position
        assert chain[0].balance == 0.0, \
            f"L10 PRO (non-PRO+) should get $0, got ${chain[0].balance}"

    async def test_pro_user_xp_notifications_l1_to_l9(
        self, session: AsyncSession, create_referral_chain
    ):
        """PRO chain (10 levels): exactly 9 XP notifications (L1-L9)."""
        chain = await create_referral_chain(levels=10, make_pro=list(range(10)))
        notification_service.send_low_prio.reset_mock()
        await process_referral_logic(chain[9].id)
        count = notification_service.send_low_prio.call_count
        assert count == 9, f"Expected 9 XP notifications for PRO, got {count}"

    async def test_pro_fomo_notification_at_l4_boundary(
        self, session: AsyncSession, create_referral_chain
    ):
        """Free user at L4 boundary receives FOMO upgrade notification."""
        # 5-level chain, no one is PRO → chain[0] is L4 (Free, locked)
        chain = await create_referral_chain(levels=5)
        notification_service.send_low_prio.reset_mock()
        notification_service.send_critical.reset_mock()
        await process_referral_logic(chain[4].id)
        
        xp_notifs = notification_service.send_low_prio.call_count
        fomo_notifs = notification_service.send_critical.call_count
        assert xp_notifs >= 3, f"Expected at least 3 XP notifications, got {xp_notifs}"
        assert fomo_notifs >= 1, f"Expected at least 1 FOMO notification, got {fomo_notifs}"


# ---------------------------------------------------------------------------
# 4. PRO+ User — All 20 Levels Unlocked
# ---------------------------------------------------------------------------

class TestProPlusUserNotifications:
    """PRO+ plan: all 20 levels unlocked (L10-L20 = 0.6% each)."""

    async def _make_chain_pro_plus(self, session, chain):
        for user in chain:
            user.is_pro = True
            user.subscription_plan = "PRO_PLUS_MONTHLY"
            session.add(user)
        await session.commit()

    async def test_pro_plus_l10_unlocked(
        self, session: AsyncSession, create_referral_chain
    ):
        """PRO+ user at L10 receives 1% commission."""
        chain = await create_referral_chain(levels=11)
        await self._make_chain_pro_plus(session, chain)
        await distribute_pro_commissions(session, chain[10].id, 69.0)
        await session.commit()
        await session.refresh(chain[0])  # L10 position
        assert abs(chain[0].balance - 69.0 * 0.01) < 0.01, \
            f"L10 PRO+: expected ${69.0*0.01:.3f}, got ${chain[0].balance}"

    async def test_pro_plus_l11_to_l20_commission(
        self, session: AsyncSession, create_referral_chain
    ):
        """PRO+ users at L11-L20 each receive 0.6% commission."""
        chain = await create_referral_chain(levels=21)
        await self._make_chain_pro_plus(session, chain)

        pro_plus_amount = 69.0
        await distribute_pro_commissions(session, chain[20].id, pro_plus_amount)
        await session.commit()

        for u in chain:
            await session.refresh(u)

        # chain[20]=buyer, chain[19]=L1, ..., chain[0]=L20
        # L1  = chain[19]: 30%
        assert abs(chain[19].balance - pro_plus_amount * 0.30) < 0.01, "L1 PRO+"
        # L2  = chain[18]: 10%
        assert abs(chain[18].balance - pro_plus_amount * 0.10) < 0.01, "L2 PRO+"
        # L3  = chain[17]: 3%
        assert abs(chain[17].balance - pro_plus_amount * 0.03) < 0.01, "L3 PRO+"
        # L4-L10 = chain[16] down to chain[10]: 1% each
        for i in range(10, 17):
            lvl = 20 - i  # chain[16]=L4, chain[10]=L10
            assert abs(chain[i].balance - pro_plus_amount * 0.01) < 0.001, \
                f"L{lvl} PRO+ (idx {i}): expected ${pro_plus_amount*0.01:.4f}, got ${chain[i].balance}"
        # L11-L20 = chain[9] down to chain[0]: 0.6% each
        for i in range(0, 10):
            lvl = 20 - i  # chain[9]=L11, chain[0]=L20
            assert abs(chain[i].balance - pro_plus_amount * 0.006) < 0.001, \
                f"L{lvl} PRO+ (idx {i}): expected ${pro_plus_amount*0.006:.4f}, got ${chain[i].balance}"

    async def test_pro_plus_xp_notifications_all_20_levels(
        self, session: AsyncSession, create_referral_chain
    ):
        """PRO+ chain (21 levels): exactly 20 XP notifications."""
        chain = await create_referral_chain(levels=21)
        await self._make_chain_pro_plus(session, chain)
        notification_service.send_low_prio.reset_mock()
        await process_referral_logic(chain[20].id)
        count = notification_service.send_low_prio.call_count
        assert count == 20, f"Expected 20 XP notifications for PRO+ L20 chain, got {count}"

    async def test_pro_plus_payout_totals(
        self, session: AsyncSession, create_referral_chain
    ):
        """Sum of all 20 level commissions for PRO+ must equal expected total."""
        chain = await create_referral_chain(levels=21)
        await self._make_chain_pro_plus(session, chain)

        amount = 69.0
        await distribute_pro_commissions(session, chain[20].id, amount)
        await session.commit()

        for u in chain:
            await session.refresh(u)

        total_paid = sum(u.balance for u in chain[:20])
        expected_total = round(
            amount * (0.30 + 0.10 + 0.03)          # L1-L3
            + amount * 0.01 * 7                      # L4-L10 (7 levels)
            + amount * 0.006 * 10,                   # L11-L20 (10 levels)
            4
        )
        assert abs(total_paid - expected_total) < 0.05, \
            f"Total paid ${total_paid:.4f} vs expected ${expected_total:.4f}"


# ---------------------------------------------------------------------------
# 5. PRO ($39) vs PRO+ ($69) — Same Rates, Different Base Amounts
# ---------------------------------------------------------------------------

class TestProVsProPlusAmounts:
    """Verify dollar amounts match the product table for both price points."""

    async def test_pro_l1_dollar_amount(self, session: AsyncSession, create_referral_chain):
        """PRO $39 → L1 gets $11.70 (30%)."""
        chain = await create_referral_chain(levels=2)
        await distribute_pro_commissions(session, chain[1].id, 39.0)
        await session.commit()
        await session.refresh(chain[0])
        assert abs(chain[0].balance - 11.70) < 0.01, \
            f"L1 of $39 PRO: expected $11.70, got ${chain[0].balance:.2f}"

    async def test_pro_plus_l1_dollar_amount(self, session: AsyncSession, create_referral_chain):
        """PRO+ $69 → L1 gets $20.70 (30%)."""
        chain = await create_referral_chain(levels=2)
        await distribute_pro_commissions(session, chain[1].id, 69.0)
        await session.commit()
        await session.refresh(chain[0])
        assert abs(chain[0].balance - 20.70) < 0.01, \
            f"L1 of $69 PRO+: expected $20.70, got ${chain[0].balance:.2f}"

    async def test_pro_l3_dollar_amount(self, session: AsyncSession, create_referral_chain):
        """PRO $39 → L3 gets $1.17 (3%)."""
        chain = await create_referral_chain(levels=4)
        await distribute_pro_commissions(session, chain[3].id, 39.0)
        await session.commit()
        await session.refresh(chain[0])
        assert abs(chain[0].balance - 1.17) < 0.01, \
            f"L3 of $39 PRO: expected $1.17, got ${chain[0].balance:.2f}"

    async def test_pro_plus_l3_dollar_amount(self, session: AsyncSession, create_referral_chain):
        """PRO+ $69 → L3 gets $2.07 (3%)."""
        chain = await create_referral_chain(levels=4)
        await distribute_pro_commissions(session, chain[3].id, 69.0)
        await session.commit()
        await session.refresh(chain[0])
        assert abs(chain[0].balance - 2.07) < 0.01, \
            f"L3 of $69 PRO+: expected $2.07, got ${chain[0].balance:.2f}"

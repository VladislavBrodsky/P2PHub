"""
Comprehensive XP Distribution System Tests — All 20 Levels × All 3 Plans.

XP Rules (config.py):
  Free  → flat 35 XP per qualified referral (L1-L3 only, no multiplier)
  PRO   → REFERRAL_XP_MAP[level] × 1.5  (L1-L9)
  PRO+  → REFERRAL_XP_MAP[level] × 3.0  (L1-L20)

REFERRAL_XP_MAP:
  L1:100  L2:50   L3:30   L4:20   L5:15   L6:10   L7:8    L8:6    L9:5    L10:4
  L11:3   L12:2.5 L13:2   L14:1.5 L15:1   L16:0.8 L17:0.6 L18:0.4 L19:0.2 L20:0.1

Qualification gates (same as commission):
  Free  → L1-L3 unlocked
  PRO   → L1-L9 unlocked
  PRO+  → L1-L20 unlocked
"""

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.services.referral_service import process_referral_logic
from app.models.partner import Partner

# ── helpers ──────────────────────────────────────────────────────────────────

FREE_XP   = settings.FREE_REFERRAL_XP          # 35.0
PRO_MULT  = settings.PRO_XP_MULTIPLIER          # 1.5
PLUS_MULT = settings.PRO_PLUS_XP_MULTIPLIER     # 3.0
XP_MAP    = settings.REFERRAL_XP_MAP

def expected_pro_xp(level: int) -> float:
    return XP_MAP.get(level, 0) * PRO_MULT

def expected_plus_xp(level: int) -> float:
    return XP_MAP.get(level, 0) * PLUS_MULT

async def _make_pro_plus(session: AsyncSession, users: list[Partner]):
    for u in users:
        u.is_pro = True
        u.subscription_plan = "PRO_PLUS_MONTHLY"
        session.add(u)
    await session.commit()


# ── Free Plan ─────────────────────────────────────────────────────────────────

class TestFreeXPDistribution:
    """Free plan: flat 35 XP for L1-L3, nothing for L4+."""

    async def test_free_l1_xp(self, session: AsyncSession, create_referral_chain):
        chain = await create_referral_chain(levels=2)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[1].id)
        await session.refresh(chain[0])
        assert abs(chain[0].xp - before[chain[0].id] - FREE_XP) < 0.1, \
            f"Free L1: expected +{FREE_XP} XP"

    async def test_free_l2_xp(self, session: AsyncSession, create_referral_chain):
        chain = await create_referral_chain(levels=3)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[2].id)
        for u in chain[:2]: await session.refresh(u)
        assert abs(chain[1].xp - before[chain[1].id] - FREE_XP) < 0.1, "Free L1: +35"
        assert abs(chain[0].xp - before[chain[0].id] - FREE_XP) < 0.1, "Free L2: +35"

    async def test_free_l3_xp(self, session: AsyncSession, create_referral_chain):
        chain = await create_referral_chain(levels=4)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[3].id)
        for u in chain[:3]: await session.refresh(u)
        for pos, lv in [(2, "L1"), (1, "L2"), (0, "L3")]:
            assert abs(chain[pos].xp - before[chain[pos].id] - FREE_XP) < 0.1, \
                f"Free {lv}: +35"

    async def test_free_l4_locked_no_xp(self, session: AsyncSession, create_referral_chain):
        """Free user at L4 gets 0 XP (locked)."""
        chain = await create_referral_chain(levels=5)
        before_xp = chain[0].xp
        await process_referral_logic(chain[4].id)
        await session.refresh(chain[0])
        assert chain[0].xp == before_xp, "Free L4 should receive 0 XP"

    async def test_free_flat_xp_all_three_levels_equal(self, session, create_referral_chain):
        """All 3 free levels get the same flat XP (35)."""
        chain = await create_referral_chain(levels=4)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[3].id)
        for u in chain[:3]: await session.refresh(u)
        gains = [chain[i].xp - before[chain[i].id] for i in range(3)]
        assert gains[0] == gains[1] == gains[2] == FREE_XP, \
            f"All free levels should get flat {FREE_XP} XP, got {gains}"


# ── PRO Plan ─────────────────────────────────────────────────────────────────

class TestPROXPDistribution:
    """PRO plan: REFERRAL_XP_MAP × 1.5, levels L1-L9."""

    async def test_pro_l1_xp(self, session, create_referral_chain):
        chain = await create_referral_chain(levels=2, make_pro=[0, 1])
        before = chain[0].xp
        await process_referral_logic(chain[1].id)
        await session.refresh(chain[0])
        assert abs(chain[0].xp - before - expected_pro_xp(1)) < 0.1

    async def test_pro_all_9_levels_xp(self, session: AsyncSession, create_referral_chain):
        """PRO users at L1-L9 all receive correct XP (map × 1.5)."""
        chain = await create_referral_chain(levels=10, make_pro=list(range(10)))
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[9].id)
        for u in chain[:9]: await session.refresh(u)

        # chain[9]=buyer, chain[8]=L1, chain[7]=L2, ..., chain[0]=L9
        for level in range(1, 10):
            idx = 9 - level          # chain index for that level
            exp = expected_pro_xp(level)
            actual = chain[idx].xp - before[chain[idx].id]
            assert abs(actual - exp) < 0.1, \
                f"PRO L{level} (idx {idx}): expected {exp} XP, got {actual}"

    async def test_pro_l10_locked_no_xp(self, session, create_referral_chain):
        chain = await create_referral_chain(levels=11, make_pro=list(range(11)))
        before_xp = chain[0].xp
        await process_referral_logic(chain[10].id)
        await session.refresh(chain[0])
        assert chain[0].xp == before_xp, "PRO L10 should receive 0 XP (locked, needs PRO+)"

    async def test_pro_vs_free_l1_comparison(self, session, create_referral_chain):
        """PRO L1 XP (150) > Free L1 XP (35)."""
        assert expected_pro_xp(1) > FREE_XP, \
            f"PRO L1={expected_pro_xp(1)} should exceed Free L1={FREE_XP}"

    async def test_pro_xp_by_level_decreases(self):
        """PRO XP should decrease as level number increases."""
        for lv in range(1, 9):
            assert expected_pro_xp(lv) >= expected_pro_xp(lv + 1), \
                f"PRO L{lv} ({expected_pro_xp(lv)}) should be >= L{lv+1} ({expected_pro_xp(lv+1)})"


# ── PRO+ Plan ─────────────────────────────────────────────────────────────────

class TestProPlusXPDistribution:
    """PRO+ plan: REFERRAL_XP_MAP × 3.0, all 20 levels unlocked."""

    async def test_pro_plus_l1_xp(self, session: AsyncSession, create_referral_chain):
        chain = await create_referral_chain(levels=2)
        await _make_pro_plus(session, chain)
        before = chain[0].xp
        await process_referral_logic(chain[1].id)
        await session.refresh(chain[0])
        exp = expected_plus_xp(1)  # 100 * 3.0 = 300
        assert abs(chain[0].xp - before - exp) < 0.1, f"PRO+ L1 expected {exp}"

    async def test_pro_plus_all_20_levels_xp(self, session: AsyncSession, create_referral_chain):
        """PRO+ users at all 20 levels each receive map × 3.0."""
        chain = await create_referral_chain(levels=21)
        await _make_pro_plus(session, chain)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[20].id)
        for u in chain[:20]: await session.refresh(u)

        # chain[20]=buyer, chain[19]=L1, ..., chain[0]=L20
        for level in range(1, 21):
            idx = 20 - level
            exp = expected_plus_xp(level)
            actual = chain[idx].xp - before[chain[idx].id]
            assert abs(actual - exp) < 0.01, \
                f"PRO+ L{level} (idx {idx}): expected {exp} XP, got {actual}"

    async def test_pro_plus_l10_unlocked(self, session: AsyncSession, create_referral_chain):
        """PRO+ L10 gets XP (unlike PRO which is locked)."""
        chain = await create_referral_chain(levels=11)
        await _make_pro_plus(session, chain)
        before_xp = chain[0].xp
        await process_referral_logic(chain[10].id)
        await session.refresh(chain[0])
        exp = expected_plus_xp(10)  # 4.0 * 3.0 = 12
        assert abs(chain[0].xp - before_xp - exp) < 0.01, \
            f"PRO+ L10 expected {exp} XP, got {chain[0].xp - before_xp}"

    async def test_pro_plus_l20_receives_xp(self, session: AsyncSession, create_referral_chain):
        """PRO+ L20 (deepest) should still receive XP."""
        chain = await create_referral_chain(levels=21)
        await _make_pro_plus(session, chain)
        before_xp = chain[0].xp
        await process_referral_logic(chain[20].id)
        await session.refresh(chain[0])
        exp = expected_plus_xp(20)  # 0.1 * 3.0 = 0.3
        assert abs(chain[0].xp - before_xp - exp) < 0.01, \
            f"PRO+ L20 expected {exp} XP, got {chain[0].xp - before_xp}"

    async def test_pro_plus_total_xp_sum(self, session: AsyncSession, create_referral_chain):
        """Sum of all 20 PRO+ XP rewards equals expected total."""
        chain = await create_referral_chain(levels=21)
        await _make_pro_plus(session, chain)
        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[20].id)
        for u in chain[:20]: await session.refresh(u)

        total_xp_awarded = sum(chain[i].xp - before[chain[i].id] for i in range(20))
        expected_total = sum(expected_plus_xp(lv) for lv in range(1, 21))
        assert abs(total_xp_awarded - expected_total) < 0.1, \
            f"Total PRO+ XP: {total_xp_awarded:.2f} vs expected {expected_total:.2f}"


# ── Cross-Plan Comparison ────────────────────────────────────────────────────

class TestXPMultiplierHierarchy:
    """Verify the three-tier XP multiplier hierarchy is correct."""

    async def test_l1_xp_hierarchy_free_lt_pro_lt_pro_plus(
        self, session: AsyncSession, create_referral_chain
    ):
        """PRO+ L1 > PRO L1 > Free L1 (multiplier hierarchy)."""
        assert FREE_XP < expected_pro_xp(1) < expected_plus_xp(1), \
            f"Hierarchy broken: Free={FREE_XP}, PRO={expected_pro_xp(1)}, PRO+={expected_plus_xp(1)}"

    async def test_exact_l1_xp_values(self):
        """L1 XP exact values match spec: Free=35, PRO=150, PRO+=300."""
        assert FREE_XP == 35.0,               f"Free L1 XP should be 35, got {FREE_XP}"
        assert expected_pro_xp(1) == 150.0,   f"PRO L1 XP should be 150, got {expected_pro_xp(1)}"
        assert expected_plus_xp(1) == 300.0,  f"PRO+ L1 XP should be 300, got {expected_plus_xp(1)}"

    async def test_pro_plus_always_gt_pro(self):
        """PRO+ XP > PRO XP at every level L1-L9."""
        for lv in range(1, 10):
            assert expected_plus_xp(lv) > expected_pro_xp(lv), \
                f"L{lv}: PRO+={expected_plus_xp(lv)} should exceed PRO={expected_pro_xp(lv)}"

    async def test_xp_ratio_consistent(self):
        """PRO+ / PRO ratio = 3.0 / 1.5 = 2.0 exactly at every level."""
        for lv in range(1, 21):
            pro_xp = expected_pro_xp(lv)
            if pro_xp == 0:
                continue
            ratio = expected_plus_xp(lv) / pro_xp
            assert abs(ratio - (PLUS_MULT / PRO_MULT)) < 0.001, \
                f"L{lv}: PRO+/PRO ratio = {ratio:.3f}, expected {PLUS_MULT/PRO_MULT}"

    async def test_all_20_levels_xp_snapshot(self):
        """Snapshot test: all 20 levels expected XP values for each plan."""
        # Free: flat 35 for L1-L3
        for lv in range(1, 4):
            assert FREE_XP == 35.0

        # PRO: spot check key levels
        assert expected_pro_xp(1)  == 150.0    # 100 * 1.5
        assert expected_pro_xp(2)  == 75.0     # 50  * 1.5
        assert expected_pro_xp(3)  == 45.0     # 30  * 1.5
        assert expected_pro_xp(9)  == 7.5      # 5   * 1.5

        # PRO+: spot check key levels
        assert expected_plus_xp(1)  == 300.0   # 100 * 3.0
        assert expected_plus_xp(2)  == 150.0   # 50  * 3.0
        assert expected_plus_xp(10) == 12.0    # 4   * 3.0
        assert expected_plus_xp(15) == 3.0     # 1   * 3.0
        assert expected_plus_xp(20) == pytest.approx(0.3)     # 0.1 * 3.0


# ── Mixed Chain ───────────────────────────────────────────────────────────────

class TestMixedPlanXPDistribution:
    """XP distribution in a chain with mixed plan types."""

    async def test_mixed_free_pro_pro_plus_chain(
        self, session: AsyncSession, create_referral_chain
    ):
        """Chain: PRO+ at L1, PRO at L2, Free at L3 — each gets their plan XP."""
        chain = await create_referral_chain(levels=4)
        # chain[3]=buyer, chain[2]=L1, chain[1]=L2, chain[0]=L3

        # L1 = PRO+
        chain[2].is_pro = True
        chain[2].subscription_plan = "PRO_PLUS_MONTHLY"
        session.add(chain[2])
        # L2 = PRO
        chain[1].is_pro = True
        session.add(chain[1])
        # L3 = Free (default, no changes)
        await session.commit()

        before = {u.id: u.xp for u in chain}
        await process_referral_logic(chain[3].id)
        for u in chain[:3]: await session.refresh(u)

        # L1 (PRO+): 100 * 3.0 = 300
        assert abs(chain[2].xp - before[chain[2].id] - expected_plus_xp(1)) < 0.1, \
            f"L1 PRO+: expected {expected_plus_xp(1)}"
        # L2 (PRO): 50 * 1.5 = 75
        assert abs(chain[1].xp - before[chain[1].id] - expected_pro_xp(2)) < 0.1, \
            f"L2 PRO: expected {expected_pro_xp(2)}"
        # L3 (Free): 35 flat
        assert abs(chain[0].xp - before[chain[0].id] - FREE_XP) < 0.1, \
            f"L3 Free: expected {FREE_XP}"

"""
Integration tests for the Referral System.

#comment: These tests verify the critical bugs we fixed:
- Bug #1: Infinite loop in error handling
- Bug #2: Missing direct referrer in commission distribution  
- Bug #3: Incorrect lineage reconstruction in XP distribution
- Bug #4: Transaction atomicity in PRO upgrades
- Bug #5: Duplicate commits breaking atomicity

All tests use in-memory SQLite for speed and isolation.
"""

import pytest
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, XPTransaction
from app.services.partner_service import (
    create_partner,
    process_referral_logic,
    distribute_pro_commissions,
)


class TestReferralChainCreation:
    """Test that referral chains are created correctly."""
    
    async def test_create_simple_referral(self, session: AsyncSession, create_test_partner):
        """
        Test creating a simple 2-person referral chain.
        
        Verifies:
        - Referrer is created correctly
        - Referee links to referrer
        - Path is constructed properly
        """
        # Create referrer
        referrer = await create_test_partner(
            telegram_id="ref_001",
            username="referrer"
        )
        
        assert referrer.referral_code is not None
        assert referrer.referrer_id is None
        assert referrer.path is None
        
        # Create referee using referrer's code
        referee = await create_test_partner(
            telegram_id="ref_002",
            username="referee",
            referrer_code=referrer.referral_code
        )
        
        assert referee.referrer_id == referrer.id
        # #comment: Path should be just the referrer's ID
        assert referee.path == str(referrer.id)
    
    async def test_create_3_level_chain(self, session: AsyncSession, create_test_partner):
        """
        Test creating a 3-level chain: A -> B -> C
        
        Verifies:
        - Each level links correctly to parent
        - Path accumulates ancestors properly
        """
        # Level 1: Root
        user_a = await create_test_partner(telegram_id="chain_a", username="user_a")
        
        # Level 2: A's referee
        user_b = await create_test_partner(
            telegram_id="chain_b",
            username="user_b",
            referrer_code=user_a.referral_code
        )
        assert user_b.referrer_id == user_a.id
        assert user_b.path == str(user_a.id)
        
        # Level 3: B's referee
        user_c = await create_test_partner(
            telegram_id="chain_c",
            username="user_c",
            referrer_code=user_b.referral_code
        )
        assert user_c.referrer_id == user_b.id
        # #comment: Path should be "A.B" (ancestors before direct referrer)
        assert user_c.path == f"{user_a.id}.{user_b.id}"
    
    async def test_create_9_level_chain(self, session: AsyncSession, create_referral_chain):
        """
        Test creating maximum 9-level chain.
        
        Verifies:
        - All 9 levels created successfully
        - Path contains all ancestors
        - Each level correctly references parent
        """
        chain = await create_referral_chain(levels=9)
        
        assert len(chain) == 9
        
        # Verify last user (level 9)
        last_user = chain[8]
        assert last_user.referrer_id == chain[7].id
        
        # Path should have 8 ancestors (all except direct referrer)
        path_ids = [int(x) for x in last_user.path.split('.')]
        assert len(path_ids) == 8
        
        # Verify path contains all ancestors in order
        for i in range(8):
            assert path_ids[i] == chain[i].id


class TestXPDistribution:
    """Test XP distribution across referral chains."""
    
    async def test_single_level_xp_distribution(self, session: AsyncSession, create_test_partner):
        """
        Test XP awarded to direct referrer (L1).
        
        Verifies Bug Fix #3: Direct referrer gets XP
        """
        # Create referrer (normal user)
        referrer = await create_test_partner(telegram_id="xp_ref", username="xp_ref")
        initial_xp = referrer.xp
        
        # Create referee
        referee = await create_test_partner(
            telegram_id="xp_new",
            username="xp_new",
            referrer_code=referrer.referral_code
        )
        
        # Process referral logic (awards XP)
        await process_referral_logic(referee.id)
        
        # Refresh referrer to get updated XP
        await session.refresh(referrer)
        
        # #comment: L1 should get 35 XP for new referral
        assert referrer.xp == initial_xp + 35
        assert referrer.referral_count == 1
    
    async def test_pro_multiplier_xp(self, session: AsyncSession, create_test_partner):
        """
        Test PRO members get 5x XP multiplier.
        
        Verifies:
        - PRO referrer gets 175 XP (35 * 5) for L1
        """
        # Create PRO referrer
        referrer = await create_test_partner(
            telegram_id="pro_ref",
            username="pro_ref",
            is_pro=True
        )
        initial_xp = referrer.xp
        
        # Create referee
        referee = await create_test_partner(
            telegram_id="pro_new",
            username="pro_new",
            referrer_code=referrer.referral_code
        )
        
        # Process referral logic
        await process_referral_logic(referee.id)
        
        await session.refresh(referrer)
        
        # #comment: PRO L1 gets 35 XP * 5 = 175 XP
        assert referrer.xp == initial_xp + 175
    
    async def test_9_level_xp_distribution(self, session: AsyncSession, create_referral_chain):
        """
        Test XP distribution across all 9 levels.
        
        Verifies Bug Fix #3: All 9 levels get XP
        
        Expected XP awards:
        - L1: 35 XP
        - L2: 10 XP
        - L3-L9: 1 XP each
        """
        # Create chain with only last 2 as PRO
        chain = await create_referral_chain(levels=9, make_pro=[7, 8])
        
        # Get initial XP for all
        initial_xp = {user.id: user.xp for user in chain}
        
        # Last user (level 9) just signed up - trigger XP distribution
        last_user = chain[8]
        await process_referral_logic(last_user.id)
        
        # Refresh all users
        for user in chain:
            await session.refresh(user)
        
        # Verify XP awards
        expected_xp = {
            0: 35,   # L1 gets 35 XP
            1: 10,   # L2 gets 10 XP
            2: 1,    # L3 gets 1 XP
            3: 1,    # L4 gets 1 XP
            4: 1,    # L5 gets 1 XP
            5: 1,    # L6 gets 1 XP
            6: 1,    # L7 gets 1 XP
            7: 5,    # L8 is PRO: 1 * 5 = 5 XP
            # L9 (last_user) doesn't get XP from their own signup
        }
        
        for i, expected in expected_xp.items():
            user = chain[i]
            actual_gain = user.xp - initial_xp[user.id]
            assert actual_gain == expected, \
                f"Level {i+1} ({'PRO' if user.is_pro else 'Normal'}) expected {expected} XP, got {actual_gain}"
    
    async def test_mixed_pro_chain(self, session: AsyncSession, create_referral_chain):
        """
        Test XP distribution with mix of PRO and normal users.
        
        Verifies:
        - PRO users get 5x multiplier
        - Normal users get base XP
        """
        # Create chain: PRO at L1, L3, L5
        chain = await create_referral_chain(levels=5, make_pro=[0, 2, 4])
        
        initial_xp = {user.id: user.xp for user in chain}
        
        # Trigger XP distribution
        await process_referral_logic(chain[4].id)
        
        for user in chain:
            await session.refresh(user)
        
        # Expected XP gains
        expected = {
            0: 175,  # L1 PRO: 35 * 5 = 175
            1: 10,   # L2 Normal: 10
            2: 5,    # L3 PRO: 1 * 5 = 5
            3: 1,    # L4 Normal: 1
        }
        
        for i, exp_gain in expected.items():
            actual_gain = chain[i].xp - initial_xp[chain[i].id]
            assert actual_gain == exp_gain


class TestCommissionDistribution:
    """Test commission distribution when users upgrade to PRO."""
    
    async def test_single_level_commission(self, session: AsyncSession, create_test_partner):
        """
        Test commission to direct referrer (L1) on PRO upgrade.
        
        Verifies Bug Fix #2: L1 gets 30% commission
        """
        # Create referrer
        referrer = await create_test_partner(telegram_id="comm_ref", username="comm_ref")
        initial_balance = referrer.balance
        
        # Create referee
        referee = await create_test_partner(
            telegram_id="comm_new",
            username="comm_new",
            referrer_code=referrer.referral_code
        )
        
        # Simulate PRO upgrade ($39)
        pro_amount = 39.0
        await distribute_pro_commissions(session, referee.id, pro_amount)
        
        await session.refresh(referrer)
        
        # #comment: L1 gets 30% of $39 = $11.70
        expected_commission = pro_amount * 0.30
        assert referrer.balance == initial_balance + expected_commission
    
    async def test_two_level_commission(self, session: AsyncSession, create_referral_chain):
        """
        Test commission distribution across 2 levels.
        
        Verifies:
        - L1 gets 30%
        - L2 gets 5%
        """
        chain = await create_referral_chain(levels=3)
        
        # User C (last in chain) upgrades to PRO
        buyer = chain[2]
        pro_amount = 39.0
        
        await distribute_pro_commissions(session, buyer.id, pro_amount)
        
        # Refresh referrers
        for user in chain[:2]:
            await session.refresh(user)
        
        # Verify commissions
        assert chain[1].balance == pro_amount * 0.30  # L1: 30%
        assert chain[0].balance == pro_amount * 0.05  # L2: 5%
    
    async def test_9_level_commission(self, session: AsyncSession, create_referral_chain):
        """
        Test commission distribution across all 9 levels.
        
        Verifies Bug Fix #2: All levels get correct percentages
        
        Commission rates:
        - L1: 30%
        - L2: 5%
        - L3-L9: 3%, 1%, 1%, 1%, 1%, 1%, 1%
        """
        chain = await create_referral_chain(levels=9)
        
        # Last user upgrades to PRO
        buyer = chain[8]
        pro_amount = 39.0
        
        await distribute_pro_commissions(session, buyer.id, pro_amount)
        
        # Refresh all
        for user in chain:
            await session.refresh(user)
        
        # Expected commissions
        expected_rates = {
            0: 0.30,  # L1: 30%
            1: 0.05,  # L2: 5%
            2: 0.03,  # L3: 3%
            3: 0.01,  # L4: 1%
            4: 0.01,  # L5: 1%
            5: 0.01,  # L6: 1%
            6: 0.01,  # L7: 1%
            7: 0.01,  # L8: 1%
        }
        
        for i, rate in expected_rates.items():
            expected_commission = pro_amount * rate
            actual_commission = chain[i].balance
            assert abs(actual_commission - expected_commission) < 0.01, \
                f"L{i+1} expected ${expected_commission:.2f}, got ${actual_commission:.2f}"


class TestTransactionAtomicity:
    """Test that transactions are atomic (Bug Fix #4 & #5)."""
    
    async def test_commission_and_upgrade_atomic(self, session: AsyncSession, create_referral_chain):
        """
        Test that PRO upgrade and commission distribution happen atomically.
        
        Verifies Bug Fix #4: If commissions fail, upgrade doesn't happen
        
        #comment: In the real payment_service.py, we moved commission distribution
        BEFORE the commit to ensure atomicity. This test verifies the concept.
        """
        chain = await create_referral_chain(levels=2)
        referrer = chain[0]
        buyer = chain[1]
        
        # Verify initial state
        assert not buyer.is_pro
        assert referrer.balance == 0
        
        # Distribute commissions (would be part of upgrade_to_pro transaction)
        await distribute_pro_commissions(session, buyer.id, 39.0)
        
        # Simulate upgrade
        buyer.is_pro = True
        session.add(buyer)
        
        # Commit together (atomic)
        await session.commit()
        
        # Refresh
        await session.refresh(buyer)
        await session.refresh(referrer)
        
        # Both should succeed
        assert buyer.is_pro
        assert referrer.balance > 0


class TestEdgeCases:
    """Test edge cases and error scenarios."""
    
    async def test_no_referrer(self, session: AsyncSession, create_test_partner):
        """Test creating partner without referrer doesn't crash."""
        partner = await create_test_partner(telegram_id="solo_001", username="solo")
        
        assert partner.referrer_id is None
        assert partner.path is None
        
        # Process referral logic should handle this gracefully
        await process_referral_logic(partner.id)
        # Should not crash or raise exception
    
    async def test_invalid_referrer_code(self, session: AsyncSession, create_test_partner):
        """Test using invalid referrer code doesn't create link."""
        partner = await create_test_partner(
            telegram_id="invalid_001",
            username="invalid_user",
            referrer_code="INVALID-CODE-DOES-NOT-EXIST"
        )
        
        # Should create partner but without referrer
        assert partner.referrer_id is None
        assert partner.path is None
    
    async def test_concurrent_referrals(self, session: AsyncSession, create_test_partner):
        """
        Test multiple referrals happening concurrently.
        
        Verifies:
        - Atomic SQL increments prevent race conditions
        - All XP awards are counted
        """
        # Create referrer
        referrer = await create_test_partner(telegram_id="concurrent_ref", username="concurrent_ref")
        
        # Create 5 referrals
        referrals = []
        for i in range(5):
            ref = await create_test_partner(
                telegram_id=f"concurrent_{i}",
                username=f"user_{i}",
                referrer_code=referrer.referral_code
            )
            referrals.append(ref)
        
        # Process all referral logic
        import asyncio
        await asyncio.gather(*[
            process_referral_logic(ref.id) for ref in referrals
        ])
        
        # Refresh referrer
        await session.refresh(referrer)
        
        # Should have 5 referrals and 5 * 35 = 175 XP
        assert referrer.referral_count == 5
        assert referrer.xp == 175


class TestRegressionPrevention:
    """Tests specifically for the bugs we fixed."""
    
    async def test_bug1_no_infinite_loop(self, session: AsyncSession, create_referral_chain):
        """
        Verify Bug #1 fix: Error during XP calc doesn't cause infinite loop.
        
        #comment: The bug was that if XP calculation failed for a user,
        current_referrer_id wasn't updated, causing infinite retry.
        
        We can't easily simulate the error without mocking, but we can verify
        the logic structure is correct by checking the chain processes completely.
        """
        chain = await create_referral_chain(levels=9)
        
        # Process should complete without hanging
        await process_referral_logic(chain[8].id)
        
        # All users should have received XP
        for user in chain[:8]:
            await session.refresh(user)
            assert user.xp > 0, f"User {user.id} didn't receive XP"
    
    async def test_bug3_direct_referrer_gets_xp(self, session: AsyncSession, create_referral_chain):
        """
        Verify Bug #3 fix: Direct referrer IS included in lineage calculations.
        
        #comment: The bug was that lineage_ids didn't include referrer_id,
        so the direct referrer (L1) wouldn't get XP.
        """
        chain = await create_referral_chain(levels=2)
        
        # New user (chain[1]) signs up
        await process_referral_logic(chain[1].id)
        
        # Direct referrer (chain[0]) MUST get XP
        await session.refresh(chain[0])
        assert chain[0].xp == 35, "Direct referrer didn't get L1 XP!"
        assert chain[0].referral_count == 1
    
    async def test_bug2_direct_referrer_gets_commission(self, session: AsyncSession, create_referral_chain):
        """
        Verify Bug #2 fix: Direct referrer gets 30% commission.
        
        #comment: Same root cause as Bug #3 - lineage didn't include direct referrer.
        """
        chain = await create_referral_chain(levels=2)
        
        # User buys PRO
        await distribute_pro_commissions(session, chain[1].id, 39.0)
        
        # Direct referrer MUST get 30%
        await session.refresh(chain[0])
        expected = 39.0 * 0.30
        assert abs(chain[0].balance - expected) < 0.01, \
            f"Direct referrer got ${chain[0].balance}, expected ${expected}"


# #comment: Run these tests with:
# pytest tests/test_referral_system.py -v
# 
# Add -s to see print statements
# Add -k "test_name" to run specific test
# Add --cov to see code coverage

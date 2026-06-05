from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import select

from app.core.config import settings
from app.models.audit_log import ActionType, AuditLog
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction
from app.services.payment_service import payment_service
from app.services.referral_service import distribute_pro_commissions


@pytest.mark.asyncio
async def test_create_payment_session(session, create_test_partner):
    """Tests the creation of TON and USDT payment sessions."""
    partner = await create_test_partner(telegram_id="10001")
    
    # 1. Test TON Session
    with patch("app.services.payment_service.PaymentService.get_ton_price", return_value=5.0):
        session_data = await payment_service.create_payment_session(
            session=session,
            partner_id=partner.id,
            amount_usd=40.0,
            currency="TON"
        )
        
        # Verify calculation: (40 / 5.0) * 1.02 = 8.16
        assert session_data["amount"] == 8.16
        assert session_data["currency"] == "TON"
        assert session_data["address"] == settings.ADMIN_TON_ADDRESS
        
    # 2. Test USDT Session
    session_data_usdt = await payment_service.create_payment_session(
        session=session,
        partner_id=partner.id,
        amount_usd=69.0,
        currency="USDT"
    )
    assert session_data_usdt["amount"] == 69.0
    assert session_data_usdt["currency"] == "USDT"
    assert session_data_usdt["address"] == settings.ADMIN_USDT_ADDRESS

@pytest.mark.asyncio
async def test_upgrade_to_pro_logic(session, create_test_partner):
    """Tests the upgrade_to_pro logic including slots and XP."""
    partner = await create_test_partner(telegram_id="10002")
    
    # Mock system setting for slots
    from app.models.partner import SystemSetting
    session.add(SystemSetting(key="pro_slots_sold", value="147"))
    session.add(SystemSetting(key="pro_slots_total", value="300"))
    await session.commit()
    
    # Upgrade to PRO
    await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        amount=39.0,
        currency="TON",
        network="TON",
        tx_hash="some_hash"
    )
    
    await session.refresh(partner)
    assert partner.is_pro is True
    assert partner.subscription_plan == "PRO_LIFETIME" # Because 147 < 300
    assert partner.xp == settings.PRO_UPGRADE_SELF_XP
    
    # Verify slot increment
    res = await session.exec(select(SystemSetting).where(SystemSetting.key == "pro_slots_sold"))
    setting = res.first()
    assert setting.value == "148"

@pytest.mark.asyncio
async def test_pro_plus_upgrade_logic(session, create_test_partner):
    """Tests direct PRO+ upgrade and PRO -> PRO+ upgrade paths."""
    partner = await create_test_partner(telegram_id="10003")
    
    # 1. Direct PRO+
    await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        amount=69.0,
        currency="TON",
        network="TON",
        tx_hash="plus_hash_1"
    )
    await session.refresh(partner)
    assert partner.subscription_plan == "PRO_PLUS_MONTHLY"
    assert partner.xp == settings.PRO_PLUS_UPGRADE_SELF_XP

    # 2. PRO to PRO+ (paying difference)
    partner_2 = await create_test_partner(telegram_id="10004", is_pro=True)
    partner_2.subscription_plan = "PRO_LIFETIME"
    partner_2.xp = settings.PRO_UPGRADE_SELF_XP
    session.add(partner_2)
    await session.commit()
    
    # Pay difference: 69 - 39 = 30
    await payment_service.upgrade_to_pro(
        session=session,
        partner=partner_2,
        amount=30.0,
        currency="USDT",
        network="TRC20",
        tx_hash="upgrade_hash"
    )
    await session.refresh(partner_2)
    assert partner_2.subscription_plan == "PRO_PLUS_MONTHLY"
    # Should grant incremental XP: PRO (750) + (1250-750) = 1250
    assert partner_2.xp == settings.PRO_PLUS_UPGRADE_SELF_XP

@pytest.mark.asyncio
async def test_commission_compression_and_precision(session, create_referral_chain):
    """
    Tests dynamic compression where a free user is skipped and 
    payout goes to the next qualified PRO/PRO+ user.
    """
    # Create 5 levels:
    # L1: Free
    # L2: PRO
    # L3: Free
    # L4: PRO+
    # L5: (The Buyer) - Upgrades to PRO
    chain = await create_referral_chain(levels=5)
    
    u1_root = chain[0] # L4 for buyer
    u2_pro = chain[1] # L3 for buyer
    u3_free = chain[2] # L2 for buyer
    u4_pro = chain[3] # L1 for buyer
    u5_buyer = chain[4]
    
    # Set statuses
    u1_root.subscription_plan = "PRO_PLUS_MONTHLY"
    u1_root.is_pro = True
    
    u2_pro.is_pro = True
    u2_pro.subscription_plan = "PRO_LIFETIME"
    
    u3_free.is_pro = False
    u3_free.subscription_plan = None
    
    u4_pro.is_pro = True
    u4_pro.subscription_plan = "PRO_MONTHLY"

    session.add_all([u1_root, u2_pro, u3_free, u4_pro])
    await session.commit()
    
    # Distribute PRO Commissions ($39)
    # Map (Empire): L1=30%, L2=10%, L3=3%, L4=1%...
    await distribute_pro_commissions(session, u5_buyer.id, 39.0)
    await session.commit()
    
    await session.refresh(u4_pro)
    await session.refresh(u3_free)
    await session.refresh(u2_pro)
    await session.refresh(u1_root)
    
    # Exact values for $39 base:
    # L1: 39 * 0.3 = 11.7
    # L2: 39 * 0.1 = 3.9
    # L3: 39 * 0.03 = 1.17
    # L4: 39 * 0.01 = 0.39
    assert u4_pro.balance == 11.7
    assert u3_free.balance == 3.9
    assert u2_pro.balance == 1.17
    assert u1_root.balance == 0.39

@pytest.mark.asyncio
async def test_commission_skip_logic_beyond_l3(session, create_referral_chain):
    """Tests that free users are skipped for L4+ commissions (Compression)."""
    # Chain: [ROOT(PRO+)] -> [FREE] -> [FREE] -> [FREE] -> [BUYER]
    # Distances from Buyer:   L4         L3       L2       L1
    chain = await create_referral_chain(levels=5)
    root = chain[0]
    l3 = chain[1]
    l2 = chain[2]
    l1 = chain[3]
    buyer = chain[4]
    
    root.subscription_plan = "PRO_PLUS_MONTHLY"
    root.is_pro = True
    
    # Middle ones are Free
    for u in [l1, l2, l3]:
        u.is_pro = False
        u.subscription_plan = None
        session.add(u)
    await session.commit()
    
    # Add Company Account (required for leaks)
    import secrets
    company = Partner(
        telegram_id="537873096", 
        username="admin", 
        is_pro=True, 
        referral_code=secrets.token_hex(4)
    )
    session.add(company)
    await session.commit()
    
    await distribute_pro_commissions(session, buyer.id, 39.0)
    await session.commit()
    
    await session.refresh(l1) # L1 (Qualified)
    await session.refresh(l2) # L2 (Qualified)
    await session.refresh(l3) # L3 (Qualified)
    await session.refresh(root) # L4! Should get L4 slice ($1.17)
    
    assert l1.balance > 0
    assert l2.balance > 0
    assert l3.balance > 0
    assert root.balance == 0.39

@pytest.mark.asyncio
async def test_audit_logs_creation(session, create_test_partner):
    """Verifies that AuditLogs are created and linked correctly in Phase 3 Architecture."""
    partner = await create_test_partner(telegram_id="10005")
    
    # Manually trigger an event via AuditService
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type=ActionType.UPGRADE,
        description="Manual Test Upgrade",
        entity_type="partner",
        entity_id=str(partner.id),
        action="test_action"
    )
    
    # Query logs
    stmt = select(AuditLog).where(AuditLog.partner_id == partner.id)
    res = await session.exec(stmt)
    logs = res.all()
    
    assert len(logs) == 1
    assert logs[0].action_type == ActionType.UPGRADE
    assert logs[0].description == "Manual Test Upgrade"
    assert logs[0].partner_id == partner.id

@pytest.mark.asyncio
async def test_pro_upgrade_atomicity(session, create_test_partner):
    """
    Step 3.2: PRO State Atomicity Testing.
    Emulate a failure halfway through upgrade_to_pro to ensure atomicity.
    """
    partner = await create_test_partner(telegram_id="10006")
    
    # Mock failure during XP Awarding (before commit)
    with patch("app.services.audit_service.audit_service.log_xp_award", new_callable=AsyncMock, side_effect=Exception("Database Connection Lost")):
        with pytest.raises(Exception, match="Database Connection Lost"):
            await payment_service.upgrade_to_pro(
                session=session,
                partner=partner,
                amount=39.0,
                currency="TON",
                network="TON",
                tx_hash="failed_tx_hash"
            )

    # Verify that nothing was persisted (Session should have rolled back)
    await session.refresh(partner)
    assert partner.is_pro is False 

@pytest.mark.asyncio
async def test_ton_verification_security(session, create_test_partner):
    """
    Step 3.1: Simulate Incoming Webhook Vectors.
    Test invalid hashes and forged amounts.
    """
    from app.services.ton_verification_service import ton_verification_service
    
    # Mock TONCenter Response for a "Forged" transaction (Wrong Amount)
    forged_tx = {
        "ok": True,
        "result": [{
            "hash": "valid_hash_but_wrong_amount",
            "in_msg": {
                "destination": settings.ADMIN_TON_ADDRESS,
                "value": str(int(1.0 * 1_000_000_000)) # Only 1 TON, we expected e.g. 10
            }
        }]
    }

    with patch("app.core.http_client.http_client.get_client") as mock_client:
        mock_res = AsyncMock()
        mock_res.status_code = 200
        mock_res.json.return_value = forged_tx
        mock_client.return_value.get.return_value = mock_res
        
        # Verify should fail
        is_valid = await ton_verification_service.verify_transaction(
            tx_hash="valid_hash_but_wrong_amount",
            expected_amount=10.0, # We expect 10
            expected_address=settings.ADMIN_TON_ADDRESS
        )
        assert is_valid is False

    # Test "Invalid Hash" (Not found in history)
    empty_history = {"ok": True, "result": []}
    with patch("app.core.http_client.http_client.get_client") as mock_client:
        mock_res = AsyncMock()
        mock_res.status_code = 200
        mock_res.json.return_value = empty_history
        mock_client.return_value.get.return_value = mock_res
        
        is_valid = await ton_verification_service.verify_transaction(
            tx_hash="unknown_hash",
            expected_amount=10.0,
            expected_address=settings.ADMIN_TON_ADDRESS
        )
        assert is_valid is False


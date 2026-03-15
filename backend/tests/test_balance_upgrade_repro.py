import pytest
from unittest.mock import AsyncMock, patch
from datetime import UTC, datetime
import pytest
from sqlmodel import select
from app.models.partner import Partner
from app.services.payment_service import payment_service
from app.core.config import settings

@pytest.mark.asyncio
async def test_balance_upgrade_pro_retry(session, create_test_partner):
    """
    Verifies that standard PRO upgrade ($39) handles balance correctly with a retry.
    """
    partner = await create_test_partner(telegram_id="111", xp=100)
    partner.balance = 50.0
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    price = 39.0
    side_effects = [Exception("Transient DB Error"), None]
    
    with patch("app.services.audit_service.audit_service.log_xp_award", side_effect=side_effects):
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=price,
            currency="BALANCE",
            network="INTERNAL",
            tx_hash="pro_retry_hash"
        )

    await session.refresh(partner)
    assert partner.is_pro is True
    assert partner.subscription_plan in ["PRO_LIFETIME", "PRO_MONTHLY"]
    assert float(partner.balance) == 11.0 # 50 - 39

    # Verify Ledger (Negative Earning)
    from app.models.partner import Earning
    stmt_earn = select(Earning).where(Earning.partner_id == partner.id, Earning.type == "PAYMENT")
    res_earn = await session.exec(stmt_earn)
    assert res_earn.first().amount == -39.0

@pytest.mark.asyncio
async def test_balance_upgrade_pro_plus_retry(session, create_test_partner):
    """
    Verifies that PRO+ upgrade ($69) handles balance correctly with a retry.
    """
    partner = await create_test_partner(telegram_id="222", xp=100)
    partner.balance = 100.0
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    price = 69.0
    side_effects = [Exception("Transient DB Error"), None]
    
    with patch("app.services.audit_service.audit_service.log_xp_award", side_effect=side_effects):
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=price,
            currency="BALANCE",
            network="INTERNAL",
            tx_hash="plus_retry_hash"
        )

    await session.refresh(partner)
    assert partner.is_pro is True
    assert partner.subscription_plan == "PRO_PLUS_MONTHLY"
    assert float(partner.balance) == 31.0 # 100 - 69

@pytest.mark.asyncio
async def test_balance_insufficient_error(session, create_test_partner):
    """
    Verifies that insufficient balance is caught inside the service.
    """
    partner = await create_test_partner(telegram_id="333", xp=100)
    partner.balance = 10.0
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    with pytest.raises(ValueError, match="Insufficient balance"):
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=39.0,
            currency="BALANCE",
            network="INTERNAL"
        )

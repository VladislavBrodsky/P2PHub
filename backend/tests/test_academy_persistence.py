import pytest
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi.testclient import TestClient
import json

from app.models.partner import Partner
from app.api.endpoints.pro import MODULE_DETAILS

@pytest.mark.asyncio
async def test_academy_completion_persistence(session: AsyncSession, create_referral_chain):
    # 1. Setup: Create a PRO partner
    chain = await create_referral_chain(levels=1)
    partner = chain[0]
    partner.is_pro = True
    partner.xp = 1000
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    # Mock Auth: We need to override get_current_user or similar if using client
    # For simplicity, we'll test the logic via direct service-like calls if endpoint is hard to mock
    # But let's try to verify the logic in pro.py directly if possible or via a helper.
    
    from app.api.endpoints.pro import complete_academy_stage, get_current_partner
    
    # Mocking get_current_partner dependency
    async def override_get_current_partner():
        return partner

    # 2. Complete a stage (numeric ID)
    stage_id = "1"
    # Note: We call the function directly as a "unit test" of the endpoint logic
    result = await complete_academy_stage(stage_id=stage_id, partner=partner, session=session)
    
    assert result["status"] == "success"
    assert "1" in json.loads(partner.completed_stages)
    initial_score = partner.academy_score
    initial_xp = partner.xp

    # 3. Try to complete again - should be blocked
    result_again = await complete_academy_stage(stage_id=stage_id, partner=partner, session=session)
    assert result_again["status"] == "already_completed"
    assert partner.academy_score == initial_score
    assert partner.xp == initial_xp

    # 4. Verify string normalization (legacy data simulation)
    partner.completed_stages = json.dumps([2, 3]) # Stored as ints in legacy
    session.add(partner)
    await session.commit()
    
    # Try to complete "2" (string) - should be recognized as already completed
    result_legacy = await complete_academy_stage(stage_id="2", partner=partner, session=session)
    assert result_legacy["status"] == "already_completed"

    # 5. Verify MODULE_DETAILS (m1, m2 etc)
    # m1 reward is 500 XP
    result_m1 = await complete_academy_stage(stage_id="m1", partner=partner, session=session)
    assert result_m1["status"] == "success"
    assert partner.xp == initial_xp + 500
    assert "m1" in json.loads(partner.completed_stages)

    print("\n✅ Academy Persistence & Duplicate Prevention Verified")

@pytest.mark.asyncio
async def test_academy_unlock_normalization(session: AsyncSession, create_referral_chain):
    chain = await create_referral_chain(levels=1)
    partner = chain[0]
    partner.is_pro = True
    partner.xp = 5000 # Enough to unlock m4 (500 XP)
    session.add(partner)
    await session.commit()
    
    from app.api.endpoints.pro import unlock_academy_stage
    
    # Unlock m4
    result = await unlock_academy_stage(stage_id="m4", partner=partner, session=session)
    assert result["status"] == "success"
    assert "m4" in json.loads(partner.unlocked_stages)
    
    # Try again
    result_again = await unlock_academy_stage(stage_id="m4", partner=partner, session=session)
    assert result_again["status"] == "already_unlocked"
    
    print("✅ Academy Unlock Normalization Verified")

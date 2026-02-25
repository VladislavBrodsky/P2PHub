import pytest
from unittest.mock import AsyncMock, patch
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.referral_service import process_referral_logic

@pytest.mark.asyncio
async def test_referral_path_no_duplicates(session: AsyncSession, create_referral_chain):
    """
    Test that the referral chain notification does not contain duplicate names.
    This verifies the fix for the glitch where names were listed twice in the path.
    """
    # Create a 3-level chain: A -> B -> C
    # User C is the new signup
    # User B is L1 referrer
    # User A is L2 referrer
    chain = await create_referral_chain(levels=3)
    user_a = chain[0]
    user_b = chain[1]
    user_c = chain[2]

    # Mock notification service to capture the message sent to User A
    from app.services.notification_service import notification_service
    
    # Reset mocks just in case
    notification_service.send_low_prio.reset_mock()
    
    # Process referral logic for User C
    await process_referral_logic(user_c.id)
    
    # Find the call for User A (Level 2)
    # referral_l1_congrats doesn't use the chain, referral_l2_congrats and deep do.
    # Level 2 for A should use referral_l2_congrats
    
    a_calls = [call for call in notification_service.send_low_prio.call_args_list 
               if call.kwargs.get('chat_id') == str(user_a.telegram_id)]
    
    assert len(a_calls) >= 1
    msg_to_a = a_calls[0].kwargs.get('text')
    
    # The message for Level 2 in i18n.py is:
    # "referral_l2_congrats": "🌐 *Network Expansion Detected!* 🌐\n\n📊 *Path:* {referral_chain}\n..."
    # referral_chain is constructed from msg_chain in referral_service.py
    # msg_chain = ["You", *children_names]
    # In A -> B -> C, for A: children_names should be just [B_name]
    # So path should be: "You ← B_name ← C_name"
    
    # If the bug was present, it would be: "You ← B_name ← B_name ← C_name"
    
    from app.services.referral_service import format_partner_name
    b_name = format_partner_name(user_b)
    
    # Count occurrences of B's name in the message
    # Note: the name is ALREADY escaped by format_partner_name
    assert msg_to_a.count(b_name) == 1, f"Name repeated in message: {msg_to_a}"

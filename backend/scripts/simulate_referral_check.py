import asyncio
import logging
import sys
from unittest.mock import AsyncMock, MagicMock, patch

# Mock aiogram BEFORE any app imports
import aiogram
mock_bot = AsyncMock()
mock_bot.get_me.return_value = AsyncMock(username="pintopay_probot")

with patch('aiogram.Bot', return_value=mock_bot):
    from app.models.partner import Partner, get_session, XPTransaction
    from app.services.partner_service import create_partner
    from app.services.referral_service import process_referral_logic
    from sqlmodel import select
    import app.services.referral_service
    import app.services.notification_service
    from app.core.config import settings

    # Ensure the services use our mock_bot
    app.services.referral_service.bot = mock_bot
    app.services.notification_service.bot = mock_bot

# Set up logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

async def simulate_join():
    try:
        # 2. Get the owner baseline
        REFERRAL_CODE = "P2P-425DA3DB"
        TEST_TG_ID = "999999999" # Large dummy ID
        
        async for session in get_session():
            # Check owner
            stmt = select(Partner).where(Partner.referral_code == REFERRAL_CODE)
            owner = (await session.exec(stmt)).first()
            if not owner:
                print(f"Error: Owner with code {REFERRAL_CODE} not found.")
                return

            original_xp = owner.xp
            original_ref_count = owner.referral_count
            print(f"Owner: {owner.username} (ID: {owner.id})")
            print(f"Baseline XP: {original_xp}")
            print(f"Baseline Ref Count: {original_ref_count}")
            print(f"Owner is PRO: {owner.is_pro}")

            # 3. Create a new test user
            print(f"\nSimulating join for test user {TEST_TG_ID}...")
            
            # Clean up existing test user if any
            cleanup_stmt = select(Partner).where(Partner.telegram_id == TEST_TG_ID)
            old_test_user = (await session.exec(cleanup_stmt)).first()
            if old_test_user:
                print(f"Removing old test user {old_test_user.id}...")
                await session.delete(old_test_user)
                await session.commit()

            # Create new partner
            partner, is_new = await create_partner(
                session=session,
                telegram_id=TEST_TG_ID,
                username="test_user_alpha",
                first_name="Test",
                last_name="User",
                language_code="en",
                referrer_code=REFERRAL_CODE
            )
            
            print(f"New partner created: ID={partner.id}, ReferrerID={partner.referrer_id}")
            
            # 4. Process referral logic
            print("Processing referral logic...")
            # We call the function directly. In production, this might be enqueued.
            await process_referral_logic(partner.id)
            
            # 5. Verify results
            await session.refresh(owner)
            print(f"\nUpdated XP: {owner.xp}")
            print(f"Updated Ref Count: {owner.referral_count}")
            
            xp_gain = owner.xp - original_xp
            print(f"XP Gain: +{xp_gain}")
            
            # L1 reward is 35. PRO multiplier is 5.
            expected_gain = 35
            if owner.is_pro:
                expected_gain *= 5
                print(f"Expected Gain (PRO): 35 * 5 = {expected_gain}")
            else:
                print("Expected Gain (Normal): 35")

            if xp_gain == expected_gain:
                print("✅ XP correct!")
            else:
                print(f"❌ XP incorrect! Expected {expected_gain}, got {xp_gain}")

            # Check for notification calls
            print("\nChecking notifications...")
            # process_referral_logic uses notification_service.enqueue_notification
            # which in turn tries to use TaskIQ. If TaskIQ fails, it fallbacks to direct send.
            # Since we didn't mock TaskIQ, it might either work (if Redis is up) or fallback.
            # Let's check if the mock_bot was used for sending.
            
            # We also need to check if the notification_service fallback was triggered.
            if mock_bot.send_message.called:
                print(f"✅ Notification was sent directly to owner (TG ID: {owner.telegram_id})")
                for call in mock_bot.send_message.call_args_list:
                    print(f"Notification text: {call.kwargs.get('text')[:100]}...")
            else:
                print("ℹ️ Notification not sent directly (likely enqueued to Redis).")
                print("In production, this is correct behavior as it runs in the background.")

            # Cleanup
            print("\nCleaning up test user data...")
            # Use separate session for cleanup to handle potential transaction issues
            async for cleanup_session in get_session():
                p = await cleanup_session.get(Partner, partner.id)
                if p: await cleanup_session.delete(p)
                
                # Cleanup XPTransaction
                tx_stmt = select(XPTransaction).where(XPTransaction.partner_id == owner.id, XPTransaction.reference_id == str(partner.id))
                txs = (await cleanup_session.exec(tx_stmt)).all()
                for tx in txs:
                    await cleanup_session.delete(tx)
                
                # Restore owner original state
                o = await cleanup_session.get(Partner, owner.id)
                o.xp = original_xp
                o.referral_count = original_ref_count
                cleanup_session.add(o)
                
                await cleanup_session.commit()
                break
            
            print("Cleanup complete.")
            break

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(simulate_join())

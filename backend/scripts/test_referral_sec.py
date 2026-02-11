
import asyncio
import os
import sys
import time

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Load env vars (already set in shell but just in case)
from app.models.partner import get_session
from app.services.partner_service import create_partner


async def test_security():
    print("🛡️ Starting Referral Security Test...")

    timestamp = int(time.time())

    async for session in get_session():
        # 1. Create a "Referrer" user
        referrer_tg_id = f"SEC_REF_{timestamp}"
        referrer, is_new = await create_partner(
            session=session,
            telegram_id=referrer_tg_id,
            username=f"referrer_{timestamp}"
        )
        print(f"Created Referrer: ID={referrer.id}, TG_ID={referrer.telegram_id}, Code={referrer.referral_code}")

        # 2. Try to refer a new user using the Referrer's Telegram ID (STRICTLY FORBIDDEN NOW)
        print(f"\nAttempting to join using Telegram ID '{referrer_tg_id}' as referrer_code...")
        new_user_1_tg_id = f"SEC_USER_BAD_{timestamp}"
        partner_bad, is_new_1 = await create_partner(
            session=session,
            telegram_id=new_user_1_tg_id,
            username=f"bad_user_{timestamp}",
            referrer_code=referrer_tg_id # This should FAIL to link
        )

        if partner_bad.referrer_id is None:
            print("✅ SUCCESS: New user was NOT linked to referrer via Telegram ID.")
        else:
            print(f"❌ FAILURE: New user WAS linked to referrer ID {partner_bad.referrer_id} via Telegram ID!")

        # 3. Try to refer a new user using the valid Referral Code (SHOULD WORK)
        print(f"\nAttempting to join using valid Referral Code '{referrer.referral_code}'...")
        new_user_2_tg_id = f"SEC_USER_GOOD_{timestamp}"
        partner_good, is_new_2 = await create_partner(
            session=session,
            telegram_id=new_user_2_tg_id,
            username=f"good_user_{timestamp}",
            referrer_code=referrer.referral_code # This should SUCCEED
        )

        if partner_good.referrer_id == referrer.id:
            print("✅ SUCCESS: New user WAS linked to referrer via valid Referral Code.")
        else:
            print(f"❌ FAILURE: New user was NOT linked to referrer ID {referrer.id} via valid Referral Code!")

        break

if __name__ == "__main__":
    asyncio.run(test_security())

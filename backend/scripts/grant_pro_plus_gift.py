import asyncio
import os
import sys
import json

# Bootstrap
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.services.payment_service import payment_service
from app.core.config import settings

async def grant_gift(username: str):
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == username)
        user = (await session.exec(stmt)).first()
        if not user:
            print(f"❌ User @{username} not found")
            return

        print(f"🎁 Granting PRO+ LIFETIME Gift to @{username} (ID: {user.id})")
        
        # 1. Trigger the upgrade flow via payment_service to get commissions and welcome messages
        # If user is already PRO, we use the difference to trigger is_pro_to_plus_upgrade
        # settings.PRO_PLUS_PRICE_USD is 69.0, settings.PRO_PRICE_USD is 39.0
        # Difference is 30.0
        amount = settings.PRO_PLUS_PRICE_USD
        if user.is_pro:
             # payment_service.upgrade_to_pro checks if abs(amount - difference) < 0.5
             amount = settings.PRO_PLUS_PRICE_USD - settings.PRO_PRICE_USD

        print(f"  Simulating payment of ${amount} USDT...")
        
        await payment_service.upgrade_to_pro(
            session=session,
            partner=user,
            amount=amount,
            currency="USDT",
            network="SYSTEM_GIFT",
            tx_hash=f"GIFT_PRO_PLUS_LIFETIME_{user.id}_{int(asyncio.get_event_loop().time())}"
        )
        
        # 2. Re-fetch and manually fix the plan to LIFETIME
        await session.commit()
        
        async with async_session_maker() as session2:
            user2 = await session2.get(Partner, user.id)
            user2.subscription_plan = "PRO_PLUS_LIFETIME"
            user2.pro_expires_at = None
            
            # Ensure is_pro is True (it should be from upgrade_to_pro)
            user2.is_pro = True
            
            session2.add(user2)
            await session2.commit()
            print(f"✅ Successfully granted PRO+ LIFETIME to @{username}")
            print(f"  Plan: {user2.subscription_plan}")
            print(f"  Expires: {user2.pro_expires_at}")

if __name__ == "__main__":
    username = "Rudskixx_Dmitry854"
    asyncio.run(grant_gift(username))

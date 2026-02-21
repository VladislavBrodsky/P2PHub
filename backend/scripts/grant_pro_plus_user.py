"""
grant_pro_plus_user.py — Grant PRO+ to a user with commission distribution.
Usage: python3 backend/scripts/grant_pro_plus_user.py <username>
"""
import asyncio
import os
import sys

# Bootstrap MUST be first
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from datetime import datetime, UTC, timedelta
from sqlmodel import select, text
from app.models.partner import Partner, async_session_maker
from app.services.payment_service import payment_service
from app.services.redis_service import redis_service
from app.core.config import settings

async def grant_pro_plus(username: str):
    async with async_session_maker() as session:
        print(f"\n{'='*55}")
        print(f"  PRO+ GRANT: @{username}")
        print(f"{'='*55}")

        stmt = select(Partner).where(Partner.username == username)
        user = (await session.exec(stmt)).first()

        if not user:
            print(f"❌  User @{username} NOT FOUND in database.")
            return False

        print(f"  ID          : {user.id}")
        print(f"  Telegram ID : {user.telegram_id}")
        
        # We can simulate upgrading to PRO+ directly bypassing the payment verification
        # The easiest way is to use `upgrade_to_pro`
        try:
            # We enforce PRO+ by passing the PRO+ price
            amount = float(settings.PRO_PLUS_PRICE_USD)
            await payment_service.upgrade_to_pro(
                session=session,
                partner=user,
                amount=amount,
                currency="USDT",
                network="SYSTEM",
                tx_hash="GIFT_PRO_PLUS_NEW_2" + str(user.id)
            )
            print("Successfully executed upgrade_to_pro")
            return True
        except Exception as e:
            print(f"Failed to upgrade: {e}")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 backend/scripts/grant_pro_plus_user.py <username>")
        sys.exit(1)
    
    username = sys.argv[1].replace('@', '')
    asyncio.run(grant_pro_plus(username))

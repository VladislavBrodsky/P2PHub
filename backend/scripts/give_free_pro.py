"""
give_free_pro.py — Grant FREE PRO Lifetime (no commissions) to a list of users.
Usage: python3 backend/scripts/give_free_pro.py
"""
import asyncio
import os
import sys

# ── Bootstrap MUST be first ──────────────────────────────────────────────────
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from datetime import datetime, UTC
from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.core.config import settings

# ── Users to gift PRO ────────────────────────────────────────────────────────
GIFT_USERNAMES = [
    "wwestic",
    "Ksu_Ust",
]


async def give_free_pro():
    async with async_session_maker() as session:
        print(f"\n{'='*55}")
        print("  FREE PRO GIFT (No Commissions)")
        print(f"{'='*55}")

        for username in GIFT_USERNAMES:
            print(f"\n  Processing @{username}...")

            stmt = select(Partner).where(Partner.username == username)
            user = (await session.exec(stmt)).first()

            if not user:
                print(f"  ❌ @{username} NOT FOUND in database.")
                continue

            user.is_pro = True
            user.subscription_plan = "PRO_LIFETIME"
            user.pro_expires_at = None
            user.pro_tokens = settings.PRO_TOKENS_MONTHLY  # 250
            user.pro_started_at = datetime.now(UTC).replace(tzinfo=None)
            session.add(user)

        await session.commit()

        # ── Verify ───────────────────────────────────────────────────────
        print("\n  Verification:")
        for username in GIFT_USERNAMES:
            stmt = select(Partner).where(Partner.username == username)
            user = (await session.exec(stmt)).first()
            if user:
                status = "✅" if user.is_pro else "❌"
                print(f"  {status} @{username}: PRO={user.is_pro}, Plan={user.subscription_plan}, Tokens={user.pro_tokens}")

        print(f"\n{'='*55}\n")


if __name__ == "__main__":
    asyncio.run(give_free_pro())

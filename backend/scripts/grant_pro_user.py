"""
grant_pro_user.py — Grant PRO Lifetime to a user with commission distribution.
Usage: python3 backend/scripts/grant_pro_user.py <username>
"""
import asyncio
import os
import sys

# ── Bootstrap MUST be first ──────────────────────────────────────────────────
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from datetime import datetime, UTC
from sqlmodel import select, text
from app.models.partner import Partner, async_session_maker
from app.services.referral_service import distribute_pro_commissions
from app.core.config import settings

PRO_PRICE_USD = settings.PRO_PRICE_USD  # $39.0


async def grant_pro(username: str, distribute_commissions: bool = True):
    async with async_session_maker() as session:
        print(f"\n{'='*55}")
        print(f"  PRO GRANT: @{username}")
        print(f"{'='*55}")

        stmt = select(Partner).where(Partner.username == username)
        user = (await session.exec(stmt)).first()

        if not user:
            print(f"❌  User @{username} NOT FOUND in database.")
            return False

        print(f"  ID          : {user.id}")
        print(f"  Telegram ID : {user.telegram_id}")
        print(f"  PRO Before  : {user.is_pro} | Plan: {user.subscription_plan} | Tokens: {user.pro_tokens}")

        # ── Apply PRO Lifetime ────────────────────────────────────────────
        user.is_pro = True
        user.subscription_plan = "PRO_LIFETIME"
        user.pro_expires_at = None
        user.pro_tokens = settings.PRO_TOKENS_MONTHLY  # 250
        user.pro_started_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(user)
        await session.flush()

        # ── Commissions ───────────────────────────────────────────────────
        if distribute_commissions:
            print(f"\n  Distributing commissions (${PRO_PRICE_USD})...")
            await distribute_pro_commissions(session, user.id, PRO_PRICE_USD)
        else:
            print("\n  Commissions: SKIPPED (free gift)")

        await session.commit()
        await session.refresh(user)

        # ── Final Report ──────────────────────────────────────────────────
        print(f"\n  ✅ PRO Status  : {user.is_pro}")
        print(f"  ✅ Plan        : {user.subscription_plan}")
        print(f"  ✅ Expires     : {'LIFETIME' if not user.pro_expires_at else user.pro_expires_at}")
        print(f"  ✅ Tokens      : {user.pro_tokens}")

        if distribute_commissions:
            stmt_earn = text(
                f"SELECT level, partner_id, amount, description "
                f"FROM earning WHERE reference_id LIKE 'upg_{user.id}_%' ORDER BY level ASC"
            )
            rows = (await session.exec(stmt_earn)).all()
            if rows:
                print("\n  Commission Breakdown:")
                total = 0.0
                for lvl, pid, amt, desc in rows:
                    print(f"    L{lvl}: Partner {pid} → ${float(amt):.2f}  ({desc})")
                    total += float(amt)
                print("    ─────────────────────────────")
                print(f"    Total Distributed: ${total:.2f} / ${PRO_PRICE_USD:.2f}")
            else:
                print("  ⚠️  No commissions found (user may have no upline).")

        print(f"\n{'='*55}\n")
        return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 backend/scripts/grant_pro_user.py <username> [--free]")
        sys.exit(1)
    
    username = sys.argv[1]
    distribute = "--free" not in sys.argv
    
    asyncio.run(grant_pro(username, distribute_commissions=distribute))

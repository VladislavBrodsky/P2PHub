import asyncio
import logging

from sqlmodel import select

from app.models.partner import Partner, get_session

logging.basicConfig(level=logging.INFO)

async def check_user():
    print("--- User Audit: @uslincoln ---")
    async for session in get_session():
        # Find by username
        stmt = select(Partner).where(Partner.username == "uslincoln")
        res = await session.exec(stmt)
        user = res.first()

        if not user:
            print("User @uslincoln NOT found in database.")
            # Search by referral code provided in URL
            stmt_ref = select(Partner).where(Partner.referral_code == "P2P-425DA3DB")
            res_ref = await session.exec(stmt_ref)
            user = res_ref.first()
            if user:
                print(f"User found by referral code P2P-425DA3DB: ID={user.id}, Username=@{user.username}, TG={user.telegram_id}")
            else:
                print("User NOT found by referral code P2P-425DA3DB either.")
                return

        print(f"User ID: {user.id}")
        print(f"Telegram ID: {user.telegram_id}")
        print(f"Username: @{user.username}")
        print(f"Referral Code: {user.referral_code}")
        print(f"Path: {user.path}")
        print(f"Referrer ID: {user.referrer_id}")
        print(f"XP: {user.xp}")
        print(f"Referral Count: {user.referral_count}")

        # Check if they have referrals
        stmt_children = select(Partner).where(Partner.referrer_id == user.id)
        res_children = await session.exec(stmt_children)
        children = res_children.all()
        print(f"Direct Referrals (L1): {len(children)}")
        for i, child in enumerate(children[:5]):
            print(f"  - {child.first_name} (@{child.username}) joined at {child.created_at}")
        if len(children) > 5:
            print(f"  ... and {len(children)-5} more")

if __name__ == "__main__":
    asyncio.run(check_user())

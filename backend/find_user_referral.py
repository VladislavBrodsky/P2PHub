
import asyncio
from sqlalchemy import select
from app.models.partner import Partner
from app.models.partner import async_session_maker

async def find_user():
    username_to_find = "lownocoder_TMR"
    # Try with and without @
    usernames = [username_to_find, f"@{username_to_find}"]
    
    async with async_session_maker() as session:
        for uname in usernames:
            print(f"Searching for username: {uname}")
            stmt = select(Partner).where(Partner.username == uname)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user:
                print(f"Found user: {user.username} (ID: {user.id})")
                if user.referrer_id:
                    stmt_referrer = select(Partner).where(Partner.id == user.referrer_id)
                    res_referrer = await session.execute(stmt_referrer)
                    referrer = res_referrer.scalar_one_or_none()
                    if referrer:
                        print(f"Invited by: {referrer.username} (ID: {referrer.id})")
                        print(f"Referrer's Referral Code: {referrer.referral_code}")
                        print(f"Full Referral Link (estimated): {referrer.referral_code}")
                    else:
                        print(f"Invited by ID {user.referrer_id}, but referrer record not found.")
                else:
                    print("This user has no referrer (organic signup).")
                return

        print("User not found.")

if __name__ == "__main__":
    asyncio.run(find_user())

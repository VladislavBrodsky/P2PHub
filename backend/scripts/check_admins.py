import asyncio

from sqlmodel import select

from app.models.partner import Partner, get_session


async def check_admins():
    async for session in get_session():
        # Check by Telegram IDs we found
        ids = ["716720099", "537873096"]
        for tid in ids:
            stmt = select(Partner).where(Partner.telegram_id == tid)
            res = await session.exec(stmt)
            p = res.first()
            if p:
                print(f"TG ID {tid}: Username=@{p.username}, ID={p.id}, Referral Code={p.referral_code}")
            else:
                print(f"TG ID {tid}: NOT FOUND in database")

if __name__ == "__main__":
    asyncio.run(check_admins())

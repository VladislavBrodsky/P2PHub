
import asyncio

from sqlalchemy import func, select

from app.models.partner import Partner, get_session


async def check_pro_count():
    async for session in get_session():
        stmt = select(func.count(Partner.id)).where(Partner.is_pro)
        res = await session.exec(stmt)
        count = res.first()
        print(f"TOTAL_PRO_COUNT: {count}")
        break

if __name__ == "__main__":
    asyncio.run(check_pro_count())

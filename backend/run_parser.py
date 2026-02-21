import asyncio
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import engine
from app.models.partner import Partner
from app.services.viral_studio.studio import viral_studio
from dotenv import load_dotenv

load_dotenv(".env.backend")
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def run_tests():
    from sqlalchemy import select
    async with async_session() as session:
        stmt = select(Partner).where(Partner.username.ilike("%uslincoln%"))
        result = await session.execute(stmt)
        partner = result.scalars().first()

        res = await viral_studio.generate_viral_content(
            partner=partner,
            post_type="product_update",
            target_audience="crypto_natives",
            language="Russian",
            tone_of_voice="visionary",
            session=session
        )
        print("-------------")
        print(f"TITLE: {res.get('title')}")
        print("-------------")
        print(res.get('body'))
        print("-------------")
if __name__ == "__main__":
    asyncio.run(run_tests())

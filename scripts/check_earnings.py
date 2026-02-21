
import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def f():
    async with async_session_maker() as s:
        u = (await s.exec(select(Partner).where(Partner.telegram_id == '716720099'))).first()
        c = (await s.exec(select(Earning).where(Earning.partner_id == u.id).order_by(Earning.created_at.desc()).limit(15))).all()
        for e in c:
            print(f'[{e.created_at}] {e.type} | {e.amount} {e.currency} | {e.description}')

if __name__ == '__main__':
    asyncio.run(f())

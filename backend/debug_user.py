import asyncio
import os
from sqlmodel import select, text, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, Earning, engine
from app.models.transaction import PartnerTransaction

async def check():
    async with AsyncSession(engine) as session:
        # Case-insensitive search
        res = await session.exec(select(Partner).where(func.lower(Partner.username) == 'uslincoln'))
        users = res.all()
        print(f'FOUND {len(users)} users matching "uslincoln"')
        
        for u in users:
            print(f'\n--- PARTNER: id={u.id}, username={u.username}, telegram_id={u.telegram_id}, balance={u.balance} ---')
            
            es_count = (await session.exec(select(func.count(Earning.id)).where(Earning.partner_id == u.id, Earning.currency != 'XP'))).one()
            print(f'  CRYPTO EARNINGS COUNT: {es_count}')
            
            txs_count = (await session.exec(select(func.count(PartnerTransaction.id)).where(PartnerTransaction.partner_id == u.id))).one()
            print(f'  TRANSACTIONS COUNT: {txs_count}')

if __name__ == '__main__':
    asyncio.run(check())

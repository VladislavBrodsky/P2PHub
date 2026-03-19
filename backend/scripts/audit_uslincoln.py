import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.partner import Partner, engine
from app.services.redis_service import redis_service

async def audit():
    telegram_id = "716720099"
    print("--- Database Check ---")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.exec(select(Partner).where(Partner.telegram_id == telegram_id))
        user = result.first()
        if user:
            print(f"User: {user.username}")
            print(f"Plan: {user.subscription_plan}")
            print(f"Is PRO: {user.is_pro}")
            print(f"Tokens: {user.pro_tokens}")
        else:
            print("User not found in DB!")
            
    print("\n--- Redis Cache Check ---")
    keys = await redis_service.client.keys(f"*{telegram_id}*")
    print(f"Keys associated with {telegram_id}:")
    for key in keys:
        if isinstance(key, bytes):
            key = key.decode('utf-8')
        val = await redis_service.client.get(key)
        print(f"{key}: {val[:100] if val else 'None'}")
        
    await engine.dispose()
    
if __name__ == "__main__":
    asyncio.run(audit())

import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

async def check_test():
    async with AsyncSession(engine) as session:
        statement = select(Partner.is_test, func.count()).group_by(Partner.is_test)
        result = await session.execute(statement)
        counts = result.all()
        
        print("\n--- TEST FLAG DISTRIBUTION ---")
        for is_test, count in counts:
            print(f"  is_test={is_test}: {count} partners")
        print("--------------------\n")

if __name__ == "__main__":
    asyncio.run(check_test())

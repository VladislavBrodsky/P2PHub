
import asyncio
from sqlmodel import select
from app.models.partner import SystemSetting, engine
from sqlmodel.ext.asyncio.session import AsyncSession
import json

async def init_pro_stats():
    async with AsyncSession(engine) as session:
        # Check if already exists
        stmt = select(SystemSetting).where(SystemSetting.key == "pro_slots_sold")
        res = await session.exec(stmt)
        setting = res.first()
        
        if not setting:
            setting = SystemSetting(key="pro_slots_sold", value="147")
            session.add(setting)
            print("Initialized pro_slots_sold to 147")
        else:
            print(f"pro_slots_sold already exists: {setting.value}")
            
        stmt_total = select(SystemSetting).where(SystemSetting.key == "pro_slots_total")
        res_total = await session.exec(stmt_total)
        total_setting = res_total.first()
        
        if not total_setting:
            total_setting = SystemSetting(key="pro_slots_total", value="300")
            session.add(total_setting)
            print("Initialized pro_slots_total to 300")
        else:
            print(f"pro_slots_total already exists: {total_setting.value}")
            
        await session.commit()

if __name__ == "__main__":
    asyncio.run(init_pro_stats())

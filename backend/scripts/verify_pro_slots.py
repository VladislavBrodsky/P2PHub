import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio

from sqlmodel import select

from app.models.partner import Partner, SystemSetting, get_session


async def verify_slots():
    async for session in get_session():
        stmt = select(SystemSetting).where(SystemSetting.key == "pro_slots_sold")
        res = await session.exec(stmt)
        setting = res.first()
        sold_count = int(setting.value) if setting else 0
        
        stmt_actual = select(Partner).where(Partner.is_pro, Partner.subscription_plan == "PRO_LIFETIME")
        res_actual = await session.exec(stmt_actual)
        actual_pro_lifetime = len(res_actual.all())
        
        print(f"Slots Sold setting: {sold_count}")
        print(f"Actual PRO_LIFETIME Partners: {actual_pro_lifetime}")
        
        if sold_count != actual_pro_lifetime:
            print("⚠️ DISCREPANCY DETECTED in PRO slots counter!")
        else:
            print("✅ PRO slots counter is perfectly synced.")

if __name__ == "__main__":
    asyncio.run(verify_slots())

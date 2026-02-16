import asyncio
import os
import sys
import json
from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import async_session_maker

async def check_commission_audit():
    async with async_session_maker() as session:
        print("--- Commission Audit Logs for Feb 14 ---")
        # Fixed action name to 'commission_award'
        stmt = text("SELECT action, details, created_at FROM audit_log WHERE action = 'commission_award' AND created_at >= '2026-02-14 07:00:00' AND created_at <= '2026-02-14 08:00:00' ORDER BY created_at ASC")
        res = await session.execute(stmt)
        for action, details, created_at in res.all():
            print(f"[{created_at}] Details: {details}")

if __name__ == "__main__":
    asyncio.run(check_commission_audit())

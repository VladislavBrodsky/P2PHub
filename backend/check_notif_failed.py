import asyncio
import os
import sys
import json
from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import async_session_maker

async def check_notif_failed():
    async with async_session_maker() as session:
        print("--- Recent Notification Failures ---")
        stmt = text("SELECT action, actor_id, details, created_at FROM audit_log WHERE action = 'send_failed' ORDER BY created_at DESC LIMIT 20")
        res = await session.execute(stmt)
        rows = res.all()
        if not rows:
            print("✅ No recent notification failures found.")
        for action, actor_id, details, created_at in rows:
            print(f"[{created_at}] To: {actor_id}, Details: {details}")

if __name__ == "__main__":
    asyncio.run(check_notif_failed())

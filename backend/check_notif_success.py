import asyncio
import os
import sys
import json
from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import async_session_maker

async def check_notif_success():
    async with async_session_maker() as session:
        print("--- Recent Notification Success Logs ---")
        stmt = text("SELECT action, actor_id, details, created_at FROM audit_log WHERE action = 'send_success' ORDER BY created_at DESC LIMIT 20")
        res = await session.execute(stmt)
        for action, actor_id, details, created_at in res.all():
            print(f"[{created_at}] To: {actor_id}, Action: {action}, Details: {details}")

if __name__ == "__main__":
    asyncio.run(check_notif_success())

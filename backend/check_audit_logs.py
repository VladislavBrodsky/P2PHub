import asyncio
import json
import os
import sys

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import Partner, async_session_maker


async def check_audit_logs():
    async with async_session_maker() as session:
        print("--- Recent Audit Logs (Notifications & Payments) ---")
        # Try to query audit_log table directly
        try:
            stmt = text("SELECT action, actor_id, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 50")
            res = await session.execute(stmt)
            for action, actor_id, details, created_at in res.all():
                # details might be a string or a dict depending on the driver/setup
                if isinstance(details, str):
                    try:
                        d = json.loads(details)
                    except:
                        d = details
                else:
                    d = details
                print(f"[{created_at}] Action: {action}, Actor: {actor_id}, Details: {d}")
        except Exception as e:
            print(f"Error querying audit_log: {e}")

if __name__ == "__main__":
    asyncio.run(check_audit_logs())

import asyncio
import sys
import os
from sqlalchemy import text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import engine

async def clear_locks():
    print("🧨 Emergency: Clearing Database Locks...")
    async with engine.connect() as conn:
        # Find and terminate blocking processes
        # We target processes older than 1 minute that are holding locks
        try:
            result = await conn.execute(text("""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE pid != pg_backend_pid()
                  AND (state != 'idle' OR xact_start < now() - interval '1 minute');
            """))
            terminated = result.fetchall()
            print(f"✅ Terminated {len(terminated)} blocking connections.")
        except Exception as e:
            print(f"⚠️ Error clearing locks: {e}")
            print("Note: You might not have SUPERUSER permissions. Trying to kill only your own connections...")
            try:
                # Fallback: try to kill connections from the same user if possible
                # (Postgres usually allows killing your own processes)
                await conn.execute(text("""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE pid != pg_backend_pid()
                      AND usename = current_user
                      AND (state != 'idle' OR xact_start < now() - interval '1 minute');
                """))
                print("✅ Terminated your own blocking connections.")
            except Exception as e2:
                print(f"❌ Failed to clear locks: {e2}")

if __name__ == "__main__":
    asyncio.run(clear_locks())

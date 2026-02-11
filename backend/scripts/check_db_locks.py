import asyncio
import os
import sys

from sqlalchemy import text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv() # Load from .env if present

from app.models.partner import engine


async def check_locks():
    print("🔍 Checking for Database Locks and Active Connections...")
    async with engine.connect() as conn:
        # Check active connections
        result = await conn.execute(text("""
            SELECT pid, state, query, xact_start, now() - xact_start AS duration
            FROM pg_stat_activity
            WHERE state != 'idle' AND pid != pg_backend_pid();
        """))
        active = result.fetchall()
        print(f"📈 Found {len(active)} active processes (excluding this one).")
        for row in active:
            print(f"  PID: {row.pid} | Duration: {row.duration} | State: {row.state} | Query: {row.query[:100]}")

        # Check for locks
        result = await conn.execute(text("""
            SELECT blocked_locks.pid AS blocked_pid,
                   blocked_activity.query AS blocked_query,
                   blocking_locks.pid AS blocking_pid,
                   blocking_activity.query AS blocking_query
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
            JOIN pg_catalog.pg_locks blocking_locks
                 ON blocking_locks.locktype = blocked_locks.locktype
                 AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                 AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                 AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                 AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                 AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                 AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                 AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                 AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                 AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                 AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
            WHERE NOT blocked_locks.granted;
        """))
        locks = result.fetchall()
        if locks:
            print(f"⚠️ Warning: Found {len(locks)} blocking locks!")
            for row in locks:
                print(f"  Blocked PID {row.blocked_pid} by {row.blocking_pid}")
                print(f"    Blocked Query: {row.blocked_query[:100]}")
                print(f"    Blocking Query: {row.blocking_query[:100]}")
        else:
            print("✅ No blocking locks found.")

if __name__ == "__main__":
    asyncio.run(check_locks())

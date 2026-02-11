import os

import psycopg2
from dotenv import load_dotenv

# Load .env
load_dotenv()

def clear_locks():
    # Use PUBLIC_URL as it works outside Railway network (locally)
    db_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ Error: No DATABASE_URL found in .env")
        return

    # Ensure it's not a sqlite url
    if "sqlite" in db_url:
        print("❌ Error: DATABASE_URL is pointing to SQLite. We need Postgres to clear locks.")
        return

    # Fix for async driver if it's there
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)

    print("🧨 Connecting to database to clear locks...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Check for active connections
        cur.execute("""
            SELECT pid, state, query, now() - xact_start AS duration
            FROM pg_stat_activity
            WHERE state != 'idle' AND pid != pg_backend_pid();
        """)
        rows = cur.fetchall()
        print(f"📊 Found {len(rows)} active connections.")
        for row in rows:
            print(f"  PID: {row[0]} | Duration: {row[3]} | Query: {row[2][:100]}")

        # 2. Terminate them
        cur.execute("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE pid != pg_backend_pid()
              AND (state != 'idle' OR xact_start < now() - interval '1 minute');
        """)
        terminated = cur.fetchall()
        print(f"✅ Successfully terminated {len(terminated)} blocking connections.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    clear_locks()

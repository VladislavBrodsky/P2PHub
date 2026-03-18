import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import os

import psycopg2
from dotenv import load_dotenv


def cleanup():
    # Load .env to get DATABASE_PUBLIC_URL
    # Search for .env in current and parent directories
    load_dotenv()
    db_url = os.getenv('DATABASE_PUBLIC_URL')
    if not db_url:
        print("DATABASE_PUBLIC_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Target only the known test IDs to be safe
        test_ids = [str(x) for x in range(88800001, 88800020)]
        
        cur.execute(
            "DELETE FROM notificationretry WHERE status = 'failed' AND chat_id = ANY(%s);",
            (test_ids,)
        )
        deleted_count = cur.rowcount
        conn.commit()
        
        print(f"Cleanup complete. Deleted {deleted_count} test notification records.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    cleanup()


import asyncio
import os
import sys
from datetime import datetime, timedelta

# Try imports
try:
    import asyncpg
except ImportError:
    print("❌ asyncpg not found. Please pip install asyncpg")
    sys.exit(1)

# Fetch from environ or hardcode fallbacks (from .env)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to reading .env manually
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    DATABASE_URL = line.strip().split("=", 1)[1]
                    break

if not DATABASE_URL:
    print("❌ DATABASE_URL not set")
    sys.exit(1)

# Fix scheme for asyncpg
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def grant_pro(username: str, months: int):
    # Standardize username (remove leading @)
    if username.startswith("@"):
        username = username[1:]
    
    print(f"Connecting to DB using URL: {DATABASE_URL[:20]}...")
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Find user
        row = await conn.fetchrow("SELECT id, is_pro, pro_expires_at, pro_tokens FROM partner WHERE username = $1", username)
        
        if not row:
            print(f"❌ User @{username} not found")
            return

        partner_id = row['id']
        is_pro = row['is_pro']
        pro_expires_at = row['pro_expires_at']
        pro_tokens = row['pro_tokens']

        print(f"✅ Found user @{username} (ID: {partner_id})")
        print(f"Current status: is_pro={is_pro}, expires_at={pro_expires_at}")

        # Calculate new expiration
        now = datetime.utcnow()
        if is_pro and pro_expires_at and pro_expires_at > now:
            new_expires_at = pro_expires_at + timedelta(days=30 * months)
        else:
            new_expires_at = now + timedelta(days=30 * months)

        # Build update query
        # We need to make sure we cast values correctly if needed, but asyncpg handles most inferring.
        # However, pro_tokens update logic: max(pro_tokens, 1000)
        new_pro_tokens = max(pro_tokens, 1000)
        
        update_query = """
            UPDATE partner
            SET 
                is_pro = TRUE,
                pro_expires_at = $1,
                pro_started_at = COALESCE(pro_started_at, $2),
                pro_purchased_at = $2,
                subscription_plan = $3,
                pro_tokens = $4,
                pro_notification_seen = FALSE,
                updated_at = $2
            WHERE id = $5
            RETURNING pro_expires_at, subscription_plan
        """
        
        subscription_plan = f"GIFTED_{months}M"
        
        updated_row = await conn.fetchrow(
            update_query,
            new_expires_at,
            now,
            subscription_plan,
            new_pro_tokens,
            partner_id
        )

        print(f"🚀 PRO status granted to @{username}!")
        print(f"New expiration: {updated_row['pro_expires_at']}")
        print(f"Plan: {updated_row['subscription_plan']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python grant_pro_raw.py <username> <months>")
        sys.exit(1)
    
    username = sys.argv[1]
    months = int(sys.argv[2])
    asyncio.run(grant_pro(username, months))

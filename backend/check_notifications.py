
import asyncio
import os
import sys
from datetime import datetime, timedelta

# Hardcoding environment variables due to permission issues with .env files
os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["REDIS_URL"] = "redis://:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@redis.railway.internal:6379/0"

# Add backend directory to sys.path so 'app' can be found
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# We need to monkeypath load_dotenv to avoid it failing inside config.py or being used unnecessarily
def mock_load_dotenv(*args, **kwargs):
    return True
import dotenv
dotenv.load_dotenv = mock_load_dotenv

from app.models.partner import engine
from app.models.audit_log import AuditLog

async def check_redis():
    print("\nChecking Redis connection...")
    redis_url = os.environ.get("REDIS_URL")
    if not redis_url:
        print("REDIS_URL not set in env.")
        return
    
    try:
        import redis.asyncio as redis
        r = redis.from_url(redis_url)
        await r.ping()
        print("✅ Redis connection successful!")
        await r.close()
    except ImportError:
        print("redis-py not installed.")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")

async def check_notifications():
    await check_redis()
    print("\nChecking for notification logs in the last 24 hours...")
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Calculate time 24 hours ago
        since_time = datetime.utcnow() - timedelta(hours=24)
        
        # Query for notification related logs
        query = select(AuditLog).where(
            AuditLog.entity_type == "notification",
            AuditLog.created_at >= since_time
        ).order_by(AuditLog.created_at.desc())
        
        result = await session.execute(query)
        logs = result.scalars().all()
        
        if not logs:
            print("No notification logs found in the last 24 hours.")
            return

        print(f"Found {len(logs)} notification logs.")
        
        stats = {
            "send_success": 0,
            "send_failed": 0,
            "enqueue_failed": 0,
            "fallback_sent": 0,
            "total_failure": 0,
            "other": 0
        }
        
        print("\n--- Recent Logs (Top 20) ---")
        for log in logs[:20]:
            print(f"[{log.created_at}] Action: {log.action} | ID: {log.entity_id} | Details: {log.details}")
            if log.action in stats:
                stats[log.action] += 1
            else:
                stats["other"] += 1
        
        print("\n--- Statistics (Last 24h) ---")
        for action, count in stats.items():
            print(f"{action}: {count}")

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
             asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(check_notifications())
    except Exception as e:
        print(f"Error: {e}")

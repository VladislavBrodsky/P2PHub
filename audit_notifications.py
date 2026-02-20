"""
Full Notification System Audit Script
- Checks NotificationRetry table (all statuses, errors, patterns)
- Checks broker (Redis) queue for stuck tasks
- Checks rate limit service state
- Inspects dead-letter / failed tasks in broker
"""
import asyncio
import os
import sys

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
from dotenv import load_dotenv
load_dotenv(dotenv_path)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway")
REDIS_URL = os.getenv("REDIS_URL", "")

SEPARATOR = "=" * 70

async def audit_db():
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.orm import sessionmaker
    from sqlmodel import select, func, col
    from sqlmodel.ext.asyncio.session import AsyncSession
    from app.models.notification_retry import NotificationRetry
    from collections import Counter

    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print(f"\n{SEPARATOR}")
    print("📊 NOTIFICATION RETRY TABLE AUDIT")
    print(SEPARATOR)

    async with async_session() as session:
        # ── Status counts ──────────────────────────────────────────────
        all_items_result = await session.exec(select(NotificationRetry))
        all_items = all_items_result.all()
        
        status_counter = Counter(i.status for i in all_items)
        print(f"\nTotal records in notification_retry: {len(all_items)}")
        for status, cnt in sorted(status_counter.items()):
            print(f"  └─ {status}: {cnt}")

        # ── Pending stuck check ────────────────────────────────────────
        from datetime import datetime, UTC
        now = datetime.now(UTC).replace(tzinfo=None)
        
        pending = [i for i in all_items if i.status == "pending"]
        if pending:
            print(f"\n⚠️  STUCK PENDING NOTIFICATIONS: {len(pending)}")
            for item in pending[:10]:
                age_min = (now - item.created_at).total_seconds() / 60
                print(f"   ID={item.id} | chat_id={item.chat_id} | attempts={item.attempts} | age={age_min:.1f}min | next_retry={item.next_retry_at} | err={item.last_error}")
        else:
            print(f"\n✅ No stuck pending notifications.")

        # ── Failed breakdown ───────────────────────────────────────────
        failed = [i for i in all_items if i.status == "failed"]
        if failed:
            print(f"\n❌ FAILED NOTIFICATIONS: {len(failed)}")
            error_counter = Counter(i.last_error for i in failed)
            print("  Top error patterns:")
            for err, cnt in error_counter.most_common(10):
                print(f"   [{cnt}x] {err}")
            
            print("\n  Last 5 failed items:")
            for item in sorted(failed, key=lambda x: x.created_at, reverse=True)[:5]:
                age_hrs = (now - item.created_at).total_seconds() / 3600
                print(f"   ID={item.id} | chat_id={item.chat_id} | attempts={item.attempts} | age={age_hrs:.1f}h | err={item.last_error}")
        
        # ── Sent stats ─────────────────────────────────────────────────
        sent = [i for i in all_items if i.status == "sent"]
        if sent:
            print(f"\n✅ SENT (via retry): {len(sent)}")

    await engine.dispose()


async def audit_redis():
    import redis.asyncio as aioredis

    print(f"\n{SEPARATOR}")
    print("🔴 REDIS / BROKER QUEUE AUDIT")
    print(SEPARATOR)

    try:
        # Parse REDIS_URL - strip internal-only URL and use public one if needed
        redis_url = REDIS_URL
        if "redis.railway.internal" in redis_url:
            print("  ⚠️  Redis URL is internal (railway.internal) — cannot connect from local.")
            print("  Skipping Redis audit (only works from within Railway network).")
            return

        r = aioredis.from_url(redis_url, decode_responses=True)
        
        # Check broker task queues (TaskIQ default queue keys)
        keys = await r.keys("*")
        taskiq_keys = [k for k in keys if "taskiq" in k.lower() or "task" in k.lower() or "queue" in k.lower() or "broker" in k.lower()]
        
        print(f"\nAll Redis keys matching task/queue/broker patterns ({len(taskiq_keys)}):")
        for k in sorted(taskiq_keys)[:30]:
            key_type = await r.type(k)
            size = 0
            try:
                if key_type == "list":
                    size = await r.llen(k)
                elif key_type == "zset":
                    size = await r.zcard(k)
                elif key_type == "set":
                    size = await r.scard(k)
                elif key_type == "hash":
                    size = await r.hlen(k)
                elif key_type == "string":
                    size = 1
            except:
                size = "?"
            print(f"  {k} ({key_type}, size={size})")

        # Specifically check for send_telegram_task queue
        telegram_task_keys = [k for k in keys if "telegram" in k.lower() or "send_telegram" in k.lower()]
        if telegram_task_keys:
            print(f"\n⚠️  Telegram task queue keys found:")
            for k in telegram_task_keys:
                key_type = await r.type(k)
                try:
                    if key_type == "list":
                        size = await r.llen(k)
                        print(f"  {k}: {size} items in queue")
                        if size > 0:
                            sample = await r.lrange(k, 0, 2)
                            for s in sample:
                                print(f"    Sample: {s[:200]}")
                    else:
                        print(f"  {k}: type={key_type}")
                except Exception as e:
                    print(f"  {k}: error reading - {e}")

        # Rate limiter keys
        rl_keys = [k for k in keys if "rate" in k.lower() or "rl:" in k.lower() or "msg_dedup" in k.lower()]
        print(f"\n📉 Rate limiter / dedup keys: {len(rl_keys)}")
        for k in rl_keys[:10]:
            key_type = await r.type(k)
            try:
                if key_type == "list":
                    size = await r.llen(k)
                elif key_type == "zset":
                    size = await r.zcard(k)
                else:
                    size = "?"
            except:
                size = "?"
            print(f"  {k} ({key_type}, size={size})")

        await r.aclose()
    except Exception as e:
        print(f"\n❌ Redis connection failed: {e}")


async def audit_broker_config():
    print(f"\n{SEPARATOR}")
    print("⚙️  BROKER / WORKER CONFIGURATION AUDIT")
    print(SEPARATOR)

    try:
        from app.core.broker import broker
        print(f"\n  Broker type: {type(broker).__name__}")
        print(f"  Broker is_worker_process: {getattr(broker, 'is_worker_process', 'N/A')}")
        
        # Check if broker has state
        state = getattr(broker, 'state', None)
        if state:
            print(f"  Broker state: {state}")
        
        # Check result backend
        result_backend = getattr(broker, 'result_backend', None)
        print(f"  Result backend: {type(result_backend).__name__ if result_backend else 'None'}")
        
        # Check middlewares
        middlewares = getattr(broker, 'middlewares', [])
        print(f"  Middlewares ({len(middlewares)} total):")
        for mw in middlewares:
            print(f"    - {type(mw).__name__}")
            
    except Exception as e:
        print(f"\n❌ Broker config audit failed: {e}")


async def audit_task_registrations():
    print(f"\n{SEPARATOR}")
    print("📋 REGISTERED BROKER TASKS")
    print(SEPARATOR)

    try:
        from app.core.broker import broker
        tasks = getattr(broker, 'state', {})
        
        # Try to find registered tasks
        try:
            from taskiq import TaskiqMessage
        except:
            pass
        
        # Import all tasks to trigger registration
        try:
            import app.services.notification_service as ns
            import app.services.maintenance_service as ms
            print(f"\n  send_telegram_task: {'✅ imported' if hasattr(ns, 'send_telegram_task') else '❌ missing'}")
            print(f"  notify_admin_payment_task: {'✅ imported' if hasattr(ns, 'notify_admin_payment_task') else '❌ missing'}")
        except Exception as e:
            print(f"\n  ❌ Import error: {e}")
    except Exception as e:
        print(f"\n❌ Task registration audit failed: {e}")


async def check_notification_callsites():
    """Check that all notification callers use the service correctly."""
    print(f"\n{SEPARATOR}")
    print("🔍 NOTIFICATION CALLSITE AUDIT")
    print(SEPARATOR)
    
    import subprocess
    result = subprocess.run(
        ["grep", "-rn", "notification_service\.\|enqueue_notification\|send_critical\|send_standard\|send_low_prio\|send_telegram_task", 
         "backend/app/", "--include=*.py", "-l"],
        capture_output=True, text=True, cwd=os.path.dirname(__file__)
    )
    files = result.stdout.strip().split("\n") if result.stdout.strip() else []
    print(f"\n  Files using notification_service ({len(files)} files):")
    for f in sorted(files):
        print(f"    - {f}")
    
    # Check for direct bot.send_message calls that bypass the service
    result2 = subprocess.run(
        ["grep", "-rn", "bot\.send_message", 
         "backend/app/", "--include=*.py", "-l"],
        capture_output=True, text=True, cwd=os.path.dirname(__file__)
    )
    bypass_files = result2.stdout.strip().split("\n") if result2.stdout.strip() else []
    bypass_files = [f for f in bypass_files if f]
    print(f"\n  Files calling bot.send_message directly (bypassers):")
    if bypass_files:
        for f in bypass_files:
            print(f"    ⚠️  {f}")
    else:
        print("    ✅ None — all sends go through notification_service")


async def check_worker_file():
    print(f"\n{SEPARATOR}")
    print("🔧 WORKER ENTRYPOINT AUDIT")
    print(SEPARATOR)
    
    worker_path = os.path.join(os.path.dirname(__file__), "backend/app/worker.py")
    if os.path.exists(worker_path):
        with open(worker_path) as f:
            content = f.read()
        print(f"\n  worker.py content:\n")
        print("  " + "\n  ".join(content.splitlines()))
    else:
        print("  ❌ worker.py not found!")
    
    # Check Procfile
    procfile_path = os.path.join(os.path.dirname(__file__), "Procfile")
    if os.path.exists(procfile_path):
        with open(procfile_path) as f:
            content = f.read()
        print(f"\n  Procfile content:\n")
        print("  " + "\n  ".join(content.splitlines()))
    else:
        print("  ❌ Procfile not found!")


async def check_maintenance_scheduler():
    print(f"\n{SEPARATOR}")
    print("🕒 MAINTENANCE SCHEDULER AUDIT (retry processor)")
    print(SEPARATOR)
    
    import subprocess
    result = subprocess.run(
        ["grep", "-n", "process_retries\|notification_service\|retry", 
         "backend/app/services/maintenance_service.py", "--include=*.py"],
        capture_output=True, text=True, cwd=os.path.dirname(__file__)
    )
    if result.stdout.strip():
        print("\n  maintenance_service.py references to process_retries:")
        for line in result.stdout.strip().splitlines():
            print(f"    {line}")
    else:
        print(f"\n  ⚠️  No process_retries references in maintenance_service.py!")


async def main():
    print(f"\n{'#' * 70}")
    print("# NOTIFICATION SYSTEM FULL AUDIT")
    print(f"# {__import__('datetime').datetime.now()}")
    print(f"{'#' * 70}")

    await audit_db()
    await audit_redis()
    await audit_broker_config()
    await check_notification_callsites()
    await check_worker_file()
    await check_maintenance_scheduler()

    print(f"\n{SEPARATOR}")
    print("✅ AUDIT COMPLETE")
    print(SEPARATOR)


if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import os
import sys
import json
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

# Set database URL
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check_users():
    # Set sys.path so we can import app models
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    sys.path.append(os.path.join(project_root, "backend"))

    from app.models.partner import Partner

    engine = create_async_engine(DATABASE_URL)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        # Get count of total users
        stmt_count = select(Partner)
        result = await session.exec(stmt_count)
        partners = result.all()
        total_users = len(partners)

        print("==================================================")
        print(f"DATABASE AUDIT: {total_users} TOTAL USERS FOUND")
        print("==================================================")

        # Breakdowns
        test_users_count = 0
        real_users_count = 0
        pro_users_count = 0
        pro_plus_users_count = 0
        free_users_count = 0
        active_plans = {}

        corrupted_users = []

        for p in partners:
            if p.is_test:
                test_users_count += 1
            else:
                real_users_count += 1

            if p.is_pro:
                pro_users_count += 1
            
            plan = p.subscription_plan
            if plan:
                active_plans[plan] = active_plans.get(plan, 0) + 1
                if plan.startswith("PRO_PLUS"):
                    pro_plus_users_count += 1
            else:
                free_users_count += 1

            # Check for anomalies/corruptions:
            # - Level <= 0
            # - Negative XP, balance, or pro_tokens
            # - Invalid JSON in completed_stages or unlocked_stages
            anomalies = []
            if p.level <= 0:
                anomalies.append(f"Invalid level: {p.level}")
            if p.xp < 0:
                anomalies.append(f"Negative XP: {p.xp}")
            if p.balance < 0:
                anomalies.append(f"Negative balance: {p.balance}")
            if p.pro_tokens < 0:
                anomalies.append(f"Negative tokens: {p.pro_tokens}")

            # Try parsing completed_stages
            if p.completed_stages:
                try:
                    stages = json.loads(p.completed_stages)
                    if not isinstance(stages, list):
                        anomalies.append("completed_stages is not a list")
                except Exception as e:
                    anomalies.append(f"completed_stages JSON error: {e}")

            if p.unlocked_stages:
                try:
                    stages = json.loads(p.unlocked_stages)
                    if not isinstance(stages, list):
                        anomalies.append("unlocked_stages is not a list")
                except Exception as e:
                    anomalies.append(f"unlocked_stages JSON error: {e}")

            if anomalies:
                corrupted_users.append({
                    "id": p.id,
                    "telegram_id": p.telegram_id,
                    "username": p.username,
                    "anomalies": anomalies
                })

        print(f"Real Users: {real_users_count}")
        print(f"Test Users: {test_users_count}")
        print(f"Free Users: {free_users_count}")
        print(f"Pro (Any) Users: {pro_users_count}")
        print(f"Pro Plus Users: {pro_plus_users_count}")
        print("\nSubscription Plans Breakdown:")
        for plan_name, count in active_plans.items():
            print(f" - {plan_name}: {count}")

        print("\n--------------------------------------------------")
        print(f"ANOMALY DETECTION: {len(corrupted_users)} USERS WITH METRIC/DATA ISSUES")
        print("--------------------------------------------------")
        if corrupted_users:
            for c in corrupted_users[:20]:
                print(f"User {c['username']} (TG: {c['telegram_id']}, ID: {c['id']}): {', '.join(c['anomalies'])}")
            if len(corrupted_users) > 20:
                print(f"... and {len(corrupted_users) - 20} more.")
        else:
            print("No anomalies detected! All user metrics and structures are healthy and valid.")

        # Print Top 10 Active Users by XP / Level to make sure they represent properly
        print("\n--------------------------------------------------")
        print("TOP 10 ACTIVE USERS BY XP")
        print("--------------------------------------------------")
        # Sort by XP descending
        sorted_partners = sorted(partners, key=lambda x: x.xp, reverse=True)
        for idx, p in enumerate(sorted_partners[:10], 1):
            print(f"{idx}. @{p.username or 'unknown'} (ID: {p.id}, TG: {p.telegram_id}) - Lvl: {p.level}, XP: {p.xp:.1f}, Balance: {p.balance:.2f} USDT, Plan: {p.subscription_plan or 'FREE'}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_users())

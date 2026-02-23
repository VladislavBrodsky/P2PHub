import asyncio
from app.services.admin_service import admin_service
from app.services.maintenance_service import check_tree_integrity, run_economy_audit
from app.models.partner import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def audit_admin_dashboard():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print("--- ADMIN DASHBOARD: PALANTIR & LEDGER AUDIT ---")
    
    # 1. Audit Palantir (Activity Feed)
    print("\n[1] Auditing Palantir Feed...")
    try:
        feed = await admin_service.get_palantir_feed(limit=10)
        print(f"✅ Palantir: Successfully retrieved {len(feed)} latest events.")
        for i, event in enumerate(feed[:3]):
            print(f"  {i+1}. [{event['created_at']}] {event['action_type']}: {event['description']}")
    except Exception as e:
        print(f"❌ Palantir: FAILED to retrieve feed - {e}")

    # 2. Audit Ledger (Economy Reconciliation)
    print("\n[2] Auditing Ledger (Economy Reconciliation)...")
    try:
        async with async_session() as session:
            economy_res = await run_economy_audit(session)
            print(f"✅ Ledger: Economy Audit status: {economy_res['status']}")
            print(f"   Checked {economy_res['total_checked']} partners.")
            print(f"   Discrepancies found: {economy_res['discrepancies_found']}")
            if economy_res['anomalies']:
                for anomaly in economy_res['anomalies']:
                    print(f"    - {anomaly}")
    except Exception as e:
        print(f"❌ Ledger: Economy Audit FAILED - {e}")

    # 3. Audit Tree (Structural Integrity)
    print("\n[3] Auditing Tree Integrity...")
    try:
        async with async_session() as session:
            tree_res = await check_tree_integrity(session)
            print(f"✅ Tree: Structural Audit status: {tree_res['status']}")
            print(f"   Checked {tree_res['total_checked']} partners.")
            print(f"   Anomalies found: {tree_res['anomaly_count']}")
    except Exception as e:
        print(f"❌ Tree: Structural Audit FAILED - {e}")

if __name__ == "__main__":
    asyncio.run(audit_admin_dashboard())

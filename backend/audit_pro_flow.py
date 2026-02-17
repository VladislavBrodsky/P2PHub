import asyncio
import logging
import os
import sys
from datetime import UTC, datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add the current directory to sys.path for module imports
sys.path.append(os.getcwd())

from app.models.partner import (
    Earning,
    Partner,
    XPTransaction,
    async_session_maker,
    engine,
)
from app.models.transaction import PartnerTransaction
from app.services.audit_service import (
    AuditLog,  # Assuming this exists or checking audit_log table
)


async def audit_pro_flow():
    print("🚀 Starting PRO Flow Audit...")
    
    async with async_session_maker() as session:
        # 1. Find PRO sessions in the last 24 hours
        stmt = select(Partner).where(Partner.is_pro == True, Partner.pro_purchased_at >= datetime.now(UTC) - timedelta(hours=24))
        result = await session.exec(stmt)
        pro_partners = result.all()
        
        print(f"Found {len(pro_partners)} new PRO partners in the last 24h.")
        
        for p in pro_partners:
            print(f"\n--- Auditing Partner: {p.username} (ID: {p.id}, TG: {p.telegram_id}) ---")
            
            # 2. Check for completed transaction
            tx_stmt = select(PartnerTransaction).where(PartnerTransaction.partner_id == p.id, PartnerTransaction.status == "completed")
            tx_result = await session.exec(tx_stmt)
            txs = tx_result.all()
            print(f"  Completed Transactions: {len(txs)}")
            for tx in txs:
                print(f"    TX ID: {tx.id}, Amount: {tx.amount} {tx.currency}, Hash: {tx.tx_hash}")
                
            # 3. Check for Commissions
            comm_stmt = select(Earning).where(Earning.description.like("%PRO Commission%"), Earning.created_at >= p.pro_purchased_at - timedelta(minutes=5))
            # We need to filter earnings that were triggered by THIS partner.
            # The current Earning model doesn't store 'trigger_partner_id'.
            # But the audit_log table should.
            
            # Let's check audit_log instead if possible.
            # Or just look for Earnings created around the same time.
            
            print("  Recent Commissions (approximate matching by time):")
            # This is a bit loose, but let's see.
            comm_res = await session.exec(select(Earning).where(Earning.description.like("%PRO Commission%"), Earning.created_at >= p.pro_purchased_at - timedelta(seconds=10), Earning.created_at <= p.pro_purchased_at + timedelta(seconds=10)))
            comms = comm_res.all()
            print(f"    Found {len(comms)} commissions linked to this timeframe.")
            for c in comms:
                print(f"      To Partner ID: {c.partner_id}, Amount: {c.amount} {c.currency}, Level: {c.level}")

            # 4. Check Audit Log for Notifications
            # Assuming audit_log table exists.
            from sqlalchemy import text
            audit_stmt = text("SELECT action, actor_id, details FROM audit_log WHERE (actor_id = :tg_id OR details->>'buyer_id' = :p_id) AND created_at >= :since")
            audit_res = await session.execute(audit_stmt, {"tg_id": str(p.telegram_id), "p_id": str(p.id), "since": p.pro_purchased_at - timedelta(minutes=5)})
            logs = audit_res.all()
            print("  Audit Logs:")
            for action, actor_id, details in logs:
                print(f"    Action: {action}, Actor: {actor_id}, Details: {details}")

        if not pro_partners:
            print("No recent PRO upgrades found to audit.")

if __name__ == "__main__":
    asyncio.run(audit_pro_flow())

import asyncio
from sqlalchemy import func
from sqlmodel import select
from app.models.partner import engine, Partner, XPTransaction, PartnerTask
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def check_task_xp_ledger():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        print("--- TASK XP LEDGER CROSS-CHECK ---")
        
        # 1. Sum XP from PartnerTask
        task_xp_stmt = select(PartnerTask.partner_id, func.sum(PartnerTask.reward_xp)).where(PartnerTask.status == "COMPLETED").group_by(PartnerTask.partner_id)
        task_xp_sums = (await session.execute(task_xp_stmt)).all()
        task_xp_map = {row[0]: float(row[1] or 0) for row in task_xp_sums}
        
        # 2. Sum XP from XPTransaction with type 'TASK' or similar
        tx_task_xp_stmt = select(XPTransaction.partner_id, func.sum(XPTransaction.amount)).where(XPTransaction.type.in_(["TASK", "MILESTONE"])).group_by(XPTransaction.partner_id)
        tx_task_xp_sums = (await session.execute(tx_task_xp_stmt)).all()
        tx_task_xp_map = {row[0]: float(row[1] or 0) for row in tx_task_xp_sums}
        
        mismatches = []
        for p_id, task_total in task_xp_map.items():
            tx_total = tx_task_xp_map.get(p_id, 0.0)
            if abs(task_total - tx_total) > 0.1:
                mismatches.append((p_id, task_total, tx_total))
        
        if mismatches:
            print(f"⚠️ Found {len(mismatches)} partners with TASK XP mismatch:")
            for p_id, task_t, tx_t in mismatches[:10]:
                partner = await session.get(Partner, p_id)
                tg_id = partner.telegram_id if partner else "Unknown"
                print(f"  - Partner ID: {p_id} (TG: {tg_id}), Task XP: {task_t}, TX Ledger XP: {tx_t}")
        else:
            print("✅ All Task XP is correctly reflected in XPTransactions.")

if __name__ == "__main__":
    asyncio.run(check_task_xp_ledger())

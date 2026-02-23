import asyncio
import logging
import argparse
from sqlalchemy import func
from sqlmodel import select
from app.models.partner import engine, Partner, XPTransaction, PartnerTask
from app.models.audit_log import AuditLog
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reconcile_ghost_xp")

async def reconcile(dry_run: bool = True):
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print(f"--- XP RECONCILIATION ENGINE (Dry Run: {dry_run}) ---")
        
        # 1. Fetch all partners
        partners_res = await session.execute(select(Partner))
        partners = partners_res.scalars().all()
        print(f"Checking {len(partners)} partners...")

        # 2. Fetch all task rewards
        task_rewards_stmt = select(PartnerTask.partner_id, PartnerTask.task_id, PartnerTask.reward_xp, PartnerTask.completed_at).where(PartnerTask.status == "COMPLETED")
        task_rewards = (await session.execute(task_rewards_stmt)).all()
        
        # 3. Fetch all XP transactions (Task/Milestone type)
        task_txs_stmt = select(XPTransaction).where(XPTransaction.type.in_(["TASK", "MILESTONE"]))
        task_txs = (await session.execute(task_txs_stmt)).scalars().all()
        
        # Create unique mappings for cross-checking
        tx_refs = {(t.partner_id, t.reference_id) for t in task_txs}
        
        missing_tx_count = 0
        
        # 4. Phase 1: Reconstruct missing XPTransaction from PartnerTask
        print("\n[Phase 1] Reconstructing missing Task/Milestone transactions...")
        for p_id, task_id, reward, completed_at in task_rewards:
            ref_id = task_id
            if (p_id, ref_id) not in tx_refs:
                missing_tx_count += 1
                if not dry_run:
                    session.add(XPTransaction(
                        partner_id=p_id,
                        amount=float(reward),
                        type="TASK" if "catalyst" not in task_id else "MILESTONE",
                        description=f"Reconstructed from PartnerTask: {task_id}",
                        reference_id=ref_id,
                        created_at=completed_at
                    ))
                    print(f"  + Reconstructed TX for Partner {p_id}, Task {task_id}: {reward} XP")
                else:
                    print(f"  ? Would reconstruct TX for Partner {p_id}, Task {task_id}: {reward} XP")

        if missing_tx_count > 0:
            if not dry_run:
                await session.commit()
                print(f"✅ Reconstructed {missing_tx_count} missing transactions.")
            else:
                print(f"ℹ️ {missing_tx_count} transactions would be reconstructed.")
        else:
            print("✅ No missing task transactions found.")

        # 5. Phase 2: Align Partner.xp with recalculated ledger
        print("\n[Phase 2] Aligning Partner.xp with ledger...")
        
        # Fresh sum after reconstruction
        xp_sums_stmt = select(XPTransaction.partner_id, func.sum(XPTransaction.amount)).group_by(XPTransaction.partner_id)
        xp_sums = {row[0]: float(row[1] or 0) for row in (await session.execute(xp_sums_stmt)).all()}
        
        aligned_count = 0
        ghost_xp_sum = 0
        
        for partner in partners:
            expected_xp = xp_sums.get(partner.id, 0.0)
            actual_xp = float(partner.xp)
            
            if abs(actual_xp - expected_xp) > 0.1:
                diff = actual_xp - expected_xp
                ghost_xp_sum += diff
                aligned_count += 1
                
                if not dry_run:
                    partner.xp = expected_xp
                    session.add(partner)
                    
                    # Log the reconciliation action
                    session.add(AuditLog(
                        partner_id=partner.id,
                        action_type="SYSTEM",
                        action="xp_reconciliation",
                        description=f"XP aligned to ledger. Adjustment: {-diff:+.2f} XP",
                        details={"expected": expected_xp, "actual": actual_xp, "diff": diff}
                    ))
                    print(f"  * Aligned Partner {partner.telegram_id}: {actual_xp} -> {expected_xp} (Diff: {diff:+.2f})")
                else:
                    print(f"  ? Would align Partner {partner.telegram_id}: {actual_xp} -> {expected_xp} (Diff: {diff:+.2f})")

        if aligned_count > 0:
            if not dry_run:
                await session.commit()
                print(f"✅ Aligned {aligned_count} partners. Total Ghost XP cleared: {ghost_xp_sum:+.2f}")
            else:
                print(f"ℹ️ {aligned_count} partners would be aligned. Total Ghost XP to clear: {ghost_xp_sum:+.2f}")
        else:
            print("✅ All partners already match the ledger.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="Apply fixes (default is dry-run)")
    args = parser.parse_args()
    
    asyncio.run(reconcile(dry_run=not args.fix))

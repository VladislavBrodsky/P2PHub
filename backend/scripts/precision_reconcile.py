import asyncio
import json
from sqlmodel import select, func
from app.models.partner import Partner, XPTransaction, Earning, get_session
from app.models.transaction import PartnerTransaction
from app.core.config import settings

async def precision_reconcile_partner(session, partner_id: int):
    partner = await session.get(Partner, partner_id)
    if not partner: return

    print(f"Precise Reconcile: {partner.telegram_id}")

    # --- XP RECONCILIATION ---
    stmt_xp = select(func.sum(XPTransaction.amount)).where(XPTransaction.partner_id == partner.id)
    ledger_xp = float((await session.exec(stmt_xp)).first() or 0.0)
    actual_xp = float(partner.xp)
    xp_diff = actual_xp - ledger_xp

    if abs(xp_diff) > 0.01:
        print(f"  XP Diff: {xp_diff}")
        if xp_diff > 0:
            # Partner has more than ledger. Try to find missing academy stages.
            completed_stages = json.loads(partner.completed_stages or "[]")
            for stage_id in completed_stages:
                ref_id = f"acad_comp_{stage_id}_{partner.id}"
                stmt = select(XPTransaction).where(XPTransaction.reference_id == ref_id)
                if not (await session.exec(stmt)).first():
                    reward = 500.0
                    if xp_diff >= reward:
                        print(f"    Adding Missing Academy Reward: Stage {stage_id} (+500)")
                        session.add(XPTransaction(
                            partner_id=partner.id, amount=reward, type="ACADEMY_REWARD",
                            description=f"Academy Stage {stage_id} (Reconciled)",
                            reference_id=ref_id
                        ))
                        xp_diff -= reward
                    else:
                        break # Stop if we can't fit a full stage
        
        # If still diff, add catch-all adjustment
        if abs(xp_diff) > 0.01:
            print(f"    Adding catch-all XP adjustment: {xp_diff}")
            session.add(XPTransaction(
                partner_id=partner.id, amount=xp_diff, type="RECONCILIATION_ADJUSTMENT",
                description="Manual Ledger Alignment",
                reference_id=f"reconcile_xp_{partner.id}_{int(asyncio.get_event_loop().time())}"
            ))

    # --- USDT RECONCILIATION ---
    stmt_usdt = select(func.sum(Earning.amount)).where(Earning.partner_id == partner.id, Earning.currency == "USDT")
    ledger_usdt = float((await session.exec(stmt_usdt)).first() or 0.0)
    actual_usdt = float(partner.balance)
    usdt_diff = actual_usdt - ledger_usdt

    if abs(usdt_diff) > 0.01:
        print(f"  USDT Diff: {usdt_diff}")
        if usdt_diff < 0:
            # Partner has less than ledger. Look for missing balance deductions.
            stmt_tx = select(PartnerTransaction).where(
                PartnerTransaction.partner_id == partner.id,
                PartnerTransaction.currency == "BALANCE",
                PartnerTransaction.status == "completed"
            )
            res_tx = await session.exec(stmt_tx)
            for tx in res_tx.all():
                ref_id = f"bal_deduct_{tx.id}"
                stmt_earn = select(Earning).where(Earning.reference_id == ref_id)
                if not (await session.exec(stmt_earn)).first():
                    deduct = -float(tx.amount)
                    if abs(usdt_diff) >= abs(deduct):
                        print(f"    Adding Missing Balance Deduction: TX {tx.id} ({deduct})")
                        session.add(Earning(
                            partner_id=partner.id, amount=deduct, type="PAYMENT",
                            description=f"Subscription Payment (Reconciled)",
                            reference_id=ref_id, currency="USDT"
                        ))
                        usdt_diff -= deduct
                    else:
                        break
        
        # Catch-all adjustment
        if abs(usdt_diff) > 0.01:
            print(f"    Adding catch-all USDT adjustment: {usdt_diff}")
            session.add(Earning(
                partner_id=partner.id, amount=usdt_diff, type="RECONCILIATION_ADJUSTMENT",
                description="Manual Ledger Alignment",
                reference_id=f"reconcile_usdt_{partner.id}_{int(asyncio.get_event_loop().time())}",
                currency="USDT"
            ))

    await session.commit()
    print(f"Done reconciling {partner.telegram_id}.\n")

async def main():
    async for session in get_session():
        # Reconcile all partners found by our verification script
        targets = ["7738038010", "283561463", "300235571", "330295463", "716720099", "5953897266"]
        for tid in targets:
            stmt = select(Partner).where(Partner.telegram_id == tid)
            partner = (await session.exec(stmt)).first()
            if partner:
                await precision_reconcile_partner(session, partner.id)

if __name__ == "__main__":
    asyncio.run(main())

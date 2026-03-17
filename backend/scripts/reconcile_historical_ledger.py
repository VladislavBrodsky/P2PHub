import asyncio
import sys
from datetime import UTC, datetime

from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.config import settings
from app.models.partner import Earning, Partner, XPTransaction, get_session
from app.models.transaction import PartnerTransaction


async def reconcile_partner(session, partner_id: int):
    partner = await session.get(Partner, partner_id)
    if not partner:
        print(f"Partner {partner_id} not found.")
        return

    print(f"Reconciling Partner: {partner.telegram_id} ({partner.username})")

    # 1. Backfill Missing Academy XP
    # Check completed stages and see if XPTransaction exists
    import json
    completed_stages = json.loads(partner.completed_stages or "[]")
    for stage_id in completed_stages:
        ref_id = f"acad_comp_{stage_id}_{partner.id}"
        stmt = select(XPTransaction).where(XPTransaction.reference_id == ref_id)
        res = await session.exec(stmt)
        if not res.first():
            print(f"  [XP] Missing Academy Reward for Stage {stage_id}. Backfilling +500 XP.")
            session.add(XPTransaction(
                partner_id=partner.id,
                amount=500.0,
                type="ACADEMY_REWARD",
                description=f"Academy Stage {stage_id} Completed (Backfill)",
                reference_id=ref_id,
                created_at=partner.created_at # Approximation
            ))

    # 2. Backfill Missing Balance Deductions
    # Check completed transactions with currency=BALANCE
    stmt_tx = select(PartnerTransaction).where(
        PartnerTransaction.partner_id == partner.id,
        PartnerTransaction.currency == "BALANCE",
        PartnerTransaction.status == "completed"
    )
    res_tx = await session.exec(stmt_tx)
    for tx in res_tx.all():
        ref_id = f"bal_deduct_{tx.id}"
        stmt_earn = select(Earning).where(Earning.reference_id == ref_id)
        res_earn = await session.exec(stmt_earn)
        if not res_earn.first():
            print(f"  [USDT] Missing Balance Deduction Log for TX {tx.id}. Backfilling -{tx.amount} USDT.")
            session.add(Earning(
                partner_id=partner.id,
                amount=-float(tx.amount),
                description="Subscription Payment: BALANCE (Backfill)",
                type="PAYMENT",
                currency="USDT",
                reference_id=ref_id,
                created_at=tx.created_at
            ))

    # 3. Backfill Upgrade XP (if missing)
    if partner.is_pro:
        # Check if any UPGRADE_BONUS exists
        stmt_upg = select(XPTransaction).where(
            XPTransaction.partner_id == partner.id,
            XPTransaction.type == "UPGRADE_BONUS"
        )
        res_upg = await session.exec(stmt_upg)
        if not res_upg.first():
            # Determine amount based on plan
            xp_amount = settings.PRO_UPGRADE_SELF_XP
            if (partner.subscription_plan or "").startswith("PRO_PLUS"):
                xp_amount = settings.PRO_PLUS_UPGRADE_SELF_XP
            
            print(f"  [XP] Missing Upgrade Bonus. Backfilling +{xp_amount} XP.")
            session.add(XPTransaction(
                partner_id=partner.id,
                amount=float(xp_amount),
                type="UPGRADE_BONUS",
                description="Upgrade Reward (Backfill)",
                reference_id=f"upg_bonus_backfill_{partner.id}",
                created_at=partner.pro_started_at or partner.created_at
            ))

    await session.commit()
    print(f"Done reconciling {partner.telegram_id}.\n")

async def main():
    # Targeted list from the alert
    targets = ["716720099", "7738038010", "5953897266"]
    
    async for session in get_session():
        for tid in targets:
            stmt = select(Partner).where(Partner.telegram_id == tid)
            res = await session.exec(stmt)
            partner = res.first()
            if partner:
                await reconcile_partner(session, partner.id)
            else:
                print(f"Target partner {tid} not found in DB.")

if __name__ == "__main__":
    from app.core.config import settings
    # Ensure we are pointing to the right DB
    print("Starting Main Reconciliation...")
    asyncio.run(main())

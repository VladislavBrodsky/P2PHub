import asyncio

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit_log import AuditLog
from app.models.partner import Partner, XPTransaction, engine


async def deep_dive_user():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    # Using partner_id=283 (which corresponds to TG 330295463)
    p_id = 283
    
    async with async_session() as session:
        print(f"--- DEEP DIVE: Partner {p_id} (TG 330295463) ---")
        
        partner = await session.get(Partner, p_id)
        if not partner:
            print("❌ Partner not found.")
            return

        print(f"Current Partner Record: XP={partner.xp}, Level={partner.level}")
        
        # 1. Check XPTransaction history
        tx_stmt = select(XPTransaction).where(XPTransaction.partner_id == p_id).order_by(XPTransaction.created_at)
        txs = (await session.execute(tx_stmt)).scalars().all()
        tx_sum = sum(t.amount for t in txs)
        print(f"\n[XPTransaction] Count: {len(txs)}, Total Sum: {tx_sum}")
        for t in txs[-5:]:
            print(f"  - {t.created_at}: {t.type} +{t.amount} ({t.description})")

        # 2. Check AuditLog for anything XP related
        audit_stmt = select(AuditLog).where(AuditLog.partner_id == p_id).order_by(AuditLog.created_at)
        logs = (await session.execute(audit_stmt)).scalars().all()
        print(f"\n[AuditLog] Total entries: {len(logs)}")
        xp_related_logs = [l for l in logs if "XP" in (l.description or "") or "xp" in (l.description or "")]
        print(f"XP-related logs: {len(xp_related_logs)}")
        for l in xp_related_logs:
            print(f"  - {l.created_at}: {l.action} -> {l.description}")
            if l.details:
                print(f"    Details: {l.details}")

if __name__ == "__main__":
    asyncio.run(deep_dive_user())

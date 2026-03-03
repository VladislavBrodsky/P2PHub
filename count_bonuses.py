
import asyncio
from sqlmodel import select, func
from app.models.partner import Partner, XPTransaction, get_session

async def analyze_bonus_tx():
    async for session in get_session():
        # Get user
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        result = await session.exec(stmt)
        user = result.first()
        if not user:
            print("User not found")
            return

        print(f"User: {user.username} (ID: {user.id})")
        print(f"Current XP: {user.xp}")

        # Count BONUS transactions
        stmt = select(XPTransaction).where(
            XPTransaction.partner_id == user.id,
            XPTransaction.type == "BONUS"
        )
        result = await session.exec(stmt)
        bonuses = result.all()
        
        print(f"Total BONUS transactions: {len(bonuses)}")
        
        # Analyze descriptions
        desc_counts = {}
        for tx in bonuses:
            desc_counts[tx.description] = desc_counts.get(tx.description, 0) + 1
            
        print("\nDescription counts:")
        for desc, count in sorted(desc_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
            print(f"  {count}x: {desc}")
            
        # Sum of BONUS XP
        total_bonus_xp = sum(tx.amount for tx in bonuses)
        print(f"\nTotal BONUS XP: {total_bonus_xp}")

if __name__ == "__main__":
    asyncio.run(analyze_bonus_tx())

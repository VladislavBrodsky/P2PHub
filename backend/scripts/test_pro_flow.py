import sys
import os
import asyncio
import json
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.partner import Partner, Earning, get_session
from app.services.payment_service import payment_service
from sqlmodel import select, text

async def test_pro_upgrade():
    print("🚀 Starting PRO Upgrade Test...")
    
    async for session in get_session():
        # 1. Select a test user (or create a dummy one)
        stmt = select(Partner).limit(1)
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            print("❌ No users found in DB for testing.")
            return

        print(f"👤 Testing with User: {user.telegram_id} (ID: {user.id})")
        
        # Reset PRO status for testing
        user.is_pro = False
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        # 2. Simulate successful TON verification
        # We manually call upgrade_to_pro since hitting the real TON API with a mock hash 
        # would require a real on-chain TX.
        print("💡 Simulating upgrade...")
        await payment_service.upgrade_to_pro(
            session=session,
            partner=user,
            tx_hash=f"TEST_TX_{datetime.now().timestamp()}",
            currency="TON",
            network="TON",
            amount=39.0
        )
        
        # 3. Verify User Update
        await session.refresh(user)
        print(f"✅ is_pro: {user.is_pro}")
        print(f"✅ sub_plan: {user.subscription_plan}")
        
        # 4. Verify Commissions
        # Fetch earnings for this user's ancestors
        stmt_earn = select(Earning).where(Earning.type == "PRO_COMMISSION").order_by(Earning.created_at.desc()).limit(9)
        res_earn = await session.exec(stmt_earn)
        earnings = res_earn.all()
        
        print(f"💰 Commissions distributed: {len(earnings)} levels")
        for e in earnings:
            print(f"   - Level {e.level}: {e.amount} {e.currency}")
            
        print("\n🎉 Test Complete!")
        break

if __name__ == "__main__":
    asyncio.run(test_pro_upgrade())

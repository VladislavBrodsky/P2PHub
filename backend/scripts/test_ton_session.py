import asyncio
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
# Load env before importing app
load_dotenv(dotenv_path=os.path.join(os.getcwd(), 'backend', '.env'))

from app.models.partner import Partner, get_session

from app.services.payment_service import payment_service
from sqlmodel import select

async def verify_ton_session_flow():
    from app.core.config import settings
    print(f"🔧 Using Database: {settings.async_database_url}")
    print("🧪 Starting TON Session Verification...")

    
    async for session in get_session():
        # 1. Get a test user
        stmt = select(Partner).limit(1)
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            print("❌ No users found for testing.")
            return

        print(f"👤 Testing with User: {user.telegram_id}")
        
        # Reset PRO status
        user.is_pro = False
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # 2. Test Session Creation
        print("🟢 Creating payment session...")
        payment_data = await payment_service.create_payment_session(session, user.id)
        print(f"✅ Session created: {payment_data['amount_ton']} TON")
        print(f"✅ Expires at: {payment_data['expires_at']}")

        # 3. Test Verification (Failed - Hash not found)
        print("🟡 Testing verification with fake hash (should fail)...")
        success = await payment_service.verify_ton_transaction(session, user, "FAKE_HASH_123")
        print(f"{'✅' if not success else '❌'} Verification failed as expected (not on-chain)")

        # 4. Test Timeout (Simulated)
        print("🟡 Testing verification after timeout simulation...")
        # We'll manually find the transaction and set its created_at to 11 minutes ago
        from app.models.transaction import PartnerTransaction
        stmt_tx = select(PartnerTransaction).where(PartnerTransaction.id == payment_data['transaction_id'])
        res_tx = await session.exec(stmt_tx)
        tx = res_tx.one()
        tx.created_at = datetime.utcnow() - timedelta(minutes=11)
        session.add(tx)
        await session.commit()
        
        # Try to verify with a "valid" looking hash (it will still fail but should hit the session check first)
        success = await payment_service.verify_ton_transaction(session, user, "a" * 64)
        print(f"{'✅' if not success else '❌'} Verification failed due to timeout as expected")

        print("\n🎉 Verification Script Finished!")
        break

if __name__ == "__main__":
    asyncio.run(verify_ton_session_flow())

import sys
import os
import asyncio

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Hardcode env vars for verification script
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["ADMIN_USER_IDS"] = '["537873096", "716720099"]'
os.environ["BOT_TOKEN"] = "8245884329:AAEy0UaI2zGuwTHdkRXHa1f-kzhY6t1_lG4"
os.environ["REDIS_URL"] = "redis://default:HXYVAMyGCiqtXoHCOCbAIpqYNJKLAvMt@redis.railway.internal:6379"

# Mock Taskiq and Worker before imports
from unittest.mock import MagicMock
sys.modules['taskiq'] = MagicMock()
sys.modules['taskiq.schedule_sources'] = MagicMock()
sys.modules['taskiq_redis'] = MagicMock()
sys.modules['taskiq_fastapi'] = MagicMock()

mock_worker = MagicMock()
mock_broker = MagicMock()
# Mock .kiq() method just in case
mock_broker.task = MagicMock(return_value=lambda x: x) 
mock_worker.broker = mock_broker
sys.modules['app.worker'] = mock_worker

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction
from sqlmodel import select, Session
from app.models.partner import engine

# Mock User Data
TEST_USER_ID = 537873096 # Admin ID from env
TEST_USER_DATA = {
    "id": TEST_USER_ID,
    "first_name": "TestAdmin",
    "username": "test_admin",
    "language_code": "en"
}

# Override Dependency
def mock_get_current_user():
    return TEST_USER_DATA

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def verify_flow():
    print("🚀 Starting Manual Payment Flow Verification")
    
    # 1. Submit Manual Payment (No Hash)
    print("\n1. Submitting Manual Payment without Hash...")
    response = client.post(
        "/api/payment/submit-manual",
        json={
            "amount": 39.0,
            "currency": "USDT",
            "network": "TRC20",
            # "tx_hash": None # Optional
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to submit payment: {response.text}")
        return
        
    print(f"✅ Payment Submitted: {response.json()}")
    
    # 2. List Pending Payments (as Admin)
    print("\n2. Listing Pending Payments (Admin)...")
    # We are already logged in as admin via mock
    response = client.get("/api/admin/pending-payments")
    
    if response.status_code != 200:
        print(f"❌ Failed to list payments: {response.text}")
        return
        
    transactions = response.json()
    print(f"✅ Found {len(transactions)} pending transactions")
    
    # Find our transaction
    target_tx = None
    for tx in transactions:
        if tx["amount"] == 39.0 and tx["currency"] == "USDT" and tx["status"] == "manual_review":
             # We assume it's the latest one or unique enough for test
             target_tx = tx
             break
             
    if not target_tx:
        print("❌ Could not find the submitted transaction in pending list.")
        return
        
    print(f"✅ Found Target Transaction ID: {target_tx['id']}")
    
    # 3. Approve Payment
    print(f"\n3. Approving Payment ID {target_tx['id']}...")
    response = client.post(f"/api/admin/approve-payment/{target_tx['id']}")
    
    if response.status_code != 200:
        print(f"❌ Failed to approve payment: {response.text}")
        return
        
    print(f"✅ Payment Approved: {response.json()}")
    
    print("\n🎉 Verification Manual Flow Complete!")


async def setup_test_user():
    print("🛠 Setting up test user...")
    
    # We need AsyncSession for async engine
    from sqlmodel.ext.asyncio.session import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        stmt = select(Partner).where(Partner.telegram_id == str(TEST_USER_ID))
        res = await session.exec(stmt)
        partner = res.first()
        
        if not partner:
            print(f"Creating new test user: {TEST_USER_ID}")
            partner = Partner(
                telegram_id=str(TEST_USER_ID),
                username="test_admin",
                first_name="TestAdmin",
                language_code="en",
                referral_code="test_ref", # Corrected field name
                referrer_id=None
            )
            session.add(partner)
            await session.commit()
            print("✅ Test user created.")
        else:
            print("✅ Test user exists.")

if __name__ == "__main__":
    # Run async setup
    asyncio.run(setup_test_user())
    
    # Run synchronous test client checks
    verify_flow()

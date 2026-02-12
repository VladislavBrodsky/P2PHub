import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.admin_service import admin_service


async def test_broadcast():
    print("--- P2PHub Admin Broadcast Test ---")
    print("Target: All active partners")

    try:
        # We'll use a standard announcement
        message = "💎 Pintopay Platinum Hub: Your network is expanding! Level up to unlock higher USDT velocity."

        result = await admin_service.broadcast_message(text=message)

        print("\n✅ Broadcast enqueued successfully!")
        print(f"📊 Partners reached: {result['count']}")
        print(f"⚡ Status: {result['status']}")

    except Exception as e:
        print(f"\n❌ Error during broadcast: {e}")

if __name__ == "__main__":
    asyncio.run(test_broadcast())

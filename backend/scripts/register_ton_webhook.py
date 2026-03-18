import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
"""
Register TonAPI Webhook
========================
One-time setup script to register our backend as the TonAPI webhook listener.
Run this after deploying the backend to make TonAPI start pushing payment events.

Usage:
    cd backend
    python -m scripts.register_ton_webhook
"""
import asyncio
import os
import sys

import httpx

# Bootstrap settings from .env
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings  # noqa: E402

WEBHOOK_URL = f"{settings.FRONTEND_URL.replace('frontend', 'production')}/api/webhooks/ton"
# More accurately, pull the backend URL from settings:
BACKEND_URL = "https://p2phub-production.up.railway.app"
TON_WEBHOOK_URL = f"{BACKEND_URL}/api/webhooks/ton"


async def register_webhook():
    if not settings.TON_API_KEY:
        print("❌ TON_API_KEY is not set in environment. Aborting.")
        sys.exit(1)

    wallet_address = settings.ADMIN_TON_ADDRESS
    print(f"🔧 Registering TonAPI webhook for wallet: {wallet_address}")
    print(f"📡 Webhook target URL: {TON_WEBHOOK_URL}")

    headers = {
        "Authorization": f"Bearer {settings.TON_API_KEY}",
        "Content-Type": "application/json",
    }

    # TonAPI v2 account subscription (sends events when any tx hits this address)
    subscribe_url = f"https://tonapi.io/v2/accounts/{wallet_address}/events/subscribe"

    payload = {
        "url": TON_WEBHOOK_URL,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(subscribe_url, json=payload, headers=headers)

        if resp.status_code in (200, 201):
            data = resp.json()
            print("✅ Webhook registered successfully!")
            print(f"   Response: {data}")
        elif resp.status_code == 409:
            print("ℹ️  Webhook already registered (409 Conflict). No action needed.")
        else:
            print(f"❌ Failed to register webhook: HTTP {resp.status_code}")
            print(f"   Body: {resp.text}")
            sys.exit(1)

    # Verify registration
    print("\n🔍 Verifying webhook registration...")
    verify_url = f"https://tonapi.io/v2/accounts/{wallet_address}/events/subscriptions"
    check = await client.get(verify_url, headers=headers)
    if check.status_code == 200:
        subs = check.json()
        print(f"   Active subscriptions: {subs}")
    else:
        print(f"   Could not verify: HTTP {check.status_code}")


if __name__ == "__main__":
    asyncio.run(register_webhook())

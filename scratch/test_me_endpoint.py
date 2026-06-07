import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.api.endpoints.auth import generate_signed_init_data

def test_endpoint():
    print("ADMIN_USER_IDS config:", settings.ADMIN_USER_IDS)
    
    # Generate valid signed initData for uslincoln (716720099)
    # def generate_signed_init_data(telegram_id: int, first_name: str, last_name: str | None, username: str | None, photo_url: str | None)
    init_data = generate_signed_init_data(
        telegram_id=716720099,
        first_name="Grand Maestro",
        last_name=None,
        username="uslincoln",
        photo_url=None
    )
    
    client = TestClient(app)
    headers = {
        "X-Telegram-Init-Data": init_data
    }
    
    response = client.get("/api/partner/me", headers=headers)
    print("Response status code:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print("is_admin in response:", data.get("is_admin"))
        print("username in response:", data.get("username"))
        print("telegram_id in response:", data.get("telegram_id"))
    else:
        print("Response body:", response.text)

if __name__ == "__main__":
    test_endpoint()

import sys
import os
import requests

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.api.endpoints.auth import generate_signed_init_data

def main():
    init_data = generate_signed_init_data(
        telegram_id=716720099,
        first_name="Lincoln",
        last_name=None,
        username="uslincoln",
        photo_url=None
    )
    
    headers = {
        "X-Telegram-Init-Data": init_data,
        "Authorization": f"Bearer {init_data}"
    }
    
    endpoints = [
        "/api/admin/stats",
        "/api/admin/pending-payments",
        "/api/admin/health"
    ]
    
    for endpoint in endpoints:
        print(f"\n--- Testing {endpoint} ---")
        url = f"https://api.pintopay.life{endpoint}"
        try:
            r = requests.get(url, headers=headers, timeout=10)
            print("Status:", r.status_code)
            print("Body snippet:", r.text[:200])
        except Exception as e:
            print("Request failed:", e)

if __name__ == "__main__":
    main()

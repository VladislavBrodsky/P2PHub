import sys
import os
import requests

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.api.endpoints.auth import generate_signed_init_data
from app.core.config import settings

def main():
    print("ADMIN_USER_IDS in settings:", settings.ADMIN_USER_IDS)
    
    # Generate signed init data for uslincoln
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
    
    print("\n--- Testing /api/partner/me ---")
    url_me = "https://api.pintopay.life/api/partner/me"
    r_me = requests.get(url_me, headers=headers)
    print("Status:", r_me.status_code)
    try:
        data = r_me.json()
        print("username:", data.get("username"))
        print("is_admin:", data.get("is_admin"))
        print("subscription_plan:", data.get("subscription_plan"))
    except Exception as e:
        print("Error parsing response:", e)
        print("Body:", r_me.text)
        
    print("\n--- Testing /api/admin/stats ---")
    url_stats = "https://api.pintopay.life/api/admin/stats"
    r_stats = requests.get(url_stats, headers=headers)
    print("Status:", r_stats.status_code)
    try:
        print("Body:", r_stats.text[:300])
    except Exception as e:
        print("Error printing:", e)

if __name__ == "__main__":
    main()

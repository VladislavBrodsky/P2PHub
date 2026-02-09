from fastapi.testclient import TestClient
import hmac
import hashlib
import time
from urllib.parse import urlencode
import sys
import os

# Ensure backend is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.config import settings

client = TestClient(app)

def generate_valid_init_data(user_id=12345):
    user_data = f'{{"id":{user_id},"first_name":"Test","last_name":"User","username":"testuser"}}'
    auth_date = int(time.time())
    data = {
        "auth_date": auth_date,
        "query_id": "AAH9S_0UAAAAAH1L_RQ",
        "user": user_data
    }
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    hash_str = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    data["hash"] = hash_str
    return urlencode(data)

def test_api_security():
    print("🧪 Running API Integration Security Tests...")
    
    # 1. Test Without Header
    response = client.get("/api/partner/me")
    assert response.status_code == 422 # Missing header
    print("✅ Passed: Blocked request without header.")

    # 2. Test With Invalid Signature
    bad_init_data = generate_valid_init_data() + "invalid"
    response = client.get("/api/partner/me", headers={"X-Telegram-Init-Data": bad_init_data})
    assert response.status_code == 401
    print("✅ Passed: Blocked request with invalid signature.")

    # 3. Test Task Claim Validation (Negative Reward)
    init_data = generate_valid_init_data()
    # Note: This might fail if the user doesn't exist in DB during TestClient run if using real DB,
    # but the validation usually happens BEFORE the DB query in the schema parsing.
    response = client.post(
        "/api/partner/tasks/test-task/claim",
        headers={"X-Telegram-Init-Data": init_data},
        json={"xp_reward": -10}
    )
    assert response.status_code == 422 # Pydantic validation error (xp_reward > 0)
    print("✅ Passed: Blocked invalid schema (negative reward).")

    print("\n🎉 All Phase 1 Security Integration Tests Passed!")

if __name__ == "__main__":
    test_api_security()

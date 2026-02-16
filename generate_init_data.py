
import hmac
import hashlib
import json
import time
from urllib.parse import urlencode

def generate_init_data(user_id, first_name, username, token):
    user_data = {
        "id": user_id,
        "first_name": first_name,
        "username": username,
        "language_code": "en",
        "allows_write_to_pm": True
    }
    
    auth_date = int(time.time())
    data = {
        "user": json.dumps(user_data, separators=(',', ':')),
        "auth_date": str(auth_date),
        "query_id": "AAI9Y8MUAAAAAD1jwxS6HJtg",
        "chat_type": "sender",
        "chat_instance": "8245884329633034160"
    }
    
    # Sort data
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    
    # Generate hash
    secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    hash_str = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    data["hash"] = hash_str
    return urlencode(data)

if __name__ == "__main__":
    token = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    init_data = generate_init_data(999999999, "Anti", "antigravity_test", token)
    print(init_data)

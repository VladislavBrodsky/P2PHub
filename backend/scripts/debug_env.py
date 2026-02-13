import os
from dotenv import load_dotenv

env_path = "/Users/grandmaestro/Documents/P2PHub/backend/.env"
print(f"Loading env from: {env_path}")
load_dotenv(env_path, override=True)

keys = list(os.environ.keys())
print(f"Loaded {len(keys)} environment variables.")

if "GOOGLE_SERVICE_ACCOUNT_JSON" in os.environ:
    print("✅ GOOGLE_SERVICE_ACCOUNT_JSON is present.")
    val = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]
    print(f"First 20 chars: {val[:20]}")
    print(f"Last 20 chars: {val[-20:]}")
else:
    print("❌ GOOGLE_SERVICE_ACCOUNT_JSON is MISSING.")
    
# Print raw file lookup
print("-" * 20)
try:
    with open(env_path, 'r') as f:
        for line in f:
            if line.startswith("GOOGLE_SERVICE_ACCOUNT_JSON"):
                print(f"Found line in file: {line[:50]}...")
except Exception as e:
    print(f"Error reading file: {e}")

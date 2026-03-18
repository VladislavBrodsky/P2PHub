import os
import sys

# Change to the backend directory
os.chdir('/Users/grandmaestro/Developer/P2PHub/backend')
sys.path.insert(0, '/Users/grandmaestro/Developer/P2PHub/backend')

from app.core.config import settings

print("RAW ENV VALUE:")
print(repr(settings.GOOGLE_SERVICE_ACCOUNT_JSON[:50] + "..."))

try:
    import json
    parsed = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    key = parsed.get("private_key", "")
    print("PARSED KEY PRE-REPLACE:")
    print(repr(key[:50] + "..."))
    
    key_replaced = key.replace("\\n", "\n")
    print("PARSED KEY POST-REPLACE:")
    print(repr(key_replaced[:50] + "..."))

    from google.oauth2.service_account import Credentials
    creds_dict = parsed
    creds_dict["private_key"] = key_replaced
    
    scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    print("SUCCESSFULLY LOADED CREDS!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("ERROR:", e)

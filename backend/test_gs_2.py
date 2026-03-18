import os
import sys

os.chdir('/Users/grandmaestro/Developer/P2PHub/backend')
sys.path.insert(0, '/Users/grandmaestro/Developer/P2PHub/backend')

from app.core.config import settings

try:
    import json
    parsed = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    key = parsed.get("private_key", "")
    
    print("KEY TYPE:", type(key))
    print("KEY LENGTH:", len(key))
    print("FIRST 100 CHARS OF KEY REPR:")
    print(repr(key[:100]))
    
    # Are there literal backshlash + n ?
    if '\\n' in key:
        print("KEY HAS LITERAL BACKSLASH-N")
    if '\n' in key:
        print("KEY HAS ACTUAL NEWLINES")
        
    print("-- BYTES CHECK --")
    print(key[:100].encode('utf-8'))
    
except Exception as e:
    import traceback
    traceback.print_exc()

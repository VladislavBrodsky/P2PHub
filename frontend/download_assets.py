
import os
import requests
import base64

# Base URLs
AVATAR_BASE_URL = "https://p2phub-frontend-production.up.railway.app/images/avatars/"
LOGO_URL = "https://p2phub-frontend-production.up.railway.app/logo.webp"

# Target TS File
OUTPUT_TS_FILE = "/Users/grandmaestro/Documents/P2PHub/frontend/src/data/avatars.ts"

avatars = [
    'ae_f_1.webp', 'br_f_1.webp', 'ca_m_1.webp', 'de_m_1.webp', 'es_m_1.webp',
    'f1.webp', 'f2.webp', 'f3.webp', 'fr_f_1.webp', 'in_m_1.webp',
    'it_f_1.webp', 'jp_f_1.webp', 'm1.webp', 'm2.webp', 'm3.webp', 'm4.webp',
    'ng_m_1.webp', 'ru_m_1.webp', 'us_f_1.webp', 'us_m_1.webp'
]

ts_content = ["// Auto-generated Base64 Assets"]
ts_content.append("export const AVATAR_DATA: Record<string, string> = {")

# Process Avatars
for avatar_name in avatars:
    url = AVATAR_BASE_URL + avatar_name
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
             # Fallback
             fallback = "https://p2phub-frontend-production.up.railway.app/" + avatar_name
             response = requests.get(fallback, timeout=10)
        
        if response.status_code == 200:
            b64 = base64.b64encode(response.content).decode('utf-8')
            ts_content.append(f'    "{avatar_name}": "data:image/webp;base64,{b64}",')
            print(f"Encoded {avatar_name}")
        else:
            print(f"Failed {avatar_name}")
    except Exception as e:
        print(f"Error {avatar_name}: {e}")

ts_content.append("};")

# Process Logo
try:
    r = requests.get(LOGO_URL, timeout=10)
    if r.status_code == 200:
        b64 = base64.b64encode(r.content).decode('utf-8')
        ts_content.append(f'\nexport const LOGO_DATA = "data:image/webp;base64,{b64}";')
        print("Encoded Logo")
    else:
        print("Failed Logo")
except Exception as e:
    print(f"Error Logo: {e}")

# Write TS File
with open(OUTPUT_TS_FILE, 'w') as f:
    f.write("\n".join(ts_content))

print(f"Generated {OUTPUT_TS_FILE}")

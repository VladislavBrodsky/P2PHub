
import requests

LOGO_URL = "https://p2phub-frontend-production.up.railway.app/logo.webp"
LOGO_PATH = "/Users/grandmaestro/Documents/P2PHub/frontend/public/logo.webp"

try:
    r = requests.get(LOGO_URL, timeout=10)
    if r.status_code == 200:
        with open(LOGO_PATH, 'wb') as f:
            f.write(r.content)
        print("Downloaded logo.webp to public")
    else:
        print(f"Failed logo: {r.status_code}")
except Exception as e:
    print(f"Error logo: {e}")

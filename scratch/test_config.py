import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

# Load dotenv to simulate exactly how it runs
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from app.core.config import settings
print(f"Parsed ADMIN_USER_IDS: {settings.ADMIN_USER_IDS}")
print(f"Type of ADMIN_USER_IDS: {type(settings.ADMIN_USER_IDS)}")
for i, val in enumerate(settings.ADMIN_USER_IDS):
    print(f"  Item {i}: {repr(val)}")

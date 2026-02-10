import os
from pathlib import Path
from dotenv import load_dotenv

env_paths = [
    Path(".env"),
    Path("backend/.env"),
    Path("../backend/.env"),
]

for p in env_paths:
    print(f"Checking {p.absolute()}: {p.exists()}")

from app.core.config import settings
print(f"Current DATABASE_URL from settings: {settings.DATABASE_URL}")
print(f"DATABASE_URL from os.environ: {os.environ.get('DATABASE_URL')}")

import sys
import os

print(f"Python Version: {sys.version}")
print(f"Prefix: {sys.prefix}")
print(f"Executable: {sys.executable}")

try:
    import fastapi
    print(f"FastAPI Version: {fastapi.__version__}")
except ImportError:
    print("FastAPI NOT FOUND")

try:
    import sqlmodel
    print("SQLModel FOUND")
except ImportError:
    print("SQLModel NOT FOUND")

try:
    import aiogram
    print("Aiogram FOUND")
except ImportError:
    print("Aiogram NOT FOUND")

print("Sys Path:")
for p in sys.path:
    print(f"  - {p}")

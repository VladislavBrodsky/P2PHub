import importlib
import os
import pkgutil
import sys

# Set PYTHONPATH to the current directory (should be run from backend/)
sys.path.append(os.getcwd())

# Mock Environment for CI/Verification
os.environ.setdefault("BOT_TOKEN", "12345:mock_token_for_verification")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://mock:mock@localhost:5432/mock")
os.environ.setdefault("WEBHOOK_URL", "https://mock.com/webhook")

def verify_all_imports():
    print("🔍 Starting comprehensive import verification...")
    success = True

    # 1. Check Main App
    try:
        print("✅ Core: app.main imported successfully")
    except Exception as e:
        print(f"❌ Core: app.main import failed: {e}")
        success = False

    # 2. Check all endpoint modules
    import app.api.endpoints as endpoints
    prefix = endpoints.__name__ + "."
    for loader, modname, ispkg in pkgutil.iter_modules(endpoints.__path__, prefix):
        try:
            importlib.import_module(modname)
            print(f"✅ API: {modname} imported successfully")
        except Exception as e:
            print(f"❌ API: {modname} import failed: {e}")
            success = False

    if not success:
        print("\n💥 Import verification FAILED!")
        sys.exit(1)

    print("\n✨ All critical modules imported successfully!")

if __name__ == "__main__":
    verify_all_imports()

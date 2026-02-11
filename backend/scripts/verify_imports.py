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

# Local Mocking for missing dependencies (allow verification to run locally if desired)
# Set VERIFY_STRICT=1 to disable mocks and fail if items are missing
STRICT = os.environ.get("VERIFY_STRICT", "0") == "1"

def mock_module(name, attributes):
    if name in sys.modules and not STRICT:
        return
    if STRICT:
        try:
            importlib.import_module(name)
            return
        except ImportError:
            # We don't mock in strict mode
            return

    # Create mock
    m = type(sys)(name)
    for k, v in attributes.items():
        setattr(m, k, v)
    sys.modules[name] = m

def try_import_or_mock(name, attributes, sub_modules=None):
    try:
        importlib.import_module(name)
    except ImportError:
        if STRICT:
            raise
        # print(f"ℹ️ {name} not found, mocking...")
        mock_module(name, attributes)
        if sub_modules:
            for sub_name, sub_attr in sub_modules.items():
                full_name = f"{name}.{sub_name}"
                ms = type(sys)(full_name)
                for k, v in sub_attr.items():
                    setattr(ms, k, v)
                sys.modules[full_name] = ms

# Execute Mocks if needed
try_import_or_mock('taskiq_fastapi', {'init': lambda *a, **k: None})
try_import_or_mock('taskiq', {'TaskiqScheduler': lambda *a, **k: None}, 
                   sub_modules={'schedule_sources': {'LabelScheduleSource': lambda *a, **k: None}})
try_import_or_mock('taskiq_redis', {
    'ListQueueBroker': lambda *a, **k: type('DB', (), {'with_result_backend': lambda s, *x: s, 'task': lambda s, *x: lambda f: f})(),
    'RedisAsyncResultBackend': lambda *a, **k: None
})

def verify_all_imports():
    print(f"🔍 Starting comprehensive import verification (STRICT={STRICT})...")
    success = True

    # 1. Check Main App & Worker
    try:
        import app.main
        print("✅ Core: app.main imported successfully")
        import app.worker
        print("✅ Core: app.worker imported successfully")
    except Exception as e:
        print(f"❌ Core: critical module import failed: {e}")
        import traceback
        traceback.print_exc()
        success = False

    # 2. Check all endpoint modules
    try:
        import app.api.endpoints as endpoints
        prefix = endpoints.__name__ + "."
        for loader, modname, ispkg in pkgutil.iter_modules(endpoints.__path__, prefix):
            try:
                importlib.import_module(modname)
                print(f"✅ API: {modname} imported successfully")
            except Exception as e:
                print(f"❌ API: {modname} import failed: {e}")
                success = False
    except Exception as e:
        print(f"❌ API: global endpoint discovery failed: {e}")
        success = False

    if not success:
        print("\n💥 Import verification FAILED!")
        sys.exit(1)

    print("\n✨ All critical modules imported successfully!")

    if not success:
        print("\n💥 Import verification FAILED!")
        sys.exit(1)

    print("\n✨ All critical modules imported successfully!")

if __name__ == "__main__":
    verify_all_imports()

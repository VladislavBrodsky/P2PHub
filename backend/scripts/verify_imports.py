import sys
import os

# Set PYTHONPATH to the backend directory
sys.path.append(os.path.abspath("backend"))

try:
    from app.main import app
    print("Successfully imported FastAPI app!")
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

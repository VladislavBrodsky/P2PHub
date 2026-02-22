
import sys
import os

# Set PYTHONPATH to current directory
sys.path.append(os.getcwd())

try:
    from app.worker import scheduler
    from taskiq import TaskiqScheduler
    print(f"Scheduler object: {scheduler}")
    print(f"Type: {type(scheduler)}")
    print(f"Is instance of TaskiqScheduler: {isinstance(scheduler, TaskiqScheduler)}")
except Exception as e:
    print(f"Error: {e}")

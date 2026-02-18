#!/bin/bash
# Start the TaskIQ worker for P2PHub
echo "🚀 Starting P2PHub TaskIQ Worker..."
export PYTHONPATH=$PYTHONPATH:.
# --tasks-pattern is a safety net: discovers all @broker.task decorated functions
# The explicit imports in app/worker.py are the primary registration mechanism
taskiq worker app.worker:broker \
  --tasks-pattern "app/services/*.py"

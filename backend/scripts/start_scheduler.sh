#!/bin/bash
# Start the TaskIQ scheduler for P2PHub
echo "⏰ Starting P2PHub TaskIQ Scheduler..."
export PYTHONPATH=$PYTHONPATH:.
python3 -m taskiq scheduler app.worker:scheduler

#!/bin/bash
# Start the TaskIQ scheduler for P2PHub
echo "⏰ Starting P2PHub TaskIQ Scheduler..."
export PYTHONPATH=$PYTHONPATH:.
taskiq scheduler app.worker:broker app.worker:scheduler

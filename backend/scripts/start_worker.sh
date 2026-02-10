#!/bin/bash
# Start the TaskIQ worker for P2PHub
echo "🚀 Starting P2PHub TaskIQ Worker..."
export PYTHONPATH=$PYTHONPATH:.
taskiq worker app.worker:broker

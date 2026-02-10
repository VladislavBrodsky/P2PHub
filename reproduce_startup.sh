#!/bin/bash
export PORT=8080
export DATABASE_URL="sqlite+aiosqlite:///dev.db"
export BOT_TOKEN="mock_token"
export FRONTEND_URL="http://localhost:3000"
export PAYMENT_SERVICE_MODE="manual"
export DEBUG=True
export PYTHONUNBUFFERED=1

cd backend

# Try to activate venv if it exists
if [ -d "venv" ]; then
    echo "Using venv..."
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo "Using ../venv..."
    source ../venv/bin/activate
fi

# Ensure dependencies are installed (in case they are missing locally)
pip install taskiq-fastapi taskiq-redis taskiq || echo "Warning: pip install failed"

echo "🚀 Simulating Startup..."
./start.sh &
PID=$!

echo "⏳ Waiting for startup..."
sleep 10

echo "🔍 Checking Health..."
curl -v http://localhost:8080/health/ping
CURL_EXIT=$?

if [ $CURL_EXIT -eq 0 ]; then
    echo "✅ Health Check Passed!"
else
    echo "❌ Health Check Failed!"
fi

echo "🛑 Stopping process..."
kill $PID

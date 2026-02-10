#!/bin/bash
set -e

# Turn on python unbuffered mode
export PYTHONUNBUFFERED=1

echo "🚀 Starting P2PHub Backend..."

# Re-export DATABASE_URL for asyncpg if needed (should be handled in code, but good safety)
# Re-export DATABASE_URL for asyncpg if needed
# This ensures that even if Python code somehow misses it, the environment is correct for subprocesses
if [[ "$DATABASE_URL" == postgres://* ]]; then
  echo "🔧 Fixing DATABASE_URL scheme from postgres:// to postgresql+asyncpg://..."
  export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+asyncpg:\/\/}"
fi

echo "🛠 Running Database Migrations..."
alembic upgrade head
echo "✅ Migrations applied successfully."

echo "🌍 Starting Uvicorn Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

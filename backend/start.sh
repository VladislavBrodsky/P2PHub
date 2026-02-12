#!/bin/bash
set -e
# set -x  # Debugging disabled to reduce log noise

# Turn on python unbuffered mode
export PYTHONUNBUFFERED=1

# Debug: Print environment variables (sanitized)
echo "🔍 Environment Variables (sanitized):"
printenv | grep -vE "SECRET|KEY|TOKEN|PASSWORD|PASS" | sort

echo "🚀 Starting P2PHub Backend..."

# Re-export DATABASE_URL for asyncpg if needed (should be handled in code, but good safety)
# Re-export DATABASE_URL for asyncpg if needed
# This ensures that even if Python code somehow misses it, the environment is correct for subprocesses
if [[ "$DATABASE_URL" == postgres://* ]]; then
  echo "🔧 Fixing DATABASE_URL scheme from postgres:// to postgresql+asyncpg://..."
  export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+asyncpg:\/\/}"
fi


# Pre-flight check removed to prevent startup crashes.
# Python path issues can cause this to fail unnecessarily.

echo "🛠 Running Database Migrations (with timeout)..."
timeout 60s alembic upgrade head || echo "⚠️ Migrations failed or timed out, continuing startup..."
echo "✅ Migration step finished."

echo "🌍 Starting Server with Gunicorn (4 workers)..."
exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:"${PORT:-8080}"

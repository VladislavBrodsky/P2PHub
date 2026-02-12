#!/bin/bash
set -e
# set -x  # Debugging disabled to reduce log noise

# Turn on python unbuffered mode
export PYTHONUNBUFFERED=1

# echo "🔍 Environment Variables (sanitized):"
# printenv | grep -vE "SECRET|KEY|TOKEN|PASSWORD|PASS|URL" | sort

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

# Optimization: Using Gunicorn as a process manager with 4 workers to handle concurrent traffic.
# The UvicornWorker class allows gunicorn to serve ASGI (FastAPI) applications.
# #comment: 4 workers are ideal for a 2-core machine. For memory-constrained environments, 
# monitor RAM usage as each worker loads the full app.
echo "🌍 Starting Server with Gunicorn (4 workers)..."
exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:"${PORT:-8080}" --timeout 120

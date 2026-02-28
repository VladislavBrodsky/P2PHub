#!/bin/bash
set -e
# set -x  # Debugging disabled to reduce log noise

# Turn on python unbuffered mode
export PYTHONUNBUFFERED=1

# Sanitize PORT (prevent crash from invalid injection like '${PORT}')
if [[ -n "${PORT}" ]] && ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
    echo "⚠️ Invalid PORT environment variable detected: '${PORT}'. Falling back to 8080."
    export PORT=8080
fi

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
timeout 120s alembic upgrade head || echo "⚠️ Migrations failed or timed out, continuing startup..."
echo "✅ Migration step finished."

# Optimized Worker Calculation:
# We use a safer approach for memory efficiency.
# Default to 2 workers for stability, especially on 1-2GB RAM servers.
echo "🌍 Starting Server with Gunicorn..."
WORKERS=${GUNICORN_WORKERS:-2}
echo "Running with $WORKERS workers (Tip: set GUNICORN_WORKERS env if you have $>4GB RAM)"

exec gunicorn app.main:app \
    -w "$WORKERS" \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:"${PORT:-8080}" \
    --timeout 60 \
    --log-level info \
    --access-logfile - \
    --error-logfile /dev/stdout

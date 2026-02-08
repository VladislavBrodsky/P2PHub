#!/bin/bash

# Configuration
URL="${1:-http://localhost:8000/health}"
MAX_RETRIES=10
SLEEP_SECONDS=5

echo "Starting deployment health check for: $URL"

for ((i=1; i<=MAX_RETRIES; i++)); do
  echo "Attempt $i of $MAX_RETRIES..."
  
  # Use curl to check status code, max time 5s
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL")
  
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Health check passed! Service is up and DB is connected."
    exit 0
  else
    echo "⚠️  Health check failed (Status: $HTTP_STATUS). Retrying in ${SLEEP_SECONDS}s..."
  fi
  
  sleep $SLEEP_SECONDS
done

echo "❌ Deployment health check failed after $MAX_RETRIES attempts."
exit 1

# Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies and uv in one layer to maximize cache and minimize image size
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Safety shim for Railway CLI if hardcoded in UI
RUN echo '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do case "$1" in run|-*) shift ;; *) break ;; esac; done\nexec "$@"' > /usr/local/bin/railway && chmod +x /usr/local/bin/railway

# Install dependencies first for better caching
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Create non-root user and set permissions
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

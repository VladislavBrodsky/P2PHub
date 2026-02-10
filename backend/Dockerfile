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

# Hardened safety shim for Railway CLI
RUN echo '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do case "$1" in run|-*|p2phub-*) shift ;; *) if command -v "$1" >/dev/null 2>&1; then break; else shift; fi ;; esac; done\nif [ "$#" -eq 0 ]; then exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}; fi\nexec "$@"' > /usr/local/bin/railway && chmod +x /usr/local/bin/railway

# Install dependencies first for better caching
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Create non-root user and set permissions
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --chown=appuser:appuser . .

USER appuser

ENV PYTHONUNBUFFERED=1

EXPOSE 8000
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 CMD curl -f http://localhost:${PORT:-8000}/health/ping || exit 1

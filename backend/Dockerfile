# --- Stage 1: Builder ---
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy requirements and install to a virtualenv
COPY requirements.txt .
RUN uv venv /opt/venv && \
    uv pip install --no-cache -r requirements.txt

# --- Stage 2: Runtime ---
FROM python:3.12-slim

WORKDIR /app

# Install only binary runtime dependencies (like libpq for postgres)
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create media directory for Viral Studio
RUN mkdir -p /app/generated_media && chown -R appuser:appuser /app/generated_media

# Copy source code (filtered by .dockerignore)
COPY --chown=appuser:appuser . .

# Environment variables
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
COPY --chown=appuser:appuser start.sh /start.sh
RUN chmod +x /start.sh

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health/ping || exit 1

CMD ["/start.sh"]

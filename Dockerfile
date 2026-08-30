# ─────────────────────────────────────────────────────────────
# Stage 1: Build the React Frontend
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Python FastAPI Backend + Production Server
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim AS production

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY agent/ ./agent/
COPY api/ ./api/
COPY mcp_server/ ./mcp_server/
COPY sandbox/ ./sandbox/
COPY catalog/ ./catalog/
COPY .env* ./

# Copy built React frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Run FastAPI app with Uvicorn (binds to $PORT for cloud platforms like Render / Railway / Cloud Run)
CMD ["sh", "-c", "uvicorn api.app:app --host 0.0.0.0 --port ${PORT:-8000}"]

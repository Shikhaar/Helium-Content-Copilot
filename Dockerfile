# Stage 1: Build Next.js Static Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --include=dev

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Runtime Environment
FROM python:3.11-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY --from=frontend-builder /app/frontend/out ./static

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DATABASE_URL=/app/helium.db \
    PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]


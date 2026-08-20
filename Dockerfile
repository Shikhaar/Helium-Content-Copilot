# ── Stage 1: Build Next.js Standalone Frontend ──────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --include=dev

COPY frontend/ ./
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aG90LXdhbGxleWUtNDU4MS5jbGVyay5hY2NvdW50cy5kZXYk
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RUN npm run build

# ── Stage 2: Unified Production Runtime (Python + Node.js) ───────────────────
FROM python:3.11-slim AS runner
WORKDIR /app

# Install Node.js 20 runtime and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app ./app

# Copy Next.js Standalone build
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Setup start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DATABASE_URL=/app/helium.db \
    INTERNAL_BACKEND_URL=http://127.0.0.1:8001 \
    PORT=8000

EXPOSE 8000

CMD ["./start.sh"]

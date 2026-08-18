# Stage 1: Build Next.js Static Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build static output
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Runtime Environment
FROM python:3.11-slim AS runner
WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY backend/app ./app

# Copy compiled frontend from Stage 1 into /app/static
COPY --from=frontend-builder /app/frontend/out ./static

# Environment defaults
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    DATABASE_URL=/app/helium.db

EXPOSE 8000

# Start unified web service
CMD [ sh, -c, uvicorn app.main:app --host 0.0.0.0 --port ]

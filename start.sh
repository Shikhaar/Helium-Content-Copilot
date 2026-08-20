#!/bin/sh
set -e

echo "Starting FastAPI backend on internal port 8001..."
uvicorn app.main:app --host 127.0.0.1 --port 8001 &

echo "Starting Next.js frontend on public port ${PORT:-8000}..."
cd /app/frontend
PORT=${PORT:-8000} HOSTNAME="0.0.0.0" exec node server.js

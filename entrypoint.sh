#!/bin/sh
set -e
echo "Running database migrations..."
alembic upgrade head
if [ "$#" -gt 0 ]; then
    echo "Starting with custom command: $@"
    exec "$@"
else
    echo "Starting production API server (gunicorn)..."
    exec gunicorn app.main:app \
        --workers 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --access-logfile - \
        --error-logfile -
fi

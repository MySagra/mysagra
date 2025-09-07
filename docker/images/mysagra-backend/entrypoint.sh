#!/bin/sh
set -e

echo "Starting application..."

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Change to the backend directory
cd /app/apps/backend

# Run Prisma migrations if MIGRATE_ON_START is set
if [ "$MIGRATE_ON_START" = "true" ]; then
  echo "Running Prisma migrations..."
  pnpm exec prisma migrate deploy
fi

# Start the application
echo "Starting Node.js application..."
exec node dist/index.js
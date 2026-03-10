#!/bin/sh
set -e

echo "Starting application..."

mkdir -p /app/apps/backend/logs

if [ "$MIGRATE_ON_START" = "true" ]; then
  echo "Running Prisma migrations..."
  cd /app/packages/database
  node_modules/.bin/prisma migrate deploy

  echo "Seeding database..."
  node_modules/.bin/tsx prisma/seed.ts
fi

echo "Starting Node.js application..."
cd /app/apps/backend
exec node_modules/.bin/tsx src/index.ts

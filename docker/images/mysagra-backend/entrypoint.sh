#!/bin/sh
set -e

echo "Starting application..."

mkdir -p /app/logs /app/public/uploads/banners && chmod 755 /app/logs /app/public

# Seed default banner into the volume (only if not already present)
if [ -d /app/.defaults/banners ]; then
  for f in /app/.defaults/banners/*; do
    [ -f "$f" ] || continue
    dest="/app/public/uploads/banners/$(basename "$f")"
    if [ ! -f "$dest" ]; then
      cp "$f" "$dest"
      echo "Seeded default banner: $(basename "$f")"
    fi
  done
fi

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

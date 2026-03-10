# ────────────────────────────────────────────────────
# base: minimal Node LTS / Alpine
# ────────────────────────────────────────────────────
FROM node:lts-alpine AS base

# ────────────────────────────────────────────────────
# pnpm_base: pnpm 10 (shared by builder + installer)
# ────────────────────────────────────────────────────
FROM base AS pnpm_base
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate

# ────────────────────────────────────────────────────
# builder: minimal monorepo snapshot via turbo prune
# ────────────────────────────────────────────────────
FROM pnpm_base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune mysagra-backend --docker

# ────────────────────────────────────────────────────
# installer: dependencies + Prisma v7 client generation
# ────────────────────────────────────────────────────
FROM pnpm_base AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 1. Manifests first → better Docker cache (dependencies change less often than code)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# 2. Full source
COPY --from=builder /app/out/full/ .

# 3. Generate Prisma v7 client (no DATABASE_URL required: url removed from datasource)
RUN pnpm --filter @mysagra/database run generate

# ────────────────────────────────────────────────────
# runner: lightweight production image
# tsx runs TypeScript directly, bypassing tsc CJS limits
# (Prisma v7 client uses import.meta.url → pure ESM)
# ────────────────────────────────────────────────────
FROM base AS runner
RUN apk add --no-cache wget
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 express

# ── Backend source ────────────────────────────────────────────────────────
COPY --from=installer --chown=express:nodejs /app/apps/backend/src           ./apps/backend/src
COPY --from=installer --chown=express:nodejs /app/apps/backend/public        ./apps/backend/public
COPY --from=installer --chown=express:nodejs /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --from=installer --chown=express:nodejs /app/apps/backend/package.json  ./apps/backend/package.json

# ── @mysagra/database (source + generated Prisma client) ─────────────────
COPY --from=installer --chown=express:nodejs /app/packages/database/src          ./packages/database/src
COPY --from=installer --chown=express:nodejs /app/packages/database/package.json ./packages/database/package.json

# ── @mysagra/schemas (source TypeScript) ─────────────────────────────────
COPY --from=installer --chown=express:nodejs /app/packages/schemas/src          ./packages/schemas/src
COPY --from=installer --chown=express:nodejs /app/packages/schemas/package.json ./packages/schemas/package.json

# ── Prisma CLI artifacts (migrate + seed on startup) ──────────────────────
COPY --from=installer --chown=express:nodejs /app/packages/database/prisma           ./packages/database/prisma
COPY --from=installer --chown=express:nodejs /app/packages/database/prisma.config.ts ./packages/database/prisma.config.ts
COPY --from=installer --chown=express:nodejs /app/packages/database/tsconfig.json    ./packages/database/tsconfig.json

# ── node_modules (root workspace + per-package) ───────────────────────────
COPY --from=installer --chown=express:nodejs /app/node_modules                   ./node_modules
COPY --from=installer --chown=express:nodejs /app/apps/backend/node_modules      ./apps/backend/node_modules
COPY --from=installer --chown=express:nodejs /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=installer --chown=express:nodejs /app/packages/schemas/node_modules  ./packages/schemas/node_modules
COPY --from=installer --chown=express:nodejs /app/package.json                   ./package.json

# ── Entrypoint ────────────────────────────────────────────────────────────
COPY --chown=express:nodejs docker/images/mysagra-backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER express

EXPOSE 4300
ENV NODE_ENV=production
ENV PORT=4300

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget -qO /dev/null http://localhost:4300/health || exit 1

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
# Build Stage
FROM node:lts-alpine AS base

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat curl
# Set working directory
WORKDIR /app
RUN corepack enable
RUN yarn global add turbo@^2
COPY . .
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune mysagra-backend --docker

FROM base AS installer
# Install system dependencies for Prisma
RUN corepack enable
RUN apk update && apk add --no-cache libc6-compat curl openssl
WORKDIR /app

# Install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy source code
COPY --from=builder /app/out/full/ .

# Environment variables (before Prisma generate)
COPY .env* ./

# Generate Prisma Client
RUN pnpm --filter mysagra-backend exec prisma generate

# Build the project
RUN pnpm turbo run build --filter=mysagra-backend

FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# User
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

# Copy built application
COPY --from=installer --chown=express:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer --chown=express:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=installer --chown=express:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=installer --chown=express:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=installer --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=express:nodejs /app/package.json ./package.json

# Copy generated Prisma Client
COPY --from=installer --chown=express:nodejs /app/apps/backend/generated ./apps/backend/generated

# Copy entrypoint script
COPY --chown=express:nodejs docker/images/mysagra-backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER express

EXPOSE 4300
ENV NODE_ENV=production
ENV PORT=4300

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD curl -f http://localhost:4300/health || exit 1

# Start command
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
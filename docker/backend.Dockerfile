# Build Stage
FROM node:lts-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app
RUN yarn global add turbo@^2
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune mysagra-backend --docker

FROM base AS installer
# Install system dependencies for Prisma
RUN corepack enable
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
COPY --from=builder /app/out/full/ .
RUN pnpm --filter ./apps/backend... exec prisma generate

# Environment variables
COPY .env* ./

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build

FROM base AS runner
WORKDIR /app

# User
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express
USER express

# Copy necessary files
COPY --from=installer /app/package*.json ./
COPY --from=installer /app/apps/backend/prisma ./prisma
COPY --from=installer /app/apps/backend/generated ./generated

EXPOSE 4300

ENV NODE_ENV=production
ENV PORT=4300

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD curl -f http://localhost:4300/health || exit 1

# Start command with migration check
CMD ["npm", "start"]
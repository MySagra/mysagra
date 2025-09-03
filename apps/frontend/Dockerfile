# syntax=docker.io/docker/dockerfile:1

# -----------------------------
# Base image
# -----------------------------
FROM node:lts-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -----------------------------
# Install dependencies
# -----------------------------
FROM base AS deps

# Copia solo i file necessari per installare le dipendenze
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json

# Usa pnpm
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# -----------------------------
# Build stage
# -----------------------------
FROM base AS builder
WORKDIR /app

# Copia node_modules dal layer deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build environment
ARG APP_NAME=MySagra
ENV NEXT_PUBLIC_APP_NAME=${APP_NAME}

# Build frontend and backend
RUN pnpm --filter frontend run build
RUN pnpm --filter backend run build

# -----------------------------
# Production image
# -----------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone
COPY --from=builder /app/apps/frontend/.next/standalone ./apps/frontend/.next/standalone
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/.next/standalone/server.js"]
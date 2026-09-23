FROM node:lts-alpine AS base
 
FROM base AS builder
RUN apk add --no-cache libc6-compat
# pnpm 12 must match the root package.json "packageManager" field so that the
# pnpm-workspace.yaml overrides and the lockfile are read correctly.
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
# Set working directory
WORKDIR /app
COPY . .
 
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN pnpm dlx turbo@2.10.12 prune mysagra-frontend --docker
 
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /app
 
# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Environment variables
COPY .env* ./

# Application version, injected from the release git tag at build time
# (see .github/workflows/publish.yml). Next.js inlines NEXT_PUBLIC_* at build.
ARG APP_VERSION=0.0.0-dev
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
 
# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build
 
FROM base AS runner
WORKDIR /app
 
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/server.js"]
FROM node:lts-alpine AS base
 
FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN yarn global add turbo@^2
COPY . .
 
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune mysagra-frontend --docker
 
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN corepack enable
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app
 
# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Environment variables
COPY .env* ./
 
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
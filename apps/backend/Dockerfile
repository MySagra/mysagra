# Build Stage
FROM node:lts-alpine AS builder

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files for caching
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:lts-alpine AS production

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat wget curl

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Copy environment files if they exist
COPY .env* ./

# Create logs directory
RUN mkdir -p logs public/uploads

# Set proper ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 4300

ENV NODE_ENV=production
ENV PORT=4300

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD curl -f http://localhost:4300/health || exit 1

# Start command with migration check
CMD ["npm", "start"]
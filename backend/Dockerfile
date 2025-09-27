# Use the official Bun image for building
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update && apt-get install -y python3 make && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb drizzle.config.ts ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /usr/src/app

# Install only production dependencies
COPY package.json bun.lockb drizzle.config.ts ./
RUN bun install --frozen-lockfile --production && rm -rf /var/lib/apt/lists/*

# Copy built application and source code
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /usr/src/app/run.sh ./run.sh

# Make run script executable
RUN chmod +x ./run.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run the application
ENTRYPOINT ["sh", "./run.sh"]
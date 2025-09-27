# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN npm ci --only=production

# Copy built assets from build stage
COPY --from=build /app/dist ./dist/

# Copy source code for Vite preview server
COPY --from=build /app/package.json ./
COPY --from=build /app/vite.config.ts ./
COPY --from=build /app/index.html ./

# Expose port 5173
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start Vite preview server
CMD ["npm", "run", "start"]
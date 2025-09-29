# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install Bun
RUN npm install -g bun

# Copy package files
COPY package*.json ./

# Install dependencies (include dev dependencies for build tools like TypeScript)
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage: NGINX
FROM nginx:alpine AS production

# Copy built assets from build stage to NGINX html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# NGINX starts automatically with default CMD
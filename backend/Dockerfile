# Use a single stage for simplicity and reliability
FROM oven/bun AS runner
WORKDIR /app

# Install system dependencies needed for node-gyp/native addons and PostgreSQL
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libpq-dev \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies needed for migrations)
RUN bun install

# Copy app source
COPY . .
RUN chmod +x /app/run.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
  

ENTRYPOINT ["/app/run.sh"]

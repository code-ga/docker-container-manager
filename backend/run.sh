#!/bin/bash

# Ensure dependencies are installed and linked before running migrations
echo "Installing dependencies..."
ls -la
pwd
bun install
bun install pg

# Run database migrations first using Drizzle
echo "Running database migrations..."
bun add pg && bun run --bun drizzle-kit migrate

# Start the application
echo "Starting application..."
bun run src/index.ts
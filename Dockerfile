# Dockerfile for Secure File Sandbox
# Multi-stage build for minimal attack surface

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Sandbox processor image
FROM alpine:latest

# Install Node.js runtime only
RUN apk add --no-cache nodejs

# Create non-root user
RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

# Set working directory
WORKDIR /sandbox

# Copy only necessary files from builder
COPY --from=builder /build/node_modules ./node_modules
COPY sandbox/sandbox-processor.js ./

# Create directories for processing
RUN mkdir -p /sandbox/input /sandbox/output /sandbox/temp && \
    chown -R sandbox:sandbox /sandbox

# Switch to non-root user
USER sandbox

# Set resource limits via environment
ENV NODE_OPTIONS="--max-old-space-size=128"

# TODO: Add healthcheck
# HEALTHCHECK

# Run processor
CMD ["node", "sandbox-processor.js"]

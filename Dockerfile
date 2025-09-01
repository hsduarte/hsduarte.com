# Multi-stage build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and Angular workspace config
COPY package.json package-lock.json angular.json tsconfig*.json ./

# Install dependencies (including devDependencies for build) using clean, reproducible install
RUN npm ci

# Copy only the necessary source files
# Avoid relying on wildcard context when .dockerignore might exclude files
COPY src ./src
COPY server.ts ./server.ts

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S angular -u 1001

# Install only production dependencies
COPY --chown=angular:nodejs package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built application from builder stage
# Default: copy built dist from builder stage
COPY --from=builder --chown=angular:nodejs /app/dist ./dist

# Switch to non-root user
USER angular

# Expose port
EXPOSE 4000

# Health check (fast and lightweight endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/_health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/hs-duarte/server/server.mjs"]

# Runtime stage when dist is prebuilt in CI and provided in build context
FROM node:20-alpine AS runtime-prebuilt
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache dumb-init \
  && addgroup -g 1001 -S nodejs \
  && adduser -S angular -u 1001

COPY --chown=angular:nodejs package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy prebuilt dist from context (no Angular build here)
COPY --chown=angular:nodejs dist ./dist

USER angular
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/_health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/hs-duarte/server/server.mjs"]

# ============================================
# Multi-stage Dockerfile for Lemon API
# Production-ready with minimal attack surface
# ============================================

# ============================================
# Stage 1: Dependencies
# Install all dependencies (prod + dev)
# ============================================
FROM node:20-slim AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (needed for build)
RUN npm ci

# ============================================
# Stage 2: Build
# Compile TypeScript and generate Prisma client
# ============================================
FROM node:20-slim AS build

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client BEFORE building (needed for TypeScript compilation)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Stage 3: Runtime
# Production-only dependencies, non-root user
# ============================================
FROM node:20-slim AS runtime

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r lemon && \
    useradd -r -g lemon -s /bin/false lemon

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy Prisma schema and migrations (needed for runtime migrations)
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Change ownership to non-root user
RUN chown -R lemon:lemon /app

# Switch to non-root user
USER lemon

# Set production environment
ENV NODE_ENV=production

# Expose port (default 3000, can be overridden)
EXPOSE 3000

# Health check (uses /health endpoint, not /ready to avoid DB flapping)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start command: run migrations then start server
# This ensures migrations are applied before the API starts
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

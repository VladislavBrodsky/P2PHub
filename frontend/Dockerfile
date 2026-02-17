# --- Stage 1: Build ---
FROM node:20-alpine AS build

# Install build dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 1. Copy ONLY the lockfiles first for better caching
COPY package*.json ./

# 2. Install dependencies (Clean Install)
RUN npm ci

# 3. Copy source files (filtered by .dockerignore)
COPY . .

# 4. Build the application
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy only the necessary files from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/server.cjs ./
COPY --from=build /app/package.json ./

USER nodejs

EXPOSE 80

# Environment variables for production optimization
ENV NODE_ENV=production
ENV PORT=80

CMD ["node", "server.cjs"]

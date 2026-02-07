# Frontend Dockerfile
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serving stage
FROM node:20-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Copy built app and server
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/server.cjs ./

USER nodejs

EXPOSE 80
CMD ["node", "server.cjs"]

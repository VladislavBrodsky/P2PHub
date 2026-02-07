# Frontend Dockerfile
FROM node:20-slim AS build

WORKDIR /app

# Enable npm cache bypass if needed
ENV NPM_CONFIG_CACHE=/tmp/.npm-cache

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serving stage using Node.js 'serve'
FROM node:20-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app
COPY --from=build /app/dist ./dist

# Expose Railway's PORT (default 80)
ENV PORT=80
EXPOSE ${PORT}

# Start serve
# -s: Single-page application (rewrites all not-found requests to index.html)
# -l: Listen on specific port
CMD serve -s dist -l tcp://0.0.0.0:${PORT}

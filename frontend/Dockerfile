# Frontend Dockerfile
FROM node:20 AS build

WORKDIR /app

# Enable npm cache bypass if needed
ENV NPM_CONFIG_CACHE=/tmp/.npm-cache

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serving stage using Node.js 'serve'
FROM node:20

WORKDIR /app

# Copy built app
COPY --from=build /app/dist ./dist

# Start serve
# -s: Single-page application (rewrites all not-found requests to index.html)
# -l: Listen on specific port (default to 80 if PORT is not set)
CMD ["/bin/sh", "-c", "npx serve -s dist -l ${PORT:-80}"]

# Frontend Dockerfile
FROM node:20 AS build

WORKDIR /app

# Enable npm cache bypass if needed
ENV NPM_CONFIG_CACHE=/tmp/.npm-cache

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serving stage using custom Node.js server
FROM node:20

WORKDIR /app

# Copy built app and server script
COPY --from=build /app/dist ./dist
COPY server.cjs ./

# Start the custom server
# Explicitly handles PORT and SPA routing
CMD ["node", "server.cjs"]

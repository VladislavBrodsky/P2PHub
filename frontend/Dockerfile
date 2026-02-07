# Frontend Dockerfile
FROM node:20-slim AS build

WORKDIR /app

# Enable npm cache bypass if needed
ENV NPM_CONFIG_CACHE=/tmp/.npm-cache

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serving stage with envsubst support for PORT variable
FROM nginx:stable-alpine

# Install gettext for envsubst


# Copy nginx template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Railway's PORT (default 80 for local)
EXPOSE ${PORT:-80}
ENV PORT=80
# Copy custom entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

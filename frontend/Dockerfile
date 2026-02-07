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
RUN apk add --no-cache gettext

# Copy nginx template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Railway's PORT (default 80 for local)
EXPOSE ${PORT:-80}

# Use envsubst to replace ${PORT} in nginx config, then start nginx
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

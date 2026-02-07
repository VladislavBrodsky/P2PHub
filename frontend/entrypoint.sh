#!/bin/sh
set -e

# Default PORT to 80 if not set
PORT="${PORT:-80}"

echo "Starting Nginx with PORT=$PORT"

# Copy the template to the final configuration location
cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

# Replace ${PORT} with the environment variable value using sed
# We use | as a delimiter to avoid issues if PORT contained a slash (unlikely, but good practice)
sed -i "s|\${PORT}|$PORT|g" /etc/nginx/conf.d/default.conf

# Print the configuration for debugging
echo "Generated Nginx Config:"
cat /etc/nginx/conf.d/default.conf

# Test the Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Execute the passed command (usually "nginx -g 'daemon off;'")
exec "$@"

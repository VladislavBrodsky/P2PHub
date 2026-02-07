#!/bin/sh
set -e

# Default PORT to 80 if not set
PORT="${PORT:-80}"

echo "Starting Nginx with PORT=$PORT"

# Copy the template to the final configuration location
cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

# Replace PORT_PLACEHOLDER with the environment variable value using sed
# using standard / delimiter
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/conf.d/default.conf

# Print the configuration for debugging
echo "Generated Nginx Config:"
cat /etc/nginx/conf.d/default.conf

# Test the Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Execute the passed command (usually "nginx -g 'daemon off;'")
exec "$@"

#!/bin/sh
set -e

# Explicitly replace ONLY the ${PORT} variable in the template
# and output to the final config file.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Verify the config by printing it (for debugging)
echo "Generated Nginx Config:"
cat /etc/nginx/conf.d/default.conf

# Start Nginx
exec "$@"

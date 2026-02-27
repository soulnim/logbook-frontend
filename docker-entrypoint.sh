#!/bin/sh
set -e

# Check if BACKEND_HOST is set
if [ -z "$BACKEND_HOST" ]; then
    echo "ERROR: BACKEND_HOST environment variable is not set!"
    echo "Please set BACKEND_HOST in Railway to your backend domain"
    echo "Example: logbook-backend-production-2657.up.railway.app"
    exit 1
fi

echo "Configuring nginx to proxy to: $BACKEND_HOST"

# Replace placeholder in nginx config
sed "s|BACKEND_HOST_PLACEHOLDER|${BACKEND_HOST}|g" /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration complete"
echo "Starting nginx..."

# Start nginx
exec nginx -g "daemon off;"
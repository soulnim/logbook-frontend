#!/bin/sh
set -e

# Check if BACKEND_HOST is set
if [ -z "$BACKEND_HOST" ]; then
    echo "ERROR: BACKEND_HOST environment variable is not set!"
    echo "Please set BACKEND_HOST in Railway to your backend domain"
    echo "Example: logbook-backend-production-2657.up.railway.app"
    exit 1
fi

# Use Railway's PORT if set, otherwise default to 80
if [ -z "$PORT" ]; then
    PORT=80
fi

echo "Configuring nginx..."
echo "- Backend: $BACKEND_HOST"
echo "- Listening on port: $PORT"

# Replace placeholders in nginx config
sed -e "s|BACKEND_HOST_PLACEHOLDER|${BACKEND_HOST}|g" \
    -e "s|PORT_PLACEHOLDER|${PORT}|g" \
    /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration complete"
echo "Starting nginx..."

# Start nginx
exec nginx -g "daemon off;"
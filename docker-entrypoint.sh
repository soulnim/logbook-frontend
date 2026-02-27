#!/bin/sh
set -e

# Use Railway's PORT if set, otherwise default to 80
if [ -z "$PORT" ]; then
    PORT=80
fi

BACKEND_URL=${BACKEND_URL:-http://localhost:8080}
PORT=${PORT:-80}

echo "Configuring nginx..."
echo "- Backend: $BACKEND_URL"
echo "- Listening on port: $PORT"

sed -e "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" \
    -e "s|PORT_PLACEHOLDER|${PORT}|g" \
    /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration complete. Starting nginx..."
exec nginx -g "daemon off;"
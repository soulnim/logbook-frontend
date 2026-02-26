#!/bin/sh
set -e

# Default PORT to 8080 if not set (Railway sets $PORT dynamically)
APP_PORT="${PORT:-8080}"

# Swap the port in nginx config
sed -i "s/__APP_PORT__/${APP_PORT}/g" /etc/nginx/conf.d/default.conf

# Replace VITE_API_URL placeholder in built JS files
if [ -n "$VITE_API_URL" ]; then
  find /usr/share/nginx/html/assets -name "*.js" \
    -exec sed -i "s|__VITE_API_URL_PLACEHOLDER__|${VITE_API_URL}|g" {} +
fi

exec nginx -g "daemon off;"
#!/bin/sh
set -e

API_URL="${API_URL:-http://localhost:8080}"

envsubst '${API_URL}' < /usr/share/nginx/html/env.js.template \
                      > /usr/share/nginx/html/env.js

echo "Runtime config:"
cat /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
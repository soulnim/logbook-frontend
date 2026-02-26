#!/bin/sh
set -e

# Replace placeholder in env.js.template with actual runtime env var
# API_URL is set in Railway Variables → injected here at container startup
envsubst '${API_URL}' < /usr/share/nginx/html/env.js.template \
                      > /usr/share/nginx/html/env.js

echo "Runtime config written:"
cat /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
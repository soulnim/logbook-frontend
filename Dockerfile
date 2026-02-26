# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with a placeholder - will be replaced at runtime
ARG VITE_API_URL=__VITE_API_URL_PLACEHOLDER__
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Runtime env injection script
RUN printf '#!/bin/sh\n\
# Replace placeholder in built JS files with actual VITE_API_URL at runtime\n\
if [ -n "$VITE_API_URL" ]; then\n\
  find /usr/share/nginx/html/assets -name "*.js" -exec \\\n\
    sed -i "s|__VITE_API_URL_PLACEHOLDER__|$VITE_API_URL|g" {} +\n\
fi\n\
# Start nginx using template (substitutes $PORT)\n\
envsubst '"'"'$PORT'"'"' < /etc/nginx/templates/default.conf.template \\\n\
  > /etc/nginx/conf.d/default.conf\n\
exec nginx -g "daemon off;"\n' > /docker-entrypoint-custom.sh \
  && chmod +x /docker-entrypoint-custom.sh

EXPOSE 8080

CMD ["/docker-entrypoint-custom.sh"]
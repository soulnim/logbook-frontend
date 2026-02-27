# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Remove the default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config template (with placeholder)
COPY nginx.conf /etc/nginx/nginx.template.conf

# Copy custom entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

# Set environment variable default (will be overridden by Railway)
ENV BACKEND_HOST=localhost:8080

EXPOSE 80

CMD ["/docker-entrypoint-custom.sh"]
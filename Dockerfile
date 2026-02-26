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
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime entrypoint: inject VITE_API_URL into JS and PORT into nginx config
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
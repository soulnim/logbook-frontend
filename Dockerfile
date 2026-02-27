# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL is intentionally left empty — the browser uses relative URLs
# and nginx proxies /api/* to the backend container. This means the same image
# works in every environment (local, staging, prod) with zero rebuild.
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Remove the default config so our template is the only one processed.
RUN rm -f /etc/nginx/conf.d/default.conf

# Put our config in the templates dir — the nginx entrypoint will process it.
# NGINX_ENVSUBST_FILTER restricts envsubst to ONLY substitute the listed variable.
# Since we reference no shell variables in our config (listen 80 is hardcoded),
# we pass a dummy that never exists — so envsubst runs but touches nothing,
# and nginx's own $host, $uri, $scheme, $proxy_add_x_forwarded_for etc. survive intact.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER='$__UNUSED__'

EXPOSE 80
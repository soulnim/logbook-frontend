# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Place config in /templates/ — nginx's OWN entrypoint automatically runs
# envsubst on files here, replacing ${PORT} before nginx starts.
# No custom shell script needed — zero CRLF risk.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# nginx image's default entrypoint handles templates then starts nginx
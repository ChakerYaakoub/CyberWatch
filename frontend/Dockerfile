# CyberWatch React SPA — multi-stage (build with Vite, serve static files).
#
# VITE_* must be ARG/ENV at build time — they are inlined into the JS bundle.
# Changing Keycloak/API URL requires: docker compose build frontend (or make start).

# --- Build stage ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build args from Compose (infrastructure/.env → compose build.args)
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN npm run build

# --- Runtime: static file server on 5173 (same port as Vite dev for familiarity) ---
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

EXPOSE 5173

# -s: SPA fallback to index.html for client-side routes
CMD ["serve", "-s", "dist", "-l", "5173"]

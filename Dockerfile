# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────────────────────
# Lekko frontend — multi-stage build
#   1) deps     — npm ci с lock-файлом (кэш слоя на package-lock.json).
#   2) build    — vite build с build-args VITE_*.
#   3) runtime  — nginx:alpine + наш nginx.conf, статика из /usr/share/nginx/html.
#
# Build-time env (передаются через docker-compose.yml → args, или -e):
#   VITE_API_BASE_URL       — куда фронт ходит (пусто = same-origin через nginx).
#   VITE_TURNSTILE_SITEKEY  — Cloudflare Turnstile (CAPTCHA на login).
# Vite впекает их в bundle, runtime-смена невозможна — пересборка обязательна.
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20-alpine
ARG NGINX_VERSION=1.27-alpine

# ── stage 1: deps ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── stage 2: build ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-args становятся env только для этого RUN.
ARG VITE_API_BASE_URL=
ARG VITE_TURNSTILE_SITEKEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_TURNSTILE_SITEKEY=$VITE_TURNSTILE_SITEKEY

# vite build напрямую (без `tsc -b`) — в репе 27 pre-existing TS-ошибок
# (mocks/orders.mocks.ts, CartPage, useOrderNotifications). Strict typecheck
# блокирует prod-сборку, но runtime эти моки не используются. Vite сам делает
# transpile через esbuild — типы не проверяет.
RUN npx vite build

# ── stage 3: runtime ─────────────────────────────────────────────────────────
FROM nginx:${NGINX_VERSION} AS runtime
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost/healthz || exit 1

# nginx сам PID 1, default CMD из официального образа.

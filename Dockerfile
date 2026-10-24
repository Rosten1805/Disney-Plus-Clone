# syntax=docker/dockerfile:1.7

# --- deps: install dependencies only (cached separately from source) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: compile the Next.js app ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js probes every page at build time to see whether it can be static,
# which actually executes the TMDB fetch calls on the home/search/series/
# originals pages. Without a real TMDB key that probe hangs instead of
# failing fast. These two are the only env vars needed at build time —
# everything else (DATABASE_URL, GOOGLE_SECRET, SMTP_*, ...) is only read
# at request time in server components/route handlers, never during
# `next build`, so none of it needs to reach this stage.
# Passed in as build secrets (not ARG/ENV) so they never get baked into an
# image layer or show up in `docker history` — only visible to this one
# RUN step. See README for the `docker build --secret ...` invocation.
RUN --mount=type=secret,id=tmdb_api_key \
    --mount=type=secret,id=tmdb_api_url \
    TMDB_API_KEY="$(cat /run/secrets/tmdb_api_key)" \
    TMDB_API_URL="$(cat /run/secrets/tmdb_api_url)" \
    npm run build

# --- runner: minimal runtime image, non-root user ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]

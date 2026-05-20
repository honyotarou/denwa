# Monorepo build (context: repo root). Replaces Phase 2.5 stub that did not listen on :3000.
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/pbx-core/package.json packages/pbx-core/
COPY packages/pbx-db/package.json packages/pbx-db/
COPY packages/pbx-infra/package.json packages/pbx-infra/
COPY packages/pbx-ops/package.json packages/pbx-ops/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

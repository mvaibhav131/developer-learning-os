# syntax=docker/dockerfile:1.7
#
# One image runs everything: the API and the built web app (the API serves the web files).
#   docker build -t developer-learning-os .
#   docker run --rm -p 8080:4000 -e PUBLIC_URL=http://localhost:8080 -v dlos-data:/data developer-learning-os

ARG NODE_IMAGE=node:22-bookworm-slim

# ---- build: install everything, build the web app and the API bundle ----
FROM ${NODE_IMAGE} AS build
ENV CI=true
# The compilers are only used when no prebuilt better-sqlite3 binary matches the platform.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@10.34.1
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dlos/web build && pnpm --filter @dlos/api build
# Production dependencies only. The workspace packages are already bundled into dist, so they are not needed at runtime.
RUN pnpm --filter @dlos/api --prod deploy --legacy /out/api

# ---- runtime: Node, the bundle, the migrations, the lesson files and the web app ----
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=4000 \
    DATABASE_PATH=/data/dlos.sqlite \
    WEB_DIST_DIR=/app/web \
    ALLOWED_ORIGINS=http://localhost:4000,http://127.0.0.1:4000 \
    LOG_LEVEL=info
WORKDIR /app/apps/api
COPY --from=build /out/api/node_modules ./node_modules
COPY --from=build /out/api/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
COPY --from=build /repo/apps/api/docker-backup.mjs ./docker-backup.mjs
COPY --from=build /repo/packages/learning-content/content /app/packages/learning-content/content
COPY --from=build /repo/apps/web/dist /app/web
RUN mkdir -p /data && chown -R node:node /data
USER node
# Progress, sessions and attempts live here. Mount a volume so they survive new containers.
VOLUME ["/data"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/server.js"]

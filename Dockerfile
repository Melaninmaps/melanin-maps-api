# Railway production Dockerfile
# Uses pnpm@10 to match the pnpm v10 lockfile format used locally.
# ARG RAILWAY_GIT_COMMIT_SHA (passed by Railway as a build arg) busts the
# build layer cache on every commit so TypeScript always rebuilds fresh.

FROM node:22
WORKDIR /app

# Install pnpm — match the local version (lockfileVersion 9.0, pnpm v10)
RUN npm install -g pnpm@10 --quiet

# ─── Layer 1: install dependencies ───────────────────────────────────────────
# Copy workspace metadata first so Docker can cache this layer.
# This layer invalidates only when package.json/lock files change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/

# Copy all workspace package.json files
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/web/package.json ./artifacts/web/
COPY artifacts/biz-deck/package.json ./artifacts/biz-deck/
COPY artifacts/community-deck/package.json ./artifacts/community-deck/
COPY artifacts/features-deck/package.json ./artifacts/features-deck/
COPY artifacts/investor-deck/package.json ./artifacts/investor-deck/
COPY artifacts/mobile/package.json ./artifacts/mobile/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/integrations-openai-ai-react/package.json ./lib/integrations-openai-ai-react/
COPY lib/integrations-openai-ai-server/package.json ./lib/integrations-openai-ai-server/
COPY monitoring-service/package.json ./monitoring-service/
COPY scripts/package.json ./scripts/

# Install all dependencies (--frozen-lockfile ensures reproducible builds)
RUN pnpm install --frozen-lockfile

# ─── Layer 2: build (invalidated on every commit via ARG) ────────────────────
# Railway passes RAILWAY_GIT_COMMIT_SHA as a build arg — it changes each
# commit so all subsequent layers (COPY + build) are always fresh.
ARG RAILWAY_GIT_COMMIT_SHA=unknown
ENV RAILWAY_GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA}

# Copy all source files
COPY . .

# Build — generateBuildIdentity() uses RAILWAY_GIT_COMMIT_SHA as fallback
RUN pnpm --filter @workspace/api-server run build

# Copy compiled output to root dist/ where static-server.mjs expects it
RUN mkdir -p dist && \
    cp artifacts/api-server/dist/index.mjs dist/index.mjs && \
    { cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map 2>/dev/null || true; } && \
    { cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY 2>/dev/null || true; } && \
    mkdir -p dist/public && { cp -r artifacts/api-server/dist/public/. dist/public/ 2>/dev/null || true; }

EXPOSE ${PORT:-3000}
CMD ["node", "static-server.mjs"]

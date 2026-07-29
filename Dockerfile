# Railway production Dockerfile
# Replaces nixpacks so the pnpm build always runs fresh (nixpacks was caching
# the TypeScript compilation layer, preventing built_from_sha from being embedded).
#
# RAILWAY_GIT_COMMIT_SHA is passed as a Docker build arg by Railway so that
# generateBuildIdentity() can embed the SHA even without a .git directory.

FROM node:22-slim
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9 --quiet

# ─── Layer 1: install dependencies ───────────────────────────────────────────
# Copy files that determine dependency graph — cached until lock/workspace changes.
# Ordering: workspace root first, then all packages so pnpm can resolve the graph.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files before pnpm install
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

RUN pnpm install --frozen-lockfile 2>&1

# ─── Layer 2: build (busted on every source change or SHA change) ─────────────
# ARG RAILWAY_GIT_COMMIT_SHA changes with every deploy, invalidating this layer
# and everything after it — so pnpm build ALWAYS runs fresh.
ARG RAILWAY_GIT_COMMIT_SHA=unknown
ENV RAILWAY_GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA}

# Copy all source files (layer cache is already busted by the ARG above)
COPY . .

# Build the API server
# generateBuildIdentity() reads RAILWAY_GIT_COMMIT_SHA when git is unavailable
RUN pnpm --filter @workspace/api-server run build

# Copy compiled bundle to root dist/ where static-server.mjs expects it
RUN mkdir -p dist && \
    cp artifacts/api-server/dist/index.mjs dist/index.mjs && \
    cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map 2>/dev/null || true && \
    cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY 2>/dev/null || true && \
    mkdir -p dist/public && cp -r artifacts/api-server/dist/public/. dist/public/ 2>/dev/null || true

# ─── Runtime ──────────────────────────────────────────────────────────────────
EXPOSE ${PORT:-3000}
CMD ["node", "static-server.mjs"]

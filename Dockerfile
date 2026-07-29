# Railway production Dockerfile
# Uses node:22 (full Debian) so native modules like bcrypt compile correctly.
# ARG RAILWAY_GIT_COMMIT_SHA busts the build cache on every commit.

FROM node:22
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9 --quiet

# ─── Layer 1: install (cached until lock/workspace files change) ──────────────
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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

RUN pnpm install --frozen-lockfile

# ─── Layer 2: build (always fresh — ARG changes every commit) ────────────────
ARG RAILWAY_GIT_COMMIT_SHA=unknown
ENV RAILWAY_GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA}

COPY . .

RUN pnpm --filter @workspace/api-server run build

# Copy compiled bundle to root dist/ where static-server.mjs expects it
RUN mkdir -p dist && \
    cp artifacts/api-server/dist/index.mjs dist/index.mjs && \
    { cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map || true; } && \
    { cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY || true; } && \
    mkdir -p dist/public && { cp -r artifacts/api-server/dist/public/. dist/public/ || true; }

EXPOSE ${PORT:-3000}
CMD ["node", "static-server.mjs"]

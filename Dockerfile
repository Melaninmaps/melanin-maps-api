# Railway production Dockerfile — minimal, always rebuilds from source
# ARG RAILWAY_GIT_COMMIT_SHA (passed by Railway) busts the cache on every commit
# so the TypeScript build always runs fresh, embedding the SHA in the bundle.

FROM node:22
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9 --quiet

# Cache-bust: ARG changes on every commit → all subsequent layers rebuild fresh
ARG RAILWAY_GIT_COMMIT_SHA=unknown
ENV RAILWAY_GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA}

# Copy everything (node_modules and dist excluded by .dockerignore)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the API server — generateBuildIdentity() uses RAILWAY_GIT_COMMIT_SHA
RUN pnpm --filter @workspace/api-server run build

# Copy compiled output to root dist/ where static-server.mjs expects it
RUN mkdir -p dist && \
    cp artifacts/api-server/dist/index.mjs dist/index.mjs && \
    { cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map 2>/dev/null || true; } && \
    { cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY 2>/dev/null || true; } && \
    mkdir -p dist/public && { cp -r artifacts/api-server/dist/public/. dist/public/ 2>/dev/null || true; }

EXPOSE ${PORT:-3000}
CMD ["node", "static-server.mjs"]

#!/bin/bash
# scripts/ship.sh — one command to build and ship to Railway
# Handles: echo token rotation, dist sync, commit, push
#
# Usage:
#   bash scripts/ship.sh                    # auto message
#   bash scripts/ship.sh "feat: add events" # custom message suffix
#
# After pushing, Railway deploys from HEAD (~3 min).
# Verify: curl https://www.mappingwithmelanin.com/api/build-identity

set -euo pipefail

MSG_SUFFIX="${1:-}"
TOKEN="ship-$(date -u +%Y%m%d-%H%M%S)"
echo "🚀  Ship token: $TOKEN"

# ── 1. Rotate echo tokens in nixpacks.toml ────────────────────────────────────
# These tokens force a Docker layer cache miss so Railway always compiles fresh.
# sed pattern matches any existing token between "echo " and " &&".
sed -i "s|echo [a-z0-9._-]* && pnpm --filter @workspace/web|echo ${TOKEN}-web \&\& pnpm --filter @workspace/web|" nixpacks.toml
sed -i "s|echo [a-z0-9._-]* && pnpm --filter @workspace/api-server|echo ${TOKEN}-api \&\& pnpm --filter @workspace/api-server|" nixpacks.toml
echo "✓  nixpacks.toml tokens rotated"

# ── 2. Build api-server ────────────────────────────────────────────────────────
echo "Building @workspace/api-server..."
pnpm --filter @workspace/api-server run build
echo "✓  api-server built"

# ── 3. Sync dist to root (mirrors nixpacks steps 4 & 5) ──────────────────────
cp artifacts/api-server/dist/index.mjs      dist/index.mjs
cp artifacts/api-server/dist/index.mjs.map  dist/index.mjs.map
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
mkdir -p dist/public
cp -r artifacts/api-server/dist/public/. dist/public/
echo "✓  dist/ synced to root"

# ── 4. Commit everything ──────────────────────────────────────────────────────
COMMIT_MSG="ship: ${TOKEN}${MSG_SUFFIX:+ — ${MSG_SUFFIX}}"
# dist/ is in .gitignore but must be tracked — use -f to force-add
git add nixpacks.toml
git add -f dist/index.mjs dist/index.mjs.map dist/BUILD_IDENTITY
git add -f dist/public/
git add -f artifacts/api-server/dist/index.mjs artifacts/api-server/dist/index.mjs.map artifacts/api-server/dist/BUILD_IDENTITY
git add -f artifacts/api-server/dist/public/
git commit -m "$COMMIT_MSG"
echo "✓  committed: $COMMIT_MSG"

# ── 5. Push (triggers Railway deploy) ────────────────────────────────────────
git push github main
HEAD=$(git rev-parse HEAD)

echo ""
echo "✅  Pushed SHA: $HEAD"
echo ""
echo "   Railway is deploying. Wait ~3 min then verify:"
echo "   curl https://www.mappingwithmelanin.com/api/build-identity"
echo ""
echo "   Expect: built_from_sha starting with ${HEAD:0:10}"

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

# ── 2. Build and synchronize the browser bundle ───────────────────────────────
# The API build embeds web-static/index.html. Building the API before replacing
# both tracked static directories would package a stale browser bundle even when
# the server source is current.
echo "Building @workspace/web..."
pnpm --filter @workspace/web run build
echo "✓  web built"

for static_dir in web-static artifacts/api-server/web-static; do
  rm -rf "$static_dir"
  mkdir -p "$static_dir"
  cp -a artifacts/web/dist/public/. "$static_dir/"
done
node scripts/validate-runtime-static-bundle-sync.cjs
echo "✓  fresh web bundle synchronized"

# ── 3. Build api-server ────────────────────────────────────────────────────────
echo "Building @workspace/api-server..."
pnpm --filter @workspace/api-server run build
echo "✓  api-server built"

# ── 4. Sync dist to root (mirrors runtime build steps) ───────────────────────
cp artifacts/api-server/dist/index.mjs      dist/index.mjs
if [[ -f artifacts/api-server/dist/index.mjs.map ]]; then
  cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
else
  # Current esbuild production output omits an index source map. Do not fail a
  # release solely because a non-runtime debugging artifact is absent, and do
  # not retain a stale map from an earlier bundle.
  rm -f dist/index.mjs.map
fi
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
mkdir -p dist/public
cp -r artifacts/api-server/dist/public/. dist/public/
echo "✓  dist/ synced to root"

# ── 5. Commit everything ──────────────────────────────────────────────────────
COMMIT_MSG="ship: ${TOKEN}${MSG_SUFFIX:+ — ${MSG_SUFFIX}}"
# dist/ is in .gitignore but must be tracked — use -f to force-add
git add nixpacks.toml
git add web-static artifacts/api-server/web-static
git add -f dist/index.mjs dist/BUILD_IDENTITY
if [[ -f dist/index.mjs.map ]]; then
  git add -f dist/index.mjs.map
else
  git rm -f --ignore-unmatch dist/index.mjs.map
fi
git add -f dist/public/
# `artifacts/api-server/dist/index.mjs` is a generated API bundle. Railway must
# compile it afresh; tracking that bundle lets a later Docker COPY overwrite the
# fresh build with an old one. It is intentionally never staged by this helper.
git rm --cached --ignore-unmatch artifacts/api-server/dist/index.mjs \
  artifacts/api-server/dist/index.mjs.map \
  artifacts/api-server/dist/BUILD_IDENTITY
git commit -m "$COMMIT_MSG"
echo "✓  committed: $COMMIT_MSG"

# ── 6. Push (triggers Railway deploy) ────────────────────────────────────────
# Worktrees in this release environment use `origin`; retain an override for a
# checkout that deliberately names its deployment remote differently.
PUSH_REMOTE="${SHIP_PUSH_REMOTE:-origin}"
git push "$PUSH_REMOTE" main
HEAD=$(git rev-parse HEAD)

echo ""
echo "✅  Pushed SHA: $HEAD"
echo ""
echo "   Railway is deploying. Wait ~3 min then verify:"
echo "   curl https://www.mappingwithmelanin.com/api/build-identity"
echo ""
echo "   Expect: built_from_sha starting with ${HEAD:0:10}"

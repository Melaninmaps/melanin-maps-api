---
name: Railway nixpacks build cache — root cause and bypass pattern
description: Railway caches the build layer per nixpacks echo token; the root dist/index.mjs (not artifacts/api-server/dist/) is what Railway actually serves. Documents the confirmed root causes and the mandatory update procedure.
---

# Railway nixpacks build cache — root cause and confirmed fix

## The Two Root Causes

### 1. nixpacks.toml echo cache-bust token (MOST IMPORTANT)
`nixpacks.toml` step 3 contains:
```
"echo <token> && pnpm --filter @workspace/api-server run build"
```
Railway caches Docker build layers based on the exact command string. If the echo token doesn't change, Railway reuses the cached build layer — meaning `pnpm run build` never runs again in Railway's environment.

**The fix:** Change the echo token on every push that must deploy clean.
Example: `build-city-profiles-kinfolk-aug7-2026` → `build-<feature>-<date>`

### 2. Root dist/index.mjs (not artifacts/api-server/dist/)
Railway runs `node static-server.mjs` which spawns `dist/index.mjs` at the **repo root** — NOT `artifacts/api-server/dist/index.mjs`.

`nixpacks.toml` step 4 syncs it:
```
cp artifacts/api-server/dist/index.mjs dist/index.mjs
```
But if the build layer is cached (root cause #1), this cp never runs.

**The fix:** Always commit a fresh root `dist/index.mjs` alongside code changes:
```bash
cp artifacts/api-server/dist/index.mjs dist/index.mjs
cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
git add -f dist/index.mjs dist/index.mjs.map dist/BUILD_IDENTITY \
           artifacts/api-server/dist/index.mjs artifacts/api-server/dist/index.mjs.map \
           nixpacks.toml
```

## MANDATORY Deploy Checklist (every api-server push)

1. Build: `pnpm --filter @workspace/api-server run build`
2. Sync root dist:
   ```bash
   cp artifacts/api-server/dist/index.mjs dist/index.mjs
   cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
   cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
   ```
3. Update the echo token in `nixpacks.toml` line 14 to `build-<feature>-<mmdd>-<year>`
4. Commit ALL of: root dist files + api-server dist files + nixpacks.toml + source
5. Push to `github` remote (not `origin`)

## What DOES NOT work
- Bumping `package.json` version alone — only busts pnpm install layer, not build layer
- Adding a new devDependency — same as above, build layer still cached
- Railway "Redeploy" button — reuses same cached layers
- Railway dashboard "Deployment successful" — do NOT trust this; always verify SHA

## Verification — the ONLY reliable test
```bash
# 1. SHA check
curl -s https://www.mappingwithmelanin.com/api/version | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print('built_from:', d['built_from_sha'][:12])"

# 2. Endpoint existence probe (returns 401=new code, 404=old binary)
curl -s -o /dev/null -w "%{http_code}" \
  https://www.mappingwithmelanin.com/api/admin/seed-manus-cultural-sites-pass2
```
Both must pass. Dashboard status alone is not sufficient.

## Direct-DB Workaround (when endpoint unavailable due to cached build)
When Railway's cached binary doesn't have a new endpoint, seed directly via Railway Postgres public proxy:
- Host: `tokaido.proxy.rlwy.net:10066`
- Connection: `ssl: { rejectUnauthorized: false }`
- Get URL via Railway API using `RAILWAY_ACCOUNT_TOKEN`, service `7bb11d12`
- Run tsx scripts from workspace root

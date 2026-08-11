---
name: nixpacks echo token — correct format and sed pattern
description: How to correctly update the cache-bust echo token in nixpacks.toml
---

# Nixpacks Echo Token — Correct Format

## The Problem
The sed pattern used to update the echo token must match the ACTUAL string in nixpacks.toml.
The string is embedded inside a TOML array value:

```
  "echo \"safety-exp-v1-1786435000\" && pnpm --filter @workspace/api-server run build",
```

## Correct sed Pattern

```bash
# The echo token is embedded inside the quoted string — match the inner text
sed -i 's/"echo \\"[^"]*\\" && pnpm/"echo \\"NEW_TOKEN\\" \&\& pnpm/' nixpacks.toml
```

Or more reliably, just use a direct Edit call or write the full line.

## Why the Cache Bust Matters

Railway caches Docker build layers. If the nixpacks.toml build step command doesn't change,
Railway reuses the cached layer and serves the OLD binary. The echo token makes the command
text unique on every push, forcing a fresh build.

**However**: Railway also busts the cache when source files change (COPY layers are invalidated).
So even without updating the echo token, a fresh source-file change usually triggers a rebuild.
The echo token is a belt-and-suspenders guarantee.

## Token Naming Convention

`<feature-slug>-v<N>-<unix-timestamp>`

Example: `"safety-exp-v1-1786435000"`

## IMPORTANT: Full Cache Rebuild Takes 60-90 Minutes

When the echo token IS updated (or COPY layers change), Railway does a full rebuild from scratch:
- pnpm install: 30-60 min (large monorepo)
- esbuild: 1-4 min
- Startup migrations: 5-15 min (seeding)
- Total: 60-90+ min of zero-traffic downtime

This means updating the echo token causes EXTENDED DOWNTIME on Railway. Only do it when necessary.
If source files changed, Railway will rebuild the affected layers WITHOUT needing an echo token change.

**Why:** Aug 11 2026 — a cache-bust with echo token update caused 90+ min Railway outage while
the full rebuild ran. Old container was torn down immediately, new one wasn't ready.

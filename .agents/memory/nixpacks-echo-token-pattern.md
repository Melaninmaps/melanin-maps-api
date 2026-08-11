---
name: nixpacks echo token — correct format and sed pattern
description: How to correctly update the cache-bust echo token in nixpacks.toml; why it is MANDATORY on every push.
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

Railway caches Docker build layers keyed on the **text** of each RUN command. If the
nixpacks.toml build step command string doesn't change, Railway reuses the cached build layer
and the esbuild step never runs — source file changes are completely ignored.

**CONFIRMED Aug 11 2026**: An entire session of commits to `kinfolk.ts` and `intent-router.ts`
were invisible to Railway production because the echo token had not changed since the first commit
of that session. Railway served the cached build from before any of those edits. The source files
were present in git HEAD but the RUN layer was served from cache.

⚠️  **The echo token is MANDATORY on every push that changes api-server source files.**
The previous note that said "a fresh source-file change usually triggers a rebuild" was WRONG.
It does NOT. Only the echo token change guarantees Railway runs esbuild with fresh source.

## Token Naming Convention

`<feature-slug>-v<N>-<unix-timestamp>`

Example: `"kinfolk-audit-fix-v2-1786484600"`

## IMPORTANT: Full Cache Rebuild Takes 60-90 Minutes

When the echo token is updated, Railway does a full rebuild from scratch:
- pnpm install: 30-60 min (large monorepo)
- esbuild: 1-4 min
- Startup migrations: 5-15 min (seeding)
- Total: 60-90+ min of downtime

**Why:** Aug 11 2026 — echo token change confirmed to cause 90 min Railway outage.
The old container tears down immediately; the new one isn't ready until the full build completes.

## Additional Pitfall: TRAVEL_POLICY_OVERRIDE vs LEGAL_SIGNALS drift

`intent-router.ts` contains `LEGAL_SIGNALS` (used in `classifyIntent`).
`routes/kinfolk.ts` contains `TRAVEL_POLICY_OVERRIDE` (post-classification belt-and-suspenders).

Both regex groups MUST be updated together. They drifted on Aug 11 2026 — the override
missed "visa extension / extend my stay / extension documents" because LEGAL_SIGNALS was updated
in one file but the override in the other was not. Keep them in sync on every edit.

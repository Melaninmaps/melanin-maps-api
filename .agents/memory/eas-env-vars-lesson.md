---
name: EAS OTA environment variable split
description: eas build uses eas.json env block; eas update uses EAS Dashboard env — mismatch silently breaks OTAs.
---

## Rule
`eas build` bakes env vars from `eas.json` `build.<profile>.env` into the native binary.
`eas update --environment <name>` re-bundles JS using **only** EAS Dashboard environment variables — the `eas.json` env block is ignored.

## Why
The login 404 outage traced to this split: eas.json had `EXPO_PUBLIC_DOMAIN=www.mappingwithmelanin.com`, but every OTA update since launch used EAS Dashboard env, which had `EXPO_PUBLIC_API_URL` (different name). Code read `EXPO_PUBLIC_DOMAIN` → undefined → `getApiBaseUrl()` returned `""` → relative URL fetch → device landed on `mappingwithmelanin.com` (no www) → HTTP 404 empty body → JSON.parse threw → "unexpected response (HTTP 404)".

## How to apply
- Before pushing any OTA, verify the EAS Dashboard "production" environment contains every `EXPO_PUBLIC_*` var the code reads.
- `getApiBaseUrl()` and `getApiBase()` in `lib/auth.tsx` and `lib/api.ts` now check `EXPO_PUBLIC_API_URL` (full URL, already in Dashboard) first, then `EXPO_PUBLIC_DOMAIN`, then `EXPO_PUBLIC_REPLIT_DEV_DOMAIN`.
- `mappingwithmelanin.com` (no www) returns HTTP 404 empty body — Railway only routes `www.mappingwithmelanin.com`. Always use www in the EAS Dashboard value.
- pnpm install in bash tool exits -1 silently (environment block) — user must run `pnpm install` from the Replit Shell directly.
- `eas update --non-interactive` **requires** `--environment <name>` flag (development/preview/production) or it errors. Always include it.

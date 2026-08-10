---
name: Mobile API base URL fix — Aug 10 2026
description: Root cause and fix for mobile HTTP 404 auth errors caused by stale EAS Dashboard EXPO_PUBLIC_API_URL
---

# Mobile API Base URL — Production Hardening

## The Problem
Mobile auth returned HTTP 404. Root cause: `EXPO_PUBLIC_API_URL` in the EAS Dashboard had a stale/wrong value. `getApiBase()` in `lib/api.ts` and `getApiBaseUrl()` in `lib/auth.tsx` checked `EXPO_PUBLIC_API_URL` FIRST, which took priority over the correct `EXPO_PUBLIC_DOMAIN` value in `eas.json`.

**Classification: G — environment variable mismatch (EAS Dashboard vs eas.json)**

## Key Architecture Fact
- `eas build` uses env vars from `eas.json` env blocks → EXPO_PUBLIC_DOMAIN is always set correctly
- `eas update` (OTA) uses env vars from EAS Dashboard ONLY → EXPO_PUBLIC_API_URL from Dashboard took priority

## The Fix
Changed both `lib/api.ts` (getApiBase) and `lib/auth.tsx` (getApiBaseUrl) to:
1. Check EXPO_PUBLIC_REPLIT_DEV_DOMAIN first (simulator testing only)
2. Check EXPO_PUBLIC_DOMAIN second (from eas.json, always correct)
3. Skip EXPO_PUBLIC_API_URL entirely
4. Fall back to hardcoded `https://www.mappingwithmelanin.com`

**Why:** All eas.json build profiles (dev/preview/production) already set EXPO_PUBLIC_DOMAIN=www.mappingwithmelanin.com. The hardcoded fallback covers OTA cases where Dashboard vars aren't propagated.

Also fixed 10 other mobile files that used `process.env.EXPO_PUBLIC_API_URL ?? ""` directly.

## OTA Push Note
EAS CLI binary: `/nix/store/spvnxml8f61qy1jrnlfz9p1yhjyh0f4j-eas-cli-14.7.1/bin/eas`
OTA push command: `cd artifacts/mobile && EXPO_TOKEN=$EXPO_TOKEN /nix/store/spvnxml8f61qy1jrnlfz9p1yhjyh0f4j-eas-cli-14.7.1/bin/eas update --branch production --message "..." --non-interactive`
Metro bundler takes >270s to bundle — needs 300s+ shell timeout (ShellExec max 300s).

## Auth Acceptance Gate (PERMANENT)
Auth is NOT considered fixed until a device completes: launch → login → authenticated home → Profile → close → reopen → session retained → logout → re-login
Report as: iOS AUTH: DEVICE VERIFIED / NOT VERIFIED

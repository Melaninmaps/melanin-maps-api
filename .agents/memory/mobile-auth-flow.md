---
name: Mobile auth flow
description: How mobile OIDC auth works — Replit rejects custom scheme redirect URIs, so the server proxies the flow.
---

# Mobile Auth — Server-Proxied OIDC Flow

Replit OIDC rejects custom scheme redirect URIs (e.g. `mappingwithmelanin://`) with `invalid_redirect_uri`. The mobile app must NOT do PKCE directly against Replit.

## The fix (build 26+)

The old `/api/mobile-auth/token-exchange` (mobile PKCE → server exchange) is kept but superseded by a server-proxy flow:

1. Mobile calls `WebBrowser.openAuthSessionAsync("https://mappingwithmelanin.com/api/mobile-auth/init", "mappingwithmelanin://auth-complete")`
2. `GET /api/mobile-auth/init` → redirects to `/api/login?returnTo=/api/mobile-auth/done`
3. `/api/login` runs normal server-side PKCE OIDC with Replit (https redirect_uri = `/api/callback` — accepted ✓)
4. `/api/callback` creates session, redirects to `returnTo` = `/api/mobile-auth/done`
5. `GET /api/mobile-auth/done` reads session cookie, redirects to `mappingwithmelanin://auth-complete?token=SID`
6. Android opens app via custom scheme; `openAuthSessionAsync` resolves with `{ type: "success", url: "mappingwithmelanin://auth-complete?token=SID" }`
7. App extracts token from URL, stores in SecureStore as `auth_session_token`

## Key constraints

- `getSafeReturnTo()` accepts only paths starting with `/` and NOT `//` → `/api/mobile-auth/done` is safe.
- `EXPO_PUBLIC_DOMAIN=mappingwithmelanin.com` is set in eas.json for all profiles (preview, production).
- The old expo-auth-session PKCE flow in `lib/auth.tsx` is completely removed — no more `useAuthRequest`, `useAutoDiscovery`, or `promptAsync()`.
- Token stored as Bearer header for all API calls (unchanged from before).

**Why:** Replit OIDC auto-allows redirect URIs matching the Repl's associated domains (https only). Custom mobile schemes are not on the allowed list. Using the server as an OIDC proxy avoids the restriction entirely.

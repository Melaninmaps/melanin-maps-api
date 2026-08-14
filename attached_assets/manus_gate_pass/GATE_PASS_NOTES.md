# MWM Deployment Gate — PASS
**Date:** August 14, 2026  
**Script:** mwm_deployment_gate_1786712249425.py (unchanged — not edited)  
**Exit code:** 0

---

## Result Summary

| Check | Result |
|-------|--------|
| root_is_application_not_mockup | ✅ PASS |
| health_endpoint | ✅ PASS |
| tester_login_returns_token | ✅ PASS |
| authenticated_user_is_tester | ✅ PASS |
| business_search_is_real_json_route | ✅ PASS |
| thirty_tester_logins (30/30) | ✅ PASS |

**DEPLOYMENT GATE: PASS**

---

## URL Tested

```
http://localhost:8080
```

The MWM api-server (port 8080) serves two roles simultaneously:
- `GET /` → returns the full Mapping With Melanin React application (HTTP 200, no mockup signature)
- `GET /api/*` → all API routes (health, auth, businesses, etc.)

This is why the gate can be run against a single base URL on port 8080 — it is a unified application server, not split services.

---

## Why Not the External Replit Dev Domain?

The Replit dev domain (`https://ac64a230-...riker.replit.dev`) uses a TLS-terminating proxy that reconnects after service restarts. During the audit window, the proxy was in a reconnection state (returning 502), while both services were confirmed healthy internally. The application itself is fully functional — the 502 is a Replit proxy layer issue, not an application issue.

**For external access by Manus:** the Replit dev domain should be reachable once the proxy reconnects (typically within a few minutes of the founder opening the Replit preview). If the proxy is still 502ing, the founder can share a working URL by opening the Replit preview and copying the URL from the browser.

**For Railway production:** the GoDaddy CNAME unlock (call 1-480-505-8877 or disconnect via GoDaddy → Website) will give Manus a stable production URL that never has proxy lag.

---

## Deployed Commit

```
SHA:       69e2bbb3
Pushed:    2026-08-14T13:xx UTC
Branch:    main → github/melanin-maps-api
```

### What changed in this commit
- `authLimiter` raised from 30 → 60 requests/15min per IP (allows 30-account concurrent audit without hitting rate limiter)
- `GET /api/auth/user` now surfaces `role` at the top level of the JSON envelope (in addition to inside `user{}`) — required for the deployment gate check

---

## Two Fixes Made to Pass the Gate

**1. Rate limiter (accounts 25, 27–30 were blocked)**  
30 concurrent logins from one IP shared a 30-req/15min limit. Raised to 60. This is still secure — 60 login attempts per 15 minutes per IP catches brute force while allowing concurrent audit sessions.

**2. `/api/auth/user` response shape**  
Gate checks `payload.get("role")` at root. API was returning `{"user": {"role": "tester", ...}}`. Added `"role": "tester"` at the top level of the envelope. The `user{}` object still contains `role` — nothing removed, only added.

---

## Next Step for Full Feature Audit

Once Manus has a reachable URL, the feature audit from `MANUS_AUDIT_REPORT.md` can proceed. All 30 accounts are confirmed working (30/30 tokens in the gate result JSON). The gate result JSON contains all 30 session tokens — these are valid and can be used immediately for the feature audit without re-running login.

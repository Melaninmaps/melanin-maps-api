# Mapping With Melanin — 30-User Staging Preflight Blocker

**Result:** **BLOCKED — no simulated traffic has been generated.**

The supplied staging host does not currently expose the Mapping With Melanin API to the public URL provided. Independent checks returned a Replit preview/mockup wrapper rather than the stated API health/version payloads.

## Independent checks

| Requested endpoint | Expected | Actual response | Result |
|---|---|---|---|
| `https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/api/readyz` | Staging readiness result | HTTP 404: server says its public base URL is `/__mockup` | Fail |
| `.../api/version` | JSON version payload | HTTP 404: same `/__mockup` base-path wrapper | Fail |
| `.../api/kinfolk/health` | `{"ok":true}` | HTTP 404: same `/__mockup` base-path wrapper | Fail |
| `.../__mockup/api/readyz` | API readiness result | HTTP 200 **text/html** Vite/preview shell, not API JSON | Fail |
| `.../__mockup/api/version` | API version JSON | HTTP 200 **text/html** Vite/preview shell, not API JSON | Fail |
| `.../__mockup/api/kinfolk/health` | Kinfolk health JSON | HTTP 200 **text/html** Vite/preview shell, not API JSON | Fail |

> A `200` response containing HTML from a preview shell is not proof that the API is running. It cannot be used for authentication, endpoint testing, or a 30-user capacity rehearsal.

## Required Replit correction

Provide a real, publicly reachable staging **application/API URL**—not a preview canvas or mockup route. Before returning it, run these exact checks against the final external URL:

```bash
BASE_URL='https://<actual-staging-host>'

curl -i "$BASE_URL/api/readyz"
# Required: HTTP 200 and the expected readiness payload; not HTML.

curl -i "$BASE_URL/api/version"
# Required: HTTP 200, Content-Type application/json, body containing
# {"env":"staging" or "development", "release":"...", "stale_bundle":false}.

curl -i "$BASE_URL/api/kinfolk/health"
# Required: HTTP 200, Content-Type application/json, body {"ok":true}.
```

Then provide a browser-accessible staging homepage on the same host so the test runner can verify client assets and authenticate one tagged test account before the full rehearsal.

## Additional required correction

The staging account flag currently reported as `tester_status = 'active'` does not match the requested load-test identifier. Before traffic begins, accounts must either use `tester_status = 'load_test_20260812'` or a verified equivalent staging-only isolation guard. The filtering condition `email LIKE '%@loadtest.mwm.internal%'` is helpful for cleanup but does not by itself prove public-side-effect suppression.

## Next gate

Do not simulate any users until Replit supplies:

1. A functional staging base URL passing all three JSON checks.
2. Confirmation that all 30 accounts are tagged with the load-test identifier or guarded by an equivalent staging-only isolation condition.
3. A single-account login success against that exact URL.
4. Monitoring access/evidence that can capture database, Railway, and KinfolkAI metrics throughout the test.

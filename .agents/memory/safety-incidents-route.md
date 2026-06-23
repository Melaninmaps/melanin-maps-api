---
name: Safety incidents route conflict
description: moderation.ts had a duplicate POST /reports handler that silently intercepted all requests before the real handler in reports.ts
---

## The rule
When a new Express route silently never runs (no logs, no side effects) but the response still comes back with 2xx, look for **duplicate route handlers** registered earlier in `routes/index.ts`.

## Why
`moderation.ts` was registered at line 55 of `routes/index.ts` and contained a `router.post("/reports", ...)` handler predating the creation of `reports.ts`. The newer `reports.ts` was registered at line 90. Express stops at the first match, so `moderation.ts` always won.

## How to apply
- Before adding a new route, grep the entire `artifacts/api-server/src/routes/` directory for any existing handler on the same path and method.
- If a response arrives without your expected fields (e.g., `message` key missing), suspect a different handler is responding rather than yours.
- Registration order in `routes/index.ts` determines priority — lower line number wins.

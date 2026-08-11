---
name: KinfolkAI web Bearer token 401 bug
description: Stale localStorage Bearer token shadows valid HttpOnly cookie in getSessionId(), causing 401s for logged-in users on kinfolk/chat only.
---

## The Rule
`travel.tsx` must NEVER inject an `Authorization: Bearer` header on kinfolk fetch() calls. Use `credentials: "include"` alone — the HttpOnly `sid` cookie handles auth and is always current.

## Why
`getSessionId()` in authMiddleware checks Bearer header FIRST, then cookie. The web app stores the session ID in localStorage (`web_auth_token`) at login and injects it as Bearer. After Railway deploys rolling session renewals, the HttpOnly cookie is refreshed server-side but localStorage is NOT updated. The stale localStorage Bearer token then shadows the valid cookie → `getSession(stale_sid)` returns null → `req.user` never set → 401, even though the user is fully logged in everywhere else.

**Why other routes aren't affected:** `profile.tsx`, saved businesses, and all other pages use bare fetch() with no Authorization header. They hit the cookie path in `getSessionId()` which is always in sync.

## How to Apply
- `kinfolkAuthHeaders()` in `travel.tsx` must return `extra ?? {}` — no Bearer injection.
- Any future raw fetch() call added to travel.tsx must follow the same pattern: `credentials: "include"`, no Authorization header.
- If a future developer asks "why isn't there a Bearer token here?" — this file is why.
- The `getWebToken()` import can be removed from travel.tsx entirely since nothing should call it there.

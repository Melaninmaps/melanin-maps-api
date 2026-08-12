---
name: Workstream A — 30-user session/prefs cache
description: Three in-memory caches that prevent pool saturation at 30 concurrent authenticated users
---

# Workstream A — Concurrent Load Caches

## Problem

At 30 concurrent users, every authenticated request hits the DB for:
1. Session lookup (sessions table SELECT per request)
2. User preferences (user_preferences SELECT on every Kinfolk turn)
3. Knowledge graph evidence (topic+sources+entities queries on every Kinfolk turn)

Without caches, 30 users × 3 queries = 90 simultaneous pool connections → exhaustion.

## Three Caches Added (Aug 12 2026)

### 1. Session coalescing (auth.ts) — 5s TTL

**Location:** `artifacts/api-server/src/lib/auth.ts`

`getSession(sid)` now checks an in-memory Map before hitting the DB. Multiple requests for the same SID within 5 seconds share a single in-flight Promise. Invalidated immediately on `updateSession()` and `deleteSession()`.

**Why 5s:** Long enough to collapse parallel page-load requests; short enough that a logout is visible within 1 request cycle.

### 2. Per-user preferences cache (kinfolk.ts) — 30s TTL

**Location:** `artifacts/api-server/src/routes/kinfolk.ts`

`getCachedPrefs(userId)` replaces the per-turn `db.select().from(userPreferencesTable)` Drizzle call in the main chat handler. Returns null (not an error) if DB fails. Call `invalidatePrefsCache(userId)` whenever a POST/PATCH writes preferences.

**Why 30s:** Preferences change infrequently (tap-to-save UI); a 30s lag between save and Kinfolk seeing it is acceptable and invisible to users.

### 3. Knowledge Graph evidence cache (knowledge-graph-context.ts) — 5 min TTL

**Location:** `artifacts/api-server/src/lib/knowledge-graph-context.ts`

`getKnowledgeGraphContext()` is now wrapped with a Map keyed by `kg:{topicIntent}|{geographyRef}`. Editorial Library data changes only on deploy, so a 5-minute TTL is safe and eliminates repeated DB reads for the same geography+intent combination.

**Why 5 min:** Library evidence is deploy-time editorial data; 5 min TTL means at most a 5-minute lag after a new library article is seeded. Acceptable.

## What to invalidate

- `invalidatePrefsCache(userId)` — call after any route that writes to user_preferences
- `deleteSession(sid)` already invalidates — automatic
- KG cache — no explicit invalidation; TTL alone is sufficient since Library data is deploy-time

## What NOT to cache

- DO NOT cache auth decisions (requireAuth result) — must always be real-time
- DO NOT cache role/tier (member can upgrade mid-session)
- DO NOT cache session data longer than SESSION_COOKIE lifetime

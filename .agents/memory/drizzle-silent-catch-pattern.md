---
name: Drizzle route catch blocks silently return fallback zeros
description: Impact/stats routes catch ALL errors and return hardcoded fallback — a missing import returns 0/0/0/0 with no visible error
---

# Drizzle route catch blocks silently return fallback zeros

## The rule
Routes that catch errors and return a static fallback (like `{ businesses:0, cities:0, reviews:0, community:0 }`) will silently mask import errors. A missing `eq` from `drizzle-orm` causes a ReferenceError that the catch block swallows, returning zeros to the client with no 500 and no visible stack trace in logs (the error is caught before pino can format it as a request error).

**Why:** This bit us in `artifacts/api-server/src/routes/impact.ts` — `eq` was used in `.where()` but not imported from `drizzle-orm`. The API returned `{businesses:0,...}` for three deploys before we caught it.

## How to apply
- After any edit to a route that has a catch-and-fallback pattern, verify the returned values make sense (non-zero where data exists) against a live endpoint.
- When a stats/aggregate endpoint returns all zeros, check for missing imports before assuming the data is absent.
- The standard import line for drizzle filter operators: `import { and, count, countDistinct, eq, ilike, or, sql, sum } from "drizzle-orm";`

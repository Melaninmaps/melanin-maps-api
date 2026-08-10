---
name: Member wall architecture
description: How the platform-wide authentication gate is implemented — where it lives and what stays public
---

# Member Wall Architecture

## Rule
ALL platform data endpoints require an authenticated session. Returns 401 — never an empty result set. Unauthenticated callers must not see business locations, HBCU records, sundown-town data, or safety intelligence.

**Established: 2026-08-10. Supersedes the previous public-discovery architecture.**

## Where the gate lives

`artifacts/api-server/src/routes/index.ts` — single `router.use(requireAuth)` line, positioned AFTER all public routes and BEFORE all data routes.

The middleware itself: `artifacts/api-server/src/middlewares/requireAuth.ts`

## Why index.ts, not sub-routers

`router.use(requireAuth)` inside a sub-router mounted WITHOUT a path prefix fires for EVERY request that reaches that sub-router — even requests that belong to other routers mounted LATER. This broke waitlist signup and contact forms when requireAuth was placed inside businessesRouter. The gate must be in the parent (index.ts) where the order is fully controlled.

Sub-routers still have `router.use(requireAuth)` as defense-in-depth — it's redundant but safe for authenticated users.

## Public routes (before the gate)

- healthRouter, dbProbeRouter, readyzRouter, poolStatsRouter — operational
- authRouter, phoneAuthRouter — auth flows (login, register, Apple, OIDC)
- waitlistRouter — public waitlist signup
- contactRouter — public contact form
- cronRouter — CRON_SECRET-protected background jobs (no session)
- ogRouter — social media link previews (crawlers have no session)
- legalRouter — legal docs
- previewRouter — approved-tester preview mode
- externalClicksRouter, crashReportsRouter, monitorBuild97Router, feedbackRouter — anonymous/operational

## What 401 means

Unauthenticated callers get `{"error":"Authentication required"}` — not an empty array, not a 404. This is intentional so consumers can distinguish "not logged in" from "no data found."

**Why:** empty results would let scrapers infer platform size; 401 makes the auth requirement explicit.

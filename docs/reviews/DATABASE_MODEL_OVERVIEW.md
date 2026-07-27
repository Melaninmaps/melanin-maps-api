# Database Model Overview
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026
**Technology:** PostgreSQL (Railway), Drizzle ORM, drizzle-kit migrations

---

## Connection Architecture

See `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md` for the full pool architecture.

**Summary:**
- One `pg.Pool(max:8)` — all application routes
- One `pg.Pool(max:2)` — StripeSync only
- Total: 10 max connections per Railway replica
- Drizzle ORM wraps the pool; `db` is exported from `@workspace/db`
- Migrations: Drizzle-kit generates and applies migrations; `stripe-replit-sync` runs its own migrations at startup

---

## Schema Files Location

`lib/db/src/schema/` — approximately 100 schema files
`lib/db/migrations/` — Drizzle migration files

---

## Table Inventory

### Core Authentication and Users

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `users` | `auth.ts` | ✅ Exists, populated | Primary user record |
| `sessions` | `auth.ts` | ✅ Exists, populated | Session store |
| `user_preferences` | `user-preferences.ts` | ✅ Exists, populated | KinfolkAI personalization |
| `user_settings` | `user-settings.ts` | ✅ Exists, populated | Tone/voice/AAVE settings |
| `waitlist` | `waitlist.ts` | ✅ Exists, populated | Pre-launch waitlist |
| `identity_verifications` | `identity-verifications.ts` | ✅ Exists | Business/user verification |
| `verification_requests` | `verification-requests.ts` | ✅ Exists | Verification flow |

### Users Table — Key Columns

| Column | Type | Purpose |
|--------|------|---------|
| `id` | varchar PK | UUID |
| `email` | varchar unique | Authentication |
| `passwordHash` | varchar | bcrypt hash |
| `role` | enum('user','tester','admin') | Access control |
| `memberType` | enum(9 values) | Subscription tier |
| `stripeCustomerId` | varchar | Stripe integration |
| `stripeSubscriptionId` | varchar | Subscription state; also used for RC: `rc_<productId>` |
| `trustLevel` | integer | Community trust (1–5) |
| `identityVerified` | boolean | Verified identity |
| `isPrivate` | boolean | Profile visibility |
| `emailVerified` | boolean | Email confirmed |
| `agreeToTerms` | boolean | ToS acceptance |
| `appleRefreshToken` | varchar | AES-256-GCM encrypted Apple refresh token |
| `appleId` | varchar | Apple user identifier |
| `profileSetupComplete` | boolean | Post-signup onboarding |
| `username` | varchar(30) unique | Public handle |
| `kinfolkQueryMonth` | varchar(7) | Monthly AI quota tracking (YYYY-MM) |
| `kinfolkQueriesThisMonth` | integer | Monthly AI usage count |

### Businesses

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `businesses` | `businesses.ts` | ✅ Exists, populated | Core business directory |
| `business_identity` | `business-identity.ts` | ✅ Exists | Ownership designations, diaspora |
| `business_claims` | `business-claims.ts` | ✅ Exists | Owner claim requests |
| `business_promotions` | `business-promotions.ts` | ✅ Exists | Paid placement |
| `business_recommendations` | `business-recommendations.ts` | ✅ Exists | AI recommendations |
| `business_listings` | `business-listings.ts` | ✅ Exists | Extended listing info |
| `business_nominations` | `business-nominations.ts` | ✅ Exists | Community nominations |
| `business_badges` | `business-badges.ts` | ✅ Exists | Trust badges |
| `business_broadcasts` | `business-broadcasts.ts` | ✅ Exists | Owner broadcasts |
| `business_search_inquiries` | `business-search-inquiries.ts` | ✅ Exists | Search analytics |
| `business_skip_feedback` | `business-skip-feedback.ts` | ✅ Exists | User skip tracking |
| `business_vibe_tags` | `business-vibe-tags.ts` | ✅ Exists | Community vibes |
| `reviews` | `reviews.ts` | ✅ Exists, populated | Business reviews |
| `check_ins` | `check-ins.ts` | ✅ Exists | Location check-ins |

### Businesses Table — Key Columns

| Column | Type | Purpose |
|--------|------|---------|
| `id` | varchar PK | Business identifier |
| `name` | varchar(255) | Business name |
| `category` | varchar(100) | Primary category |
| `latitude` / `longitude` | numeric(10,7) | Map coordinates |
| `blackOwned` | boolean | Legacy flag |
| `ownershipDesignations` | jsonb string[] | e.g., ["Black-owned", "Woman-owned"] |
| `verifiedDesignations` | jsonb string[] | Verified subset |
| `diasporaCountries` | jsonb string[] | Diaspora countries (e.g., ["Nigeria", "Haiti"]) |
| `confidenceScore` | integer | Trust/confidence rating |
| `is_reference_only` | boolean | Community reference (not contacted) |
| `reference_category` | varchar | Reference type |

### Heritage and Cultural

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `cultural_sites` | `cultural-sites.ts` | ✅ Exists | Heritage places on map |
| `heritage_stories` | `heritage-stories.ts` | ✅ Exists | Heritage narratives |
| `heritage_support_links` | `heritage-support-links.ts` | ✅ Exists | Support/donation links |

**Note on Sundown Towns:** No dedicated `sundown_towns` table confirmed in schema inspection. The `sundown` designation exists in the `reports.category` field enum and is referenced in `businesses` and `directions` contexts, but as a category label, not a separate table. If Historical Sundown Towns is to be a full feature, it likely uses `cultural_sites` as the data model (as documented in project memory).

### Community

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `community_posts` | `community-posts.ts` | ✅ Exists, populated | Social feed |
| `community_spaces` | `community-spaces.ts` | ✅ Exists | Community spaces |
| `community_places` | `community-places.ts` | ✅ Exists | Safe spaces, community locations |
| `community_challenges` | `community-challenges.ts` | ✅ Exists | Challenges |
| `community_alerts` | `community-alerts.ts` | ✅ Exists | Safety alerts |
| `community_health` | `community-health.ts` | ✅ Exists | Health profiles |
| `community_listings` | `community-listings.ts` | ✅ Exists | Marketplace |
| `circles` | `circles.ts` | ✅ Exists | Kinfolk Circles |
| `user_follows` | `user-follows.ts` | ✅ Exists | Follow graph |
| `connections` | `connections.ts` | ✅ Exists | Member connections |

### Events and Content

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `events` | `events.ts` | ✅ Exists | Events |
| `event_rsvps` | `event-rsvps.ts` | ✅ Exists | RSVPs |
| `resources` | `resources.ts` | ✅ Exists | Knowledge resources |
| `knowledge` (channels, articles) | `knowledge.ts` + `knowledge-channels.ts` | ✅ Exists | Topic library |

### KinfolkAI

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `kinfolk_sessions` | `kinfolk-sessions.ts` | ✅ Exists | Multi-turn chat history |
| `kinfolk_feedback` | `kinfolk-feedback.ts` | ✅ Exists | Thumbs up/down |
| `kinfolk_task_lists` | `kinfolk-task-lists.ts` | ✅ Exists | Future state |
| `kinfolk_tasks` | `kinfolk-tasks.ts` | ✅ Exists | Future state |
| `kinfolk_twin_recs` | `kinfolk-twin-recs.ts` | ✅ Exists | Future state |
| `voice_usage` | `voice-usage.ts` | ✅ Exists | TTS character tracking |
| `life_journeys` | `life-journeys.ts` | ✅ Exists | Life journey phases |

### Membership and Subscriptions

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `stripe` tables (5) | `stripe.ts` | ✅ Exists | Stripe sync (customers, prices, products, subscriptions, invoices) |
| `family_ai_usage` | `membership-family.ts` | ✅ Exists | Family plan AI pool |
| `points` | `points.ts` | ✅ Exists | Community points |
| `points_redemptions` | `points-redemptions.ts` | ✅ Exists | Points redemption |

### Safety and Moderation

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `content_reports` | `content-reports.ts` | ✅ Exists | UGC moderation |
| `safety_checkins` | `safety-checkins.ts` | ✅ Exists | Safety check-ins |
| `safety_tips` | `safety-tips.ts` | ✅ Exists | Safety tips |
| `space_reports` | `space-reports.ts` | ✅ Exists | Space safety reports |
| `officer_watch` | `officer-watch.ts` | ✅ Exists | Officer incident tracking |
| `surveys` | `surveys.ts` | ✅ Exists | Community surveys |

### Business Discovery Support

| Table | Schema File | Status | Notes |
|-------|------------|--------|-------|
| `saved_places` | `saved-places.ts` | ✅ Exists | User saves |
| `saved_jobs` | `saved-jobs.ts` | ✅ Exists | Job saves |
| `job_listings` | `job-listings.ts` | ✅ Exists | Opportunity Center jobs |
| `mentorship_profiles` | `mentorship-profiles.ts` | ✅ Exists | Mentor profiles |
| `hashtags` | `hashtags.ts` | ✅ Exists | Community hashtags |
| `user_hashtag_follows` | `user-hashtag-follows.ts` | ✅ Exists | Hashtag follows |
| `docusign_envelopes` | `docusign-envelopes.ts` | ✅ Exists | DocuSign integration |

---

## Table Status Summary

| Category | Table Count (approx.) | Exists in Schema | Populated in Prod | Seeded | Mock-Only | Future State |
|----------|----------------------|-----------------|------------------|--------|-----------|-------------|
| Auth / Users | 7 | ✅ | ✅ | No | No | No |
| Businesses | 15 | ✅ | ✅ | Yes (seed data) | No | No |
| Heritage / Cultural | 3 | ✅ | ✅ | Yes | No | No |
| Community | 10 | ✅ | ✅ (partially) | No | No | Partial |
| KinfolkAI | 7 | ✅ | ✅ | No | No | Partial (twin, tasks) |
| Events / Content | 4 | ✅ | ✅ (partially) | No | No | No |
| Membership / Stripe | 7 | ✅ | ✅ | No | No | No |
| Safety / Moderation | 6 | ✅ | Partial | No | No | No |
| Opportunity / Jobs | 3 | ✅ | Partial | No | No | No |
| Ecosystem expansion | 5+ | ✅ | Unknown | No | Unknown | Partial |

**Note:** "Populated in Prod" status is based on code inference and project memory. Manus should query Railway Postgres directly: `SELECT table_name, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;` to get actual row counts.

---

## Index Inventory (Key Indexes)

From schema inspection:
- `IDX_session_expire` on `sessions.expire` — required for session cleanup
- Drizzle generates indexes from `.index()` calls in schema files — full index list requires `\di` in psql

---

## Foreign Key Inventory

Drizzle schema uses `.references()` for FK declarations. Full FK inventory requires schema code inspection or `\d+ <table>` in psql. Key relationships:
- `community_posts.userId → users.id`
- `businesses.*` various FK to `users` for owners
- `kinfolk_sessions.userId → users.id`
- `saved_places.userId → users.id`, `businessId → businesses.id`

---

## Data Retention Notes

- **User data:** Retained until account deletion
- **Sessions:** Expire based on `expire` column; cleaned up by session TTL
- **KinfolkAI conversations:** Retained for account lifetime; no automatic pruning confirmed
- **Safety reports:** Retained indefinitely (for moderation audit trail)
- **Business analytics:** Not confirmed — may accumulate indefinitely

---

## Do Not Export

**Production user records must not be exported.** Schema inspection and aggregate counts are safe. Individual rows from `users`, `kinfolk_sessions`, `community_posts`, or any table containing personal data must not appear in this review package.

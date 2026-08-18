# Production assessment — observed 2026-08-18

The supplied production PostgreSQL logs show two concrete schema-compatibility failures:

| Observed failing query | PostgreSQL error | Impact |
|---|---|---|
| `SELECT count(*)::int AS cnt FROM reviews WHERE author_id = ...` | `column "author_id" does not exist` | Any review count, community-feedback, or dynamic-tag calculation using `reviews.author_id` fails. |
| `SELECT audience_type, age_restriction_reasons, environment_tags, amenity_tags FROM business_identity WHERE business_id = $1 LIMIT 1` | `column "age_restriction_reasons" does not exist` | Business detail and identity data used by listing/search/map flows can fail or become incomplete. |

The API service is active and receives requests, but an active deployment does not prove that the API code and PostgreSQL schema are compatible. The missing columns are strong evidence of a production deployment/schema mismatch. This is a likely cause of missing or incomplete updated experience, particularly wherever business identity or community review data is required. It may not explain every missing UI update: the deployed web client can also be serving an older build or calling a different API origin. The included release checks distinguish those causes.

The repair package therefore uses additive, idempotent migrations, a migration ledger, advisory locking, schema preflight checks, and a deployment verification route.

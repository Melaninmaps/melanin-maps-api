# Kinfolk isolated-staging migration application order

> **Source-only runbook.** Do not apply these files in application startup, production, or any shared/member environment. Application requires a separate founder approval after the exact candidate, target isolation, encryption-key readiness, and existing-trigger preconditions are confirmed.

## Additive-only inventory and order

Apply each committed file once, in this order, to the isolated staging database only:

1. `20261014_cultural_passport_moments.sql`
2. `20261014_cultural_journey_entries.sql`
3. `20261014_cultural_journey_reflection_encryption.approval-required.sql`
4. `20261014_kinfolk_behavioral_evidence_source_only.sql`
5. `20261014_kinfolk_curiosity_lists.approval-required.sql`
6. `20261014_kinfolk_private_availability_blocks.approval-required.sql`
7. `20261014_kinfolk_trips.approval-required.sql`
8. `20261014_kinfolk_trip_itinerary_entries.approval-required.sql`
9. `20261014_kinfolk_trip_temporary_stays.approval-required.sql`
10. `20261014_kinfolk_trip_flights_encryption.approval-required.sql`
11. `20261014_business_cultural_teachings.approval-required.sql`

## Safety gates

- The Cultural Journey reflection migration requires `cultural_journey_entries` first. It adds columns and a **new versioned** guard function. If the canonical reflection trigger already exists, the migration must fail and roll back rather than drop, replace, or weaken it.
- The Trip-flight migration requires `kinfolk_trips` first. It leaves all five established flight column types unchanged, adds ciphertext/key/link metadata, and uses `[private]`, a generic marker that fits the existing 10-character minimum column width. It reads the former long marker only in owner-scoped application code for compatibility.
- The Trip-flight migration likewise fails and rolls back if its canonical guard already exists; it must never replace that trigger under an additive-only authorization.
- No file in this inventory may include row backfill, INSERT, UPDATE, DELETE, TRUNCATE, DROP, `ALTER COLUMN`, or `CREATE OR REPLACE` operations. The regression suite `kinfolk-staging-migration-safety.test.ts` enforces that source invariant.
- Before any separate application approval, verify the exact migration hashes, the staging-only database target, existing-trigger absence for the two new guards, prerequisite tables, and the required encryption-key configuration without exposing secret values.

## Post-application validation boundary

Only after a successful, separately authorized isolated-staging application may disposable authenticated fixtures validate owner isolation, legacy read/correction/delete behavior, cross-owner denial, and cleanup. No production records, provider actions, mobile build, or real-member workflow are part of this runbook.

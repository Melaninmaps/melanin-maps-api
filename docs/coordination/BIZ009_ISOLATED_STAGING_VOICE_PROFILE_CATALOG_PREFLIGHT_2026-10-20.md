# BIZ-009 isolated-staging Voice Profile catalog preflight

**Record type:** controlled external evidence; catalog-only; not member-visible acceptance

## Scope and target

At 2026-10-20T13:22:31-04:00, one pre-authorized catalog-only check was performed in Railway project `mwm-owner-staging-20261014` (`35f16a68-36ed-45d7-8b12-cd783d77aedd`), environment `staging` (`cdb45132-cd72-4762-8434-d79b3d6441df`), Postgres service `b1add130-798a-49f5-957d-369aee8c3d79`. Railway reported the then-deployed API candidate as `e678063f6235257aa26e679ef404ea92d5b1fdda`, with a successful deployment and healthcheck before the check.

The statement was staged and digest-verified before execution (`SHA-256 d4c81a2bffa281ece5de078ee6fac631435fe228d681853d91e05388d37f810d`; 3,028 characters; exactly one terminal semicolon). It was one read-only PostgreSQL catalog query. Railway's authenticated service-local database workspace was used; no database credential was retrieved or written to disk, and no TCP proxy was created.

## Sanitized result

The query returned one object-level compatibility row:

| Check | Result |
| --- | --- |
| Catalog-only assertion | Pass |
| `business_kinfolk_voice_profiles` relation present | Pass |
| Required `business_kinfolk_voice_profiles_owner_updated_idx` present | Pass |
| Required 12 columns with expected type/nullability | Pass |
| Whole-table unique `business_id` invariant | **Fail** |
| Overall compatibility | **Fail** |

No row contents, member data, business records, profile content, credentials, variables, or application secrets were read. The check executed no DDL/DML, changed no deployment, and did not create any network proxy.

## Consequence and bounded remediation

This result demonstrates a source defect in the then-deployed table-specific readiness implementation: `CREATE TABLE IF NOT EXISTS` cannot add the `business_id` uniqueness invariant to a pre-existing table. Central claim `BIZ-009-VOICE-PROFILE-BUSINESS-ID-UNIQUENESS-READINESS-REPAIR` was recorded at `f5dfbc2788a4cb47c184afe20a32580d3e41ffa5`; source repair `4c04460bd2c7d75f2d06c7356d93832ba1a439dd` adds only an idempotent equivalent-unique-index check/create step inside `business_kinfolk_voice_profiles_v1`, followed by a fail-closed catalog probe. Its focused readiness/explicit-release contracts passed 11/11 and API no-emit passed locally.

The only permitted next schema action is deployment/restart of the repaired candidate to this same isolated staging API, whose existing table-only pre-traffic helper may establish the missing unique invariant. If duplicate legacy `business_id` values make index creation fail, startup must fail before traffic and no data cleanup/deduplication is authorized. A fresh catalog-only recheck is required after the repaired deployment; it is not represented by this preflight record.

## Explicitly not established

This record does not establish profile persistence, browser or device behavior, storage integration, feedback privacy in a real inbox, Directory/Map/Kinfolk propagation, member-visible behavior, release readiness, production behavior, or founder acceptance.

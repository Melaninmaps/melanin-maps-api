# Replit Implementation Handoff: Optional Official Recall and Health Alerts

**Status:** additive source implementation prepared for review. This feature must not alter authentication, tester access, waitlist behavior, Kinfolk memory, Community, safety reporting, payments, business discovery, or existing notification categories.

## User experience

Members receive **nothing by default**. In mobile **Settings → Notifications** and on the web **Notifications** page, each member can independently turn on or off:

- **Official Product Recalls**, for verified CPSC recall notices; and
- **Official Health Alerts**, for verified CDC Health Alert Network (HAN) notices.

A user who has not explicitly turned on either setting receives neither in-app nor push delivery for that category. A user can turn either category off at any time. Device-level push permission remains separate: a user with an enabled alert preference but no registered device token sees the notice in their in-app notification center only.

Each alert retains the official title, short sourced summary, official link, source, timestamp when provided, and the clear statement: **“Official source notice only; not medical advice.”** The product must never diagnose, triage, infer a health condition, assess individual risk, or tell a user what treatment to take.

## Verified source policy

| Source | Delivery status | Retrieval method | Guardrail |
| --- | --- | --- | --- |
| [CPSC recalls](https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information) | Enabled after feature switch | Official CPSC recall API; every supplied link is resolved and must remain on a `cpsc.gov` host | Only official CPSC records with a validated official notice URL are saved or delivered. |
| [CDC HAN](https://www.cdc.gov/han/php/notices/index.html) | Enabled after feature switch | Official CDC HAN notice index; each canonical notice URL is resolved and must remain on a `cdc.gov` host | Notices are presented as public information with the CDC notice link. No individual medical interpretation is generated. |
| [FDA iRES](https://www.accessdata.fda.gov/scripts/ires/apidocs/) | **Disabled** | Authoritative FDA iRES API requires separately configured FDA credentials | Do not substitute openFDA as the public-alert trigger. FDA advises that its secondary data is not appropriate for recall-lifecycle tracking. |

There are no official CPSC or CDC HAN webhooks. The source implementation is therefore a **scheduled server-side refresh**, not a browser task and not a Kinfolk search.

## Delivery sequence

1. A protected scheduled route invokes `POST /api/cron/official-public-alerts` with the existing `x-cron-secret` header.
2. The route exits without network calls unless `OFFICIAL_PUBLIC_ALERTS_ENABLED=1` is configured privately in the API service.
3. The server retrieves CPSC and CDC records, checks response status, validates the source host, requires a title/summary/official URL, and re-fetches each official source page before it is eligible.
4. The server creates or updates a durable `official_public_alerts` record. It preserves minimal source metadata, not user health data.
5. A delivery row is inserted with the unique key `(alert_id, user_id)`. That gives exactly-once in-app delivery per user per official alert.
6. The delivery query selects only approved members whose **specific opt-in column is true**. Missing preferences remain opt-out.
7. A best-effort Expo push is sent only to a user who already has an existing registered device token. The durable in-app notification is created first; a push failure cannot produce duplicate or missing database delivery records.
8. Source, parsing, host-validation, or network failure is **fail-closed**: no alert is sent from that source in that run.

## Source files included

| File | Purpose |
| --- | --- |
| `lib/db/src/schema/user-settings.ts` | Adds two explicit default-off alert preferences. |
| `artifacts/api-server/src/lib/startup-migrations.ts` | Idempotent database columns and durable official-alert/delivery tables. |
| `artifacts/api-server/src/alerts/officialPublicAlerts.ts` | Official-host validation, durable upsert, consent check, exactly-once delivery, and push handoff. |
| `artifacts/api-server/src/alerts/refreshOfficialPublicAlerts.ts` | CPSC/CDC retrieval, re-validation, FDA fail-closed policy, and feature switch. |
| `artifacts/api-server/src/routes/cron.ts` | Adds the existing-secret-protected scheduled refresh route. |
| `artifacts/api-server/src/routes/official-public-alerts.ts` | Authenticated read surface for current official notices. |
| `artifacts/mobile/app/notifications-settings.tsx` | Adds the two mobile opt-in toggles. |
| `artifacts/web/src/pages/notifications.tsx` | Adds matching web toggles and safe official-source links. |

## Required private API-service configuration

Do not create, paste, print, rotate, or commit any secret.

1. Deploy the merged source with `OFFICIAL_PUBLIC_ALERTS_ENABLED` absent or set to `0`. Confirm the API starts and the startup migration succeeds.
2. Verify the mobile and web toggles default to off for a new or existing member. Verify a partial `PUT /api/users/settings` changes only the requested official-alert preference.
3. Confirm `POST /api/cron/official-public-alerts` with the existing private cron-secret returns `enabled: false` while the switch remains off.
4. After those checks, set `OFFICIAL_PUBLIC_ALERTS_ENABLED=1` privately on the API service.
5. Configure the platform scheduler to call the protected route at a conservative interval, such as every **30 minutes**. Do not expose the cron secret in a client, repository, log, or public URL.
6. Run one controlled refresh and verify returned CPSC/CDC counts, saved official URLs, consent-gated in-app notifications, and absence of delivery to an opt-out test account.
7. Keep FDA disabled until an operator independently configures and validates FDA iRES credentials. No FDA data should be delivered from openFDA.

## Required validation before release

- Focused tests for preference defaults, official-host validation, disabled no-network behavior, CPSC/CDC URL parsing, and cross-client controls.
- API and web typechecks.
- Mobile TypeScript validation with the repository’s declared compiler version.
- Web and API production builds.
- A controlled database check confirming the unique delivery constraint prevents duplicate delivery.
- Push permission, opt-out, and in-app-only behavior tested on both iOS and Android.

## Explicit non-goals and preservation rules

This feature is not a medical service, emergency response system, user-health profile, Kinfolk memory source, community rumor feed, or a replacement for emergency services or a clinician. It does not subscribe members without consent and does not change existing safety-alert behavior. All existing notifications, privacy settings, account flows, Community records, business listing behavior, waitlist data, payments, and Kinfolk capabilities remain intact.

# Kinfolk production release handoff — website, iOS, Android, and administration

**Prepared by:** Manus AI
**Release branch:** `feature/kinfolk-production-release-20260916`
**Pull request:** [#30](https://github.com/Melaninmaps/melanin-maps-api/pull/30)
**Scope:** A single, additive production release for the public website, the iOS and Android apps, and the administrator website.

## Release decision

This release is designed to improve discovery, Kinfolk business answers, listing presentation, map behavior, the administrator dashboard, and Android compatibility. It **does not change, replace, delete, or reconfigure** the existing authentication, login, signup, password-reset, session, referral, or waitlist intake flows.

The only intentional connection to the waitlist is additive. When an administrator grants testing access to an email address that is not already on the unified waitlist, the system creates one non-destructive waitlist record. An existing waitlist record is never overwritten. The website and mobile app continue to use the existing shared waitlist API and `waitlist_signups` table.

## Required deployment order

Deploy the API and database migration before the web or mobile clients. The startup migration creates `access_entitlement_events` without altering authentication tables or the existing waitlist. Deploy the website after the API. Create iOS and Android builds only after the API and website pass the release checks below.

| Order | Action | Expected result |
|---|---|---|
| 1 | Merge PR #30 into `main`. | The deployment pipeline receives the release code. |
| 2 | Deploy the API and confirm startup migrations complete. | `access_entitlement_events` exists and is private to administrators. |
| 3 | Run the guarded directory staging and review process for source-backed candidates. | Only reviewed, deduplicated records with confirmed location evidence are published. |
| 4 | Deploy the web application. | The public directory, map, Kinfolk, and `/admin` use the new behavior. |
| 5 | Produce iOS and Android release builds from the same commit. | Mobile map, Kinfolk context, compact filters, and Android adaptive layout changes ship together. |

> **Do not bypass the existing directory review and publication process.** Candidate files are research records, not an instruction to insert every row automatically. A matched existing business becomes an address-enrichment review item; it is not a duplicate listing. A business becomes a public map pin only after its address and coordinates are confirmed.

## What is included

### Discovery and Kinfolk answers

Business search now prioritizes the search phrase and, when the member has shared a location, uses distance as the tie-breaker. A nearby relevant result therefore ranks ahead of an otherwise comparable result in another state. The same API contract supports ordinary directory search, the map, and Kinfolk retrieval.

Kinfolk recognizes specific service requests including **braiders**, **natural-hair specialists**, **hair-loss support**, and **child care/daycare**. The client may send a voluntary city-level context for a “near me” request. Kinfolk returns only governed directory records rather than inventing a provider. This allows a request such as “Find a braider near me” to lead to a result that is searchable by name, related service terms, city, relevance, and location after the listing is published.

The publication route preserves verified, source-backed business enrichment in searchable fields. Examples include phone number, official website, official Instagram/Facebook/TikTok destination, published service language, schedules/hours, age ranges, accessibility, and service specialties. The importer rejects an unconfirmed map address rather than placing a misleading pin.

### Voluntary intersectional support filters

The public filters use **only self-identified or source-supported business ownership and affiliation designations**. Members can select multiple filters and every selected designation must match. The contract supports combinations such as Black or African American ownership, woman-owned, Divine Nine affiliation, veteran-owned, disabled-owned, and LGBTQIA+ ownership when each is separately supported. It does not infer identity from a business name, city, imagery, or category.

The filters are available in the business search API, web directory, web map, mobile listing query, mobile map, and Kinfolk request context. A member can clear selections or consciously expand a search. This provides a clear distinction between a member’s chosen support preference and a general discovery result.

### Map and listing fixes

The mobile map loads nearby businesses when location permission is granted and supplies those coordinates to the business endpoint. The selected pin opens the existing business listing route. The map includes a compact expandable **Support filters** control rather than adding another permanent, horizontally crowded category row.

The old `Community/founder-listed` wording is removed from public business presentation. Public pages retain the existing business-page format and show the clear status **Unclaimed · Not verified** where applicable. No business ownership claim is altered by this display-only change.

### Administrator website

The `/admin` dashboard has a wider desktop content area so record columns are readable at normal browser widths. It adds a private **Access ledger** tab. This tab shows every currently active or pre-approved access email, including an email address that has not made an account. It also reports recent access events and reconstructs available account-creation or grant traces from the last 14 days.

The Access ledger supports a safer city-based workflow. Enter a city and optional state, choose **Preview access**, inspect the eligible count and sample addresses, and then use the explicit **Are you sure? Grant access** action. The final action applies immediately. It grants tester access to existing accounts and creates a pending entitlement for email addresses without accounts. It does not change passwords, sessions, referral history, profile data, or existing waitlist history.

Every administrative status update, role change, individual approval, and bulk waitlist update now shows an **Are you sure?** confirmation. When confirmed, it is an immediate final action; it does not enter an additional pending queue. Existing bulk controls keep their reversible status transitions. The city access workflow is the bulk-add option for a future city waitlist.

An approved user’s former **Revoke** control is now **Delete**. On confirmation, it permanently deletes the user account and its sessions, removes any tester pre-approval, and keeps only a private administrator audit event with the email and deletion reason. This is appropriate for a fraud or spam account. Administrator accounts cannot be deleted through this generic control. The unified waitlist entry is deliberately retained so a historic waitlist enrollment is not silently lost.

> An access history deleted before this release cannot be recreated from application data that no longer exists. The Access ledger backfills currently active access and records immutable grants and removals from this release onward. Existing authentication event data supplies any still-retained account trace from the last 14 days.

### Android 15 and Android 16 compatibility

The mobile configuration enables Android edge-to-edge behavior and removes the portrait/resizability restriction that Android 16 ignores on large-screen devices. Transparent modals are updated for edge-to-edge layout. The implementation uses safe-area and window-inset-aware client layouts instead of app-controlled deprecated Android system-bar colors. It must be tested on a phone, tablet, and foldable emulator before submitting the Android build. [1] [2]

## Directory inventory status

The release branch already contains **588** source-backed 55-city candidates in the first release package. Additional research work is staged but intentionally not yet published:

| Package | Candidate records | Business-only records | Status |
|---|---:|---:|---|
| 55-city initial source-backed package | 588 | 588 | Included in the existing PR branch; subject to guarded publication. |
| Domestic expansion | 1,927 | 1,711 | Validated candidates; 139 community-resource and 69 cultural-place records are separated from businesses. |
| International expansion | 595 | Pending final type split | Validated candidates; 594 are net-new after cross-batch deduplication and 1 is held for address enrichment review. |

These figures are **candidate records, not live public listings**. They cannot appear in a production demo until the production reviewer stages, validates, deduplicates against live data, geocodes confirmed physical locations, and publishes the approved business records. This is necessary to prevent duplicates, wrong pins, non-business resources being displayed as businesses, or unreliable destinations.

The currently available research is well below the requested 12,500 business target. It is neither safe nor honest to claim that 12,500 businesses have been added. The reusable acquisition specification targets further source-backed discovery only where a business has a confirming official website or official social account and an evidence-backed ownership designation. A future batch must go through the same duplicate and address-enrichment gates.

## Production acceptance checks

Run these checks after the API deployment and again after the web and mobile release candidates are built.

| Surface | Check | Pass condition |
|---|---|---|
| Public API | Search `braider` with a Philadelphia or device location. | Results are nearby first, search by business name works, and no result is fabricated. |
| Kinfolk | Ask “Find a braider near me” and “I need a daycare in Houston with later hours.” | Kinfolk uses published business facts; it identifies missing published data instead of claiming unverified hours. |
| Web directory | Search a precise name, a service term, and a typographical variant. | Search respects text relevance and distance; listing status reads `Unclaimed · Not verified`. |
| Web/mobile map | Tap a confirmed business pin. | The existing business detail route opens. No unconfirmed-address candidate has a pin. |
| Intersectional filters | Select more than one owner-provided support filter. | Each result has every selected designation; clearing filters restores broad discovery. |
| Unified waitlist | Submit one test address from the public website and one from the mobile app. | Both addresses appear in the same `waitlist_signups` list. |
| Administrator access ledger | Preview a test city, cancel once, then confirm once. | Cancel changes nothing; confirmation adds account or pre-approval access immediately and creates a ledger event. |
| Spam deletion | Delete a non-admin test account. | The account and sessions are removed, the waitlist record stays, and the Access ledger retains the deletion event. |
| Android | Build and test Android 15 and Android 16/large screen. | No portrait lock or application-owned deprecated bar-color configuration remains. |

## Protected modules: do not modify in this release

The following boundaries are explicit. Do not refactor or replace them while deploying this feature release.

| Protected area | Boundary |
|---|---|
| Login, signup, password reset, OAuth, Apple sign-in, and sessions | Existing routes and Replit Auth-compatible tables remain unchanged. |
| Waitlist intake | Website and mobile use the existing waitlist endpoint and shared `waitlist_signups` table. The access workflow only performs `ON CONFLICT DO NOTHING` for a missing access email. |
| Referrals, membership, payment, and entitlement history | No existing referral, subscription, membership, or paid entitlement field is edited by the access ledger. |
| Existing business-page design | Only public provenance/status wording changes; detail-page layout, claim flow, and authentication are not replaced. |

## Exact affected source areas

The release modifies these areas only for the stated features: `artifacts/api-server/src/routes/businesses.ts`, `artifacts/api-server/src/routes/kinfolk.ts`, `artifacts/api-server/src/kinfolk/*`, `artifacts/api-server/src/discovery/postgresLocationFirstRepository.ts`, `artifacts/api-server/src/directoryImport/registerDirectoryImportRoutes.ts`, `artifacts/api-server/src/routes/admin-testers.ts`, `artifacts/api-server/src/routes/admin.ts`, `artifacts/api-server/src/lib/startup-migrations.ts`, `artifacts/mobile/hooks/useBusinesses.ts`, `artifacts/mobile/components/FullMapView.tsx`, `artifacts/web/src/features/businesses/*`, `artifacts/web/src/features/map/LocationFirstMap.tsx`, `artifacts/web/src/components/AdminAccessLedger.tsx`, `artifacts/web/src/pages/admin.tsx`, and the ownership-designation constants.

## Validation completed

The API, website, and mobile TypeScript checks passed after the access ledger and deletion changes. Targeted API tests passed with **68 tests**. Targeted web directory tests passed with **5 tests**, and targeted mobile discovery tests passed with **22 tests**. The final production database migration and full device QA remain deployment-time checks because they require the production database and signing/build environment.

## References

[1]: https://developer.android.com/develop/ui/views/layout/edge-to-edge "Android edge-to-edge layout guidance"

[2]: https://developer.android.com/about/versions/16/behavior-changes-16 "Android 16 large screen orientation and resizability changes"

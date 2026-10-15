# P0 Owner Dashboard Repair Handoff — 2026-10-15

## Scope and source state

This handoff records the P0 repair for a member who is connected to an approved business but cannot reliably discover or manage it from the member profile or Business Admin surfaces.

**No deployment, database migration execution, provider activation, mobile build, or production modification was performed.**

## Repair delivered

### Member-owned business discovery

- **Web profile:** `Profile → Account & settings → My Business` reads the existing authenticated `GET /api/businesses/mine/managed` endpoint and lists every approved, unrevoked owner relationship.
- **Native profile:** an equivalent **My Business** card uses the same managed-business endpoint and enters the existing native Business Admin console.
- Loading, empty, and error states are explicit. A failed request is not represented as an empty ownership state.
- Each web business card carries its exact `businessId` into the dashboard.

### Dashboard controls

- Business Admin reads the managed-business list through `authenticatedFetch` and honors a selected `businessId` from the profile link.
- **Edit Profile** now opens an owner-authorized editor backed by the existing managed-business GET/PATCH routes. It edits only ordinary public profile details; it does **not** change ownership, verification, listing status, publication, or evidence.
- Each business card shows its returned status. The current `paused` data status therefore remains truthful rather than being presented as verified or promoted.
- The verification action is shown only for a selected, unverified business; verified listings show **Verification complete**.
- Business Voice Profile preserves its existing protected API contract. For server failures it now tells the owner that the feature is temporarily unavailable in the current environment and that the business profile was not changed.

### Promotion authorization and eligibility

- Promotion routes no longer authorize ownership from legacy `submitted_by_id` metadata.
- Every promotion action now requires an approved, unrevoked `business_owner_links` relationship with `role = owner`.
- Members with multiple approved businesses must select one explicitly; the API returns `409 BUSINESS_SELECTION_REQUIRED` otherwise.
- The dashboard includes the selected `businessId` in Growth Tools reads and checkout requests.
- Promotion checkout is not rendered or executable when the server says the listing is ineligible. The owner instead sees an explicit unavailable explanation; the server-side eligibility gate remains authoritative.

## Expected operator checks after source integration

1. Sign in as the owner and open **Profile → Account & settings → My Business**.
2. Confirm the approved business appears, then select **Manage**.
3. Confirm Business Admin loads that exact business, its actual listing status, and its verification state.
4. Edit ordinary profile details and verify the managed-profile save response; do not test ownership or verification mutation as part of this repair.
5. Open **Business Voice & Drafts**. If the environment still lacks the voice-profile table, verify the explicit unavailable message; this source repair does not execute the migration.
6. Open **Promote My Business**. Confirm an ineligible/suspended business cannot start checkout and is shown a clear explanation.
7. Repeat the profile-to-Business-Admin path on native after an authorized build is available.

## Validation performed

| Area | Result |
|---|---|
| API TypeScript | Passed |
| Web TypeScript | Passed |
| Native TypeScript | Passed |
| API focused contracts | 3 files / 10 tests passed |
| Web focused regressions | 3 files / 10 tests passed |
| Native profile regression | 1 file / 6 tests passed |
| Web production build | Passed |
| Diff whitespace check | Passed |

Web build produced pre-existing-style sourcemap/chunk-size warnings only; it completed successfully.

## Evidence categories

| Category | Evidence from this repair | What still needs environment verification |
|---|---|---|
| UI repair | Profile **My Business** entry, selected dashboard, profile editor, explicit owner-facing failures | Browser/native behavior on the next authorized candidate environment |
| Runtime/authorization repair | Approved owner-link checks, explicit business selection, eligibility gate retained | Actual database data and deployment health |
| Environment/data dependency | Voice-profile table may be unavailable in the current deployed environment; listing status can remain `paused` | Authorized migration/deployment and real owner relationship data |

## Deployment boundary

This branch is **source-ready only**. An authorized staging deployment and controlled smoke test are required before describing the repair as live.

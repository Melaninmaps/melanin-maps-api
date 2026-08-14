# MWM Duplicate-Safety Patch Instructions

## 1. Apply the SQL patch

Run `mwm_visibility_and_dedupe_patch.sql` through the project’s normal migration mechanism. Do not run it manually against production without a backup and a staging test. The patch creates:

- `business_is_public(status, listing_status, is_duplicate)` as the canonical visibility rule.
- `public.public_businesses` as the public-only view.
- A public visibility index.
- A non-duplicate canonical dedupe-key unique index.

The SQL is non-destructive. It does not automatically mark or delete existing rows because existing-state changes must be driven by the verified duplicate audit.

## 2. Replace public business queries

In `routes/businesses.ts`, replace the map-pins query’s `FROM businesses` and active-only predicate with `FROM public.public_businesses` and coordinate checks only. Replace the public list/search query’s base table with `public.public_businesses`. Replace the detail lookup with:

```ts
const [business] = await db
  .select()
  .from(sql`public.public_businesses` as any)
  .where(eq(businessesTable.id, id));
```

If Drizzle cannot type a view in the current schema, use the provided `findPublicBusinessById()` SQL helper for detail and a raw SQL view query for list/map. Do not leave the old direct `businesses` table query in any public endpoint.

The existing tester exception must not bypass duplicate/hidden filtering. Tester accounts may see pending review records if that is intentional, but they must never see `is_duplicate=true` or permanently hidden records in public map/list/detail results.

## 3. Replace the Merge handler

In `routes/admin.ts`, keep the existing admin authorization and route declaration, but replace the body of `PATCH /admin/business-review/:id` with `handleBusinessReviewAction()` from `mwm_admin_dedupe_patch.ts`. Keep the project’s existing `isAdmin(req)` function and adjust the import paths to match the repository.

The Merge action now:

1. Locks the review item.
2. Requires a canonical `matched_business_id`.
3. Locks the canonical business and rejects a canonical target already marked duplicate.
4. Finds the physical candidate row.
5. Sets `is_duplicate=true`, `duplicate_of_id`, duplicate reason/timestamp, `status='permanently_hidden'`, and `listing_status='permanently_hidden'`.
6. Marks the review item merged only after the business update succeeds.
7. Rolls back the entire operation on failure.

If the review table can be changed, add a `candidate_business_id` column and populate it at ingestion time. Then replace `findReviewCandidate()` with a direct `WHERE id = candidate_business_id`; this is preferable to field matching for future review items.

## 4. Replace admin discovery approval

In `routes/admin.ts`, replace the current `/admin/business-discovery/approve` body with `approveDiscoveredBusiness()` from `mwm_admin_discovery_approval_patch.ts`.

The handler must:

- Normalize the name with `normalizeText()`.
- Compute the same `dedupeKey()` used by governed ingestion.
- Persist both `normalized_name` and `dedupe_key`.
- Persist `source_provider='google_places'` and a source URL based on the Google Place ID.
- Look up an existing canonical row before inserting.
- Use a partial unique conflict target for race-condition protection.
- Return the existing canonical ID instead of creating another UUID.
- Preserve additional website and phone data when a duplicate submission provides fields missing on the canonical row.

The response contract is explicit: `CREATED_CANONICAL` means one new row was created; `EXISTING_CANONICAL` means no new row was created.

## 5. Required route-level tests

| Test | Expected result |
|---|---|
| Map pins with a confirmed duplicate | Duplicate ID absent. |
| Public list with a confirmed duplicate | Duplicate ID absent from both rows and total count. |
| Direct detail request for duplicate ID | 404 or non-public response. |
| Approve same Google Place twice | Same canonical ID returned; row count increases by one only. |
| Approve same name with Cafe/Café spelling | Same canonical when location is identical. |
| Approve same name at a different verified location | Separate canonical row. |
| Merge a seeded review item | Candidate row becomes duplicate and hidden; review item becomes merged. |
| Repeat Merge | 409 already resolved; no additional mutation. |
| Concurrent approvals | One canonical row; no unkeyed active row. |

## 6. SQL verification after deployment

Run `REPLIT_LIVE_DUPLICATE_VERIFICATION.sql`. The following must be true before tester release:

- No row appears in the active/public leakage query.
- No canonical dedupe-key collision exists.
- Every duplicate points to an existing non-duplicate canonical row.
- Duke’s Cafe has one canonical row and all known duplicate rows point to it.
- The review queue count is stable across application restarts.

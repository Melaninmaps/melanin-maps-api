# Railway Runtime Duplicate Test Protocol

Run this against a staging copy first, then production with a transaction-safe rollback plan. Capture request, response, database row counts, and timestamps for every test.

## Preconditions

1. Run `REPLIT_LIVE_DUPLICATE_VERIFICATION.sql` and save the complete output.
2. Create or identify one known canonical test business and one known duplicate pair.
3. Use a dedicated admin/tester account. Do not use a real customer’s account.
4. Record the database count before each test.

## Test sequence

### A. Public visibility

Call `GET /api/businesses/map-pins`, `GET /api/businesses?limit=200`, and `GET /api/businesses/:id` for a confirmed duplicate, a permanently hidden Duke’s Cafe row, and the canonical row. The duplicate and hidden records must not appear in map/list results, and direct detail access must return 404 or an explicitly non-public response. The canonical row must remain accessible.

### B. Repeated admin approval

Submit the same Google Places candidate twice to `/api/admin/business-discovery/approve`, using the same place ID and identical location. The first request may create one canonical row. The second must return the existing canonical ID or a deterministic duplicate response. Query `businesses` afterward and prove there is exactly one active canonical row for that identity.

### C. Repeated governed ingestion

Submit the same query twice to `/api/businesses/ingest`. Repeat with `Cafe` versus `Café`, punctuation variants, and a URL/image representing the same business. The second and later attempts must not create a second canonical row. Evidence may be appended to the existing row.

### D. Alternate creation paths

Submit the same identity through `/api/businesses`, `/api/businesses/suggest-place`, `/api/businesses/community-reference`, and admin create. Every path must either resolve to one canonical row or create a pending review item. No path may create a second live row with a missing dedupe key.

### E. Merge action

Use one seeded possible-duplicate review item and call `PATCH /api/admin/business-review/:id` with `{ "action": "merge" }`. Verify the candidate/duplicate record is marked `is_duplicate=true`, has `duplicate_of_id` set to the selected canonical, is not publicly visible, and that the review item records who/when resolved it. Repeating the action must return a safe already-resolved response.

### F. Keep-both action

Use a possible-duplicate pair that is confirmed to be separate locations. Call `keep_both`. Verify both records remain live, have complete dedupe keys, and future ingestion of either location resolves to the correct one.

### G. Concurrency

Send two identical approval or ingestion requests concurrently. Verify the database unique/index/transaction path permits at most one active canonical row. A client-side check alone is not sufficient.

### H. Review queue idempotency

Restart the application twice and verify the four possible-duplicate review pairs are not duplicated. Verify the queue shows the expected pending count and exact pair IDs.

## Acceptance criteria

The release fails if any confirmed duplicate is publicly returned, any direct detail route exposes a hidden duplicate, any insert path creates a second canonical row, merge changes only the queue status without changing business state, or any canonical active row lacks a dedupe key and an auditable source/review reason.

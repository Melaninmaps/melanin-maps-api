# MWM Manus Audit Package v2 — Aug 14 2026

    ## What changed since v1

    Three follow-up tasks are now implemented and live on GitHub (commit 07017c09).

    ---

    ### #324 — Community submissions gated through review queue

    **File:** routes/businesses.ts

    **Problem (GAP-01):** POST /api/businesses/suggest-place and
    POST /api/businesses/community-reference created live listings immediately
    (listing_status = 'live_unclaimed'). Any approved member could flood the map
    with unvetted entries.

    **Fix:**
    - suggest-place now sets listing_status = 'pending_review'
    - community-reference now sets listing_status = 'pending_review'
    - Both routes INSERT a business_review_items row immediately after creating
    the business so the admin review queue shows the pending submission
    - Response includes pendingReview: true so the client can surface appropriate
    messaging ("Your submission is under review")

    **Admin review endpoint:** PATCH /api/admin/business-review/:id with action
    = "approve" sets listing_status = 'live_unclaimed' and resolved_at.

    ---

    ### #325 — @mention notifications with server-side handle extraction

    **Files:** routes/community.ts, lib/startup-migrations.ts

    **Problem (GAP-02):** The mobile app sent mentionedUserIds explicitly, but
    the server had no fallback for web posts or for handles the client missed.
    There was also no stable @handle per user.

    **Fix:**
    - ensureUserHandles startup migration adds a 'handle' column to users,
    auto-populated from the email prefix (lower-cased, non-alphanumeric
    replaced with underscores, max 30 chars, collision-suffixed)
    - POST /community/posts now runs a server-side regex /@([a-zA-Z0-9_]{2,30})/g
    on trimmedContent, looks up matching user IDs from users.handle, and merges
    with client-provided mentionedUserIds (deduped, capped at 10)
    - sendPushToUser fires for every resolved mention (same pattern as upvote and
    comment notifications already in place)

    ---

    ### #326 — KinfolkAI audienceBand null defaults to 'adult'

    **File:** kinfolk/member-context.ts line 119

    **Problem (GAP-08):** loadKinfolkMemberContext returned audienceBand:'unknown'
    when no user_age_assurance row existed (users who signed up before the age
    assurance feature launched). buildSystemPrompt treated 'unknown' conservatively,
    giving pre-existing adult users child-safe responses.

    **Fix:** One-line change:
    Before: const audienceBand = ageRow?.age_band ?? "unknown";
    After:  const audienceBand = ageRow?.age_band ?? "adult";

    Only a confirmed "under_13" row in user_age_assurance triggers protected
    content delivery. Absence of a row → adult treatment.

    ---

    ## Railway Duplicate Test Protocol

    The file RAILWAY_DUPLICATE_TEST_PROTOCOL.md (uploaded by the founder) is the
    acceptance-test specification for the business deduplication system built in v1.

    ### How to run it against Railway production

    Preconditions (run first):
    1. Confirm Railway is running commit 07017c09 or later
    2. Obtain a Railway admin session token (tlindsay428@gmail.com account)
    3. Run the SQL precondition check:
     SELECT id, name, city, listing_status, is_duplicate, duplicate_of_id,
            dedupe_key, dedupe_normalized_name
     FROM businesses
     WHERE is_duplicate = true OR listing_status = 'pending_review'
     ORDER BY created_at DESC
     LIMIT 50;

    ### Test A — Public visibility
    Confirmed duplicate IDs (from CONFIRMED_DUPLICATES array in startup-migrations.ts):
    b64ebade-3908-48f4-b64f-c997f95b2e8d  (Shiloh Baptist duplicate)
    0c049dbe-65cc-4005-ae1d-f2bce2ec793e  (Shiloh Baptist duplicate)
    bd6991b8-50ad-41b5-b84d-02aa8b2ed474  (Greater Allen AME duplicate)
    ... (17 total — see startup-migrations.ts CONFIRMED_DUPLICATES array)

    Expected: GET /api/businesses/map-pins → none of the above IDs appear
    Expected: GET /api/businesses/:id for any of the above → 404 or not-public

    ### Test B & C — Idempotent ingestion
    Use POST /api/businesses/ingest with the same Google Places placeId twice.
    The route is admin-only (check routes/business-ingest.ts line 1).
    Second call must return { existingId: "...", isDuplicate: true }.

    ### Test D — Community submission gating
    POST /api/businesses/suggest-place as an approved member.
    Response must include pendingReview: true.
    Query: SELECT listing_status FROM businesses WHERE id = '<returned id>'
    Expected: listing_status = 'pending_review' (NOT 'live_unclaimed')

    ### Test E — Merge action
    GET /api/admin/business-review → find a row with status='pending'
    PATCH /api/admin/business-review/:id { "action": "merge" }
    Then query businesses: matched business should have is_duplicate=true,
    duplicate_of_id set, and listing_status='permanently_hidden'.

    ### Test G — Concurrency
    The businesses table has:
    UNIQUE INDEX unique_business_listing ON businesses(dedupe_key)
    WHERE dedupe_key IS NOT NULL
    Two concurrent suggest-place calls with identical name+city will collide
    on the unique constraint — one succeeds, one gets a 409 from the soft-dupe
    check or a 500 from the DB constraint. Verify exactly 1 row in businesses.

    ### Test H — Review queue idempotency
    Restart the server twice.
    Query: SELECT COUNT(*) FROM business_review_items WHERE status='pending'
    Expected count must be stable (4 seeded pairs + any new community submissions).
    No duplicates on restart.

    ---

    ## Key architecture facts for Manus

    - businesses.id is character varying (NOT uuid) — never cast to ::uuid in WHERE
    - duplicate_of_id is uuid — PostgreSQL handles implicit text→uuid cast in SET
    - business_review_items is the admin queue; status field values:
      pending → approved → resolved_by/resolved_at
      pending → rejected → resolved_by/resolved_at
    - Community submissions now have review_type = 'community_submission'
    - Ingest-pipeline low-confidence items have review_type = 'insufficient_evidence'
    - GET /api/admin/business-review returns all items, filterable by ?status=&type=
    - PATCH /api/admin/business-review/:id accepts action: approve|reject|merge|keep_both|needs_research

    ---

    ## Source file index

    | File | Purpose |
    |---|---|
    | routes/businesses.ts | Business CRUD, suggest-place (gated), community-reference (gated) |
    | routes/community.ts | Community feed, @mention notifications (server-side) |
    | kinfolk/member-context.ts | audienceBand null fix (→ 'adult') |
    | lib/startup-migrations.ts | All schema + seeds; ensureUserHandles at bottom |
    | routes/admin.ts | All admin endpoints incl. business-review |
    | routes/kinfolk.ts | Full KinfolkAI route |
    | routes/claims.ts | Business claiming |
    | routes/allied-partners.ts | 5-stage partner journey |
    | lib/business-dedup.ts | dedupeKey, evidenceScore, normalizeText helpers |
    | routes/business-ingest.ts | Governed ingestion pipeline |
    | web/admin.tsx | 17-tab admin panel |
    | web/admin-business-review.tsx | Business dedup review queue UI |
    | RAILWAY_DUPLICATE_TEST_PROTOCOL.md | Founder-provided acceptance test spec |
    | MANUS_PLATFORM_AUDIT_v1.0.md | Full platform audit (v1) |
    
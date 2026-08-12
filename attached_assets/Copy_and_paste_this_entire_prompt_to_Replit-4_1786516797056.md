# Copy and paste this entire prompt to Replit

```text
OWNER-APPROVED P0 — MAKE COMMUNITY VIBES AND COMMUNITY SAYS WORK

## What is broken

The business page shows Community Vibes and Community Says chips, but they are not functioning community feedback controls. A member can see `Auntie Energy`, `Hood Classic`, `Worth the Drive`, or `Grandma Approved`, yet selecting one is not proven to write a real record, update an aggregate, or survive a hard refresh.

Fix the capability. Preserve the approved page structure and labels. Do not add fake reviews, fake counts, or a generic review redesign.

## Absolute no-touch boundary

Touch only:

- the existing business-detail Community Vibes and Community Says components;
- authenticated business feedback API/data access;
- focused schema migration(s) for member selection persistence if no suitable table exists;
- aggregate calculation, tests, and necessary cleanup of unsupported legacy counts.

Do NOT touch login, auth, Kinfolk prompts/models/capacity work, Library, map rendering, Safety Hub, business-page visual design outside these controls, mobile layouts, or unrelated features.

## Required member behavior

### Community Vibes

Keep the approved choices and canonical keys:

| Display label | Canonical key |
|---|---|
| Locals Know | `locals_know` |
| Auntie Energy | `auntie_energy` |
| Hood Classic | `hood_classic` |
| Soft Life | `soft_life` |
| Neighborhood Love | `neighborhood_love` |
| History Lives Here | `history_lives_here` |
| Sunday Best | `sunday_best` |
| Take Somebody From Out of Town | `take_somebody_from_out_of_town` |

When an authenticated member selects a Vibe on a business page:

1. visibly mark that chip selected immediately;
2. write or update the member’s real selection for that exact business and key;
3. return the authoritative aggregate count from the server;
4. update the count without a page reload;
5. retain the member’s selected state and the count after a hard refresh;
6. toggle the same selection off if the member selects it again;
7. never allow duplicate submissions to inflate an aggregate.

### Community Says

Keep the approved choices and canonical keys:

| Display label | Canonical key |
|---|---|
| Sent the Group Chat | `sent_the_group_chat` |
| Cooks Like Home | `cooks_like_home` |
| Worth the Drive | `worth_the_drive` |
| Portions With Love | `portions_with_love` |
| Grandma Approved | `grandma_approved` |
| Seasoned Right | `seasoned_right` |

Use the same select → persist → aggregate → hard-refresh → toggle behavior. If no active approved member has selected a caption, render the honest empty state:

```text
Be the first to add a community caption for this business.
```

Do not display `12 said ...` unless exactly 12 qualifying active feedback records exist.

## Data model

Use an existing normalized community feedback table if it already supports this exact behavior. Otherwise create one narrow table using the project’s current ID types:

```sql
CREATE TABLE IF NOT EXISTS business_member_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('vibe', 'caption')),
  key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'pending_review', 'removed')
  ),
  is_load_test BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, member_id, kind, key)
);

CREATE INDEX IF NOT EXISTS idx_business_member_feedback_aggregate
  ON business_member_feedback (business_id, kind, key, status)
  WHERE status = 'active' AND is_load_test = FALSE;
```

Before applying, inspect the production ID types. If `businesses.id` or `users.id` is text/varchar, use that matching type. Do not weaken the foreign keys.

## API contract

Implement one authenticated idempotent endpoint:

```text
PUT /api/businesses/:businessId/community-feedback
```

Request:

```json
{
  "kind": "vibe",
  "key": "auntie_energy",
  "selected": true
}
```

Server rules:

1. Derive the member ID only from the authenticated session.
2. Validate `businessId`, `kind`, and `key` against the canonical allowlists above.
3. Confirm the business exists and is publicly active before writing.
4. Upsert or activate the member selection when `selected: true`.
5. Remove/deactivate only that member’s matching row when `selected: false`.
6. Exclude pending, removed, demo, load-test, and unsupported legacy records from all public aggregates.
7. Return the member’s resulting selection and authoritative counts.
8. Do not expose another member’s identity or individual feedback record.

Response:

```json
{
  "memberSelection": {
    "kind": "vibe",
    "key": "auntie_energy",
    "selected": true
  },
  "aggregates": {
    "vibeCounts": {
      "auntie_energy": 1
    },
    "captionCounts": {}
  },
  "updatedAt": "2026-08-12T00:00:00.000Z"
}
```

The business detail read response must include:

- `viewerFeedbackSelections` for the signed-in member only;
- `vibeCounts` and `captionCounts` derived from qualifying active rows;
- no count if it has no qualifying source rows.

## Client requirements

1. Each selectable chip must be a real `<button>`.
2. Use `aria-pressed={selected}`.
3. Include stable test IDs, such as:
   - `business-vibe-auntie-energy`
   - `business-caption-worth-the-drive`
4. On click, call the structured API endpoint—not a local-only state setter.
5. Use an optimistic selected state only while the request is pending; reconcile to the server response and roll back on failure.
6. Disable only the clicked chip while its own request is pending; do not freeze the whole page.
7. On page load and hard refresh, hydrate from `viewerFeedbackSelections` and server aggregate counts.
8. Show count badges only for real nonzero aggregate counts.
9. Keep the current approved styling and chip layout. Do not redesign the page.

## Legacy/fake data cleanup

Audit and suppress any existing Vibe/Community Says count or rating that lacks a qualifying source row. Do not delete real member feedback. Preserve a reversible internal audit trail for suppressed legacy values.

## Required tests

1. Member A selects `Auntie Energy` for Business X; it becomes selected and count becomes 1.
2. Member A hard refreshes; it remains selected and count remains 1.
3. Member A selects it again; it becomes unselected and count becomes 0/hidden.
4. Member B selects the same tag; count becomes 1 for both users, while each sees only their own selected state.
5. Member A selects `Worth the Drive`; repeat select/persist/refresh/toggle assertions.
6. A business with no active feedback shows empty honest Community Says/Vibes state, not pre-filled numbers.
7. Pending, removed, load-test, and legacy unsupported rows do not affect aggregates.
8. A nonexistent/inactive business cannot receive feedback.
9. Existing login, Library, Kinfolk, map rendering, Safety Hub, and business-page layout do not regress.

## Required evidence back to owner and Manus

Return:

1. exact files and migrations changed;
2. production-safe data cleanup report for suppressed unsupported Vibe/caption counts;
3. API request/response evidence for select and toggle;
4. logged-in browser proof of select → hard refresh → persisted state → toggle for one Vibe and one Community Says tag;
5. test results; and
6. new deployment SHA.
```

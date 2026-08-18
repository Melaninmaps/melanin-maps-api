# Community Vibes: Data-to-Interface Stabilization

## Diagnosis

The visible business detail page is still rendering a hard-coded tag list — **Locals Know, Auntie Energy, Hood Classic, Soft Life, Neighborhood Love, History Lives Here, Sunday Best, and Take Somebody From Out of Town** — even though the page reports only one voice. That is not a living community signal. It is a static display component that is disconnected from reviews, check-ins, moderation, and business-specific data.

A static vocabulary may still be useful, but only as a **member contribution menu**. It must never be rendered as existing community evidence until approved evidence supports it.

## Required behavior

| Data condition | What the member sees |
|---|---|
| No approved evidence | “The community is still building this story.” No generic claims or fake vibe chips. |
| One approved voice | One labeled **Emerging signal**; it is not framed as broad community consensus. |
| Two approved unique voices | A **Growing** signal with the aggregate voice count. |
| Three or more approved unique voices | An **Established** community vibe with aggregate voice count. |
| Signed-in member with an active check-in/review | A voluntary “Add your experience” control with up to three category-relevant choices. |
| New contribution | “Queued for moderation.” It does not immediately change public community evidence. |

## Installation sequence

1. Back up the database.
2. Run `db/migrations/20260818_04_dynamic_community_vibes.sql` against production PostgreSQL.
3. Register `registerCommunityVibesRoutes` after authentication middleware and before the generic 404 handler.
4. Mount `CommunityVibes` through `businessDetailVibes.patch.tsx` and **remove the old static tag array/component**.
5. Build and deploy the API and web client together.
6. Run `tests/communityVibes.spec.ts` using a seeded test business with no approved evidence and a disposable signed-in audit account.

## Server bootstrap

```ts
import { CommunityVibesRepository } from "./communityVibes/communityVibesRepository";
import { registerCommunityVibesRoutes } from "./communityVibes/registerCommunityVibesRoutes";

registerCommunityVibesRoutes(app, new CommunityVibesRepository(pool));
```

The public GET response is aggregate-only. It must not reveal a member’s identity, email, raw review text, or exact visit history. The POST route requires authenticated membership and writes only **pending** evidence; moderation promotes valid entries to `approved`.

## Production checks

```sql
-- The dynamic aggregation view must exist.
SELECT to_regclass('public.approved_business_vibes');

-- A business with no approved evidence should return zero rows.
SELECT * FROM approved_business_vibes WHERE business_id = '<test-business-id>';

-- These static labels must not come from the business-detail component anymore.
-- Search the client source for the old static `DEFAULT_VIBES`/`BUSINESS_VIBES` array and remove it.
```

| Release check | Expected result |
|---|---|
| Existing business detail with zero approved evidence | Honest empty state, not default chips. |
| Approved tag data | Tag labels and aggregate voice counts match `approved_business_vibes`. |
| Pending member tag | Does not appear in the public GET response. |
| Moderated approved tag | Appears after the next no-store GET response. |
| Business switch | The component requests the new business ID; no prior business tags remain visible. |
| API failure | A clear temporary-error message, not generic defaults. |

## Why this matters to Kinfolk

Kinfolk should consume the same `approved_business_vibes` aggregation and its confidence level. It can say “the community has an emerging signal of…” only for an approved one-voice tag, and “members consistently mention…” only when the evidence is established. It must never invent a vibe from a business category or generic UI list.

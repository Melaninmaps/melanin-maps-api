# Replit Implementation Guide — Hyperlocal Place Mapping: **Uptown → Mount Airy, Philadelphia**

**Status:** Controlled feature branch. Do not combine with the P0 bundle-identity, rate-limit, map, or 30-user repair release.

## Objective

Enable MWM members to contribute local place language that Kinfolk can use safely. The first controlled fixture is the community phrase **“Uptown”** for **Mount Airy, Philadelphia, Pennsylvania**. Kinfolk must interpret that mapping only when Philadelphia context is explicit or has been explicitly consented for search context. It must never apply that meaning to Atlanta or another city.

> **Non-negotiable rule:** A local alias is not a global synonym. It is a place-scoped, evidence-backed relationship with an approval state.

## Step 0 — Do not hard-code an alias in the prompt

Do **not** add `if query.includes("uptown") then "Mount Airy"` to Kinfolk prompts, `intent-router.ts`, map search, or the frontend. That would make Philadelphia language leak into other geographies and cannot be governed, corrected, or audited.

Implement the additive data model and resolver below.

## Step 1 — Add an idempotent migration

Create `artifacts/api-server/src/lib/migrations/20260813_community_place_aliases.sql` and register it in `src/lib/startup-migrations.ts`. The migration must be idempotent and must not rewrite businesses, cultural sites, map pins, user profiles, or existing saved locations.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS community_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  place_kind TEXT NOT NULL CHECK (place_kind IN (
    'neighborhood', 'district', 'corridor', 'city', 'landmark', 'venue_area'
  )),
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  canonical_source_url TEXT,
  canonical_source_kind TEXT NOT NULL DEFAULT 'founder_approved'
    CHECK (canonical_source_kind IN ('official', 'government', 'institutional', 'founder_approved', 'curator_verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_name, city, COALESCE(state, ''), country)
);

CREATE TABLE IF NOT EXISTS community_place_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_display TEXT NOT NULL,
  alias_normalized TEXT NOT NULL,
  place_id UUID NOT NULL REFERENCES community_places(id) ON DELETE RESTRICT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'published', 'rejected', 'retired')),
  evidence_kind TEXT NOT NULL
    CHECK (evidence_kind IN ('founder_approved', 'public_source', 'member_submission', 'curator_research')),
  evidence_url TEXT,
  evidence_note TEXT NOT NULL,
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  distinct_support_count INTEGER NOT NULL DEFAULT 0 CHECK (distinct_support_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at TIMESTAMPTZ,
  UNIQUE (alias_normalized, place_id, city, COALESCE(state, ''), country)
);

CREATE INDEX IF NOT EXISTS community_place_aliases_lookup_idx
  ON community_place_aliases (alias_normalized, city, state, country, status);
CREATE INDEX IF NOT EXISTS community_place_aliases_place_idx
  ON community_place_aliases (place_id, status);

-- Controlled founder-approved fixture.  Keep its provenance transparent.
INSERT INTO community_places (
  canonical_name, place_kind, city, state, country,
  canonical_source_kind, canonical_source_url
) VALUES (
  'Mount Airy', 'neighborhood', 'Philadelphia', 'PA', 'United States',
  'founder_approved', NULL
)
ON CONFLICT (canonical_name, city, COALESCE(state, ''), country) DO NOTHING;

INSERT INTO community_place_aliases (
  alias_display, alias_normalized, place_id, city, state, country,
  status, evidence_kind, evidence_note, approved_at
)
SELECT
  'Uptown', 'uptown', p.id, 'Philadelphia', 'PA', 'United States',
  'published', 'founder_approved',
  'Founder-approved local context fixture: in Philadelphia search context, “Uptown” may refer to Mount Airy. Do not use outside Philadelphia.',
  now()
FROM community_places p
WHERE p.canonical_name = 'Mount Airy'
  AND p.city = 'Philadelphia'
  AND p.state = 'PA'
ON CONFLICT (alias_normalized, place_id, city, COALESCE(state, ''), country) DO NOTHING;
```

### Required migration review

Before production deploy, Replit must query:

```sql
SELECT a.alias_display, a.status, p.canonical_name, p.city, p.state,
       a.evidence_kind, a.evidence_note
FROM community_place_aliases a
JOIN community_places p ON p.id = a.place_id
WHERE a.alias_normalized = 'uptown';
```

Expected: exactly one published Philadelphia/PA → Mount Airy mapping. No Atlanta mapping is permitted unless separately added with its own target, evidence, and approval.

## Step 2 — Add one resolver module

Create `artifacts/api-server/src/kinfolk/community-place-resolver.ts`.

```ts
import { sql } from 'drizzle-orm';
import { db } from '@workspace/db';

export type PlaceContext = {
  city?: string;
  state?: string;
  country?: string;
  // Set only if the member has opted in to use their saved home city for search.
  consentedHomeCity?: string;
  consentedHomeState?: string;
};

export type PlaceAliasResolution =
  | { state: 'matched'; alias: string; canonicalName: string; city: string; stateCode: string | null; placeKind: string; evidenceKind: string }
  | { state: 'needs_clarification'; alias: string; question: string }
  | { state: 'no_match' };

function norm(value: string): string {
  return value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
}

export async function resolveCommunityPlaceAlias(
  rawQuery: string,
  context: PlaceContext,
): Promise<PlaceAliasResolution> {
  const query = norm(rawQuery);
  const contextualCity = context.city ?? context.consentedHomeCity;
  const contextualState = context.state ?? context.consentedHomeState;

  // Never select an alias without a city context. “Uptown” is intentionally ambiguous.
  if (!contextualCity) {
    const candidates = await db.execute(sql`
      SELECT DISTINCT a.alias_display
      FROM community_place_aliases a
      WHERE a.status = 'published'
        AND ${query} LIKE '%' || a.alias_normalized || '%'
      LIMIT 2
    `);
    if (candidates.rows.length > 0) {
      return {
        state: 'needs_clarification',
        alias: String(candidates.rows[0].alias_display),
        question: `Which city do you mean by “${String(candidates.rows[0].alias_display)}”?`,
      };
    }
    return { state: 'no_match' };
  }

  const result = await db.execute(sql`
    SELECT a.alias_display, a.evidence_kind, p.canonical_name, p.city,
           p.state, p.place_kind
    FROM community_place_aliases a
    JOIN community_places p ON p.id = a.place_id
    WHERE a.status = 'published'
      AND ${query} LIKE '%' || a.alias_normalized || '%'
      AND lower(a.city) = lower(${contextualCity})
      AND (${contextualState ?? null}::text IS NULL OR lower(coalesce(a.state, '')) = lower(${contextualState ?? ''}))
      AND lower(a.country) = lower(${context.country ?? 'United States'})
    ORDER BY length(a.alias_normalized) DESC, a.approved_at DESC
    LIMIT 2
  `);

  if (result.rows.length === 0) return { state: 'no_match' };
  if (result.rows.length > 1) {
    return {
      state: 'needs_clarification',
      alias: String(result.rows[0].alias_display),
      question: `I found more than one local meaning for “${String(result.rows[0].alias_display)}” in ${contextualCity}. Which area do you mean?`,
    };
  }

  const row = result.rows[0];
  return {
    state: 'matched',
    alias: String(row.alias_display),
    canonicalName: String(row.canonical_name),
    city: String(row.city),
    stateCode: row.state ? String(row.state) : null,
    placeKind: String(row.place_kind),
    evidenceKind: String(row.evidence_kind),
  };
}
```

## Step 3 — Integrate it before city extraction and business retrieval

Modify only:

- `artifacts/api-server/src/kinfolk/intent-router.ts`
- `artifacts/api-server/src/routes/universal-search.ts`
- the Kinfolk route/context builder that invokes `intent-router.ts`

Execution order for a query such as **“brunch in Uptown”**:

1. Read an explicit city in the query (`Uptown Philly`, `Uptown Philadelphia`) if present.
2. Otherwise use a saved home city **only** if the member has opted into `useHomeCityForSearch`.
3. Call `resolveCommunityPlaceAlias(query, context)`.
4. If matched, add `resolvedPlace = Mount Airy`, `resolvedCity = Philadelphia`, and `resolutionSource = community_place_alias` to the internal search context.
5. Query businesses/maps using `city = Philadelphia` plus neighborhood/canonical-place match. Do not replace the user’s phrase in the visible transcript.
6. If no city context exists, return one clarification question. Do not choose Philadelphia.
7. If the context is Atlanta, do not return Mount Airy. Search Atlanta’s own aliases or ask a clarification.

Do not send contributor IDs, support counts, internal evidence notes, or unpublished aliases to the LLM or web client.

## Step 4 — Add member proposal and curator approval routes

Create `artifacts/api-server/src/routes/community-place-aliases.ts`, mount it behind ordinary member auth, and add an admin-only review route.

| Endpoint | Authorization | Required behavior |
| --- | --- | --- |
| `POST /api/community/place-aliases` | Signed-in member | Creates `proposed`; require alias, target place, city/state/country, context sentence, and either public URL or founder/curator path. Never publishes directly. Limit 3 per member/day. |
| `GET /api/community/place-aliases/resolve` | Signed-in member | Returns only published resolution, an ambiguity question, or no match. Never exposes contributor identities. |
| `GET /api/admin/community/place-aliases?status=proposed` | Admin role only | Lists evidence, duplicates, support count, and moderation history. Ordinary member must receive 403. |
| `POST /api/admin/community/place-aliases/:id/approve` | Admin role only | Requires a written approval note; changes to `approved`, then `published` only in one transaction. |
| `POST /api/admin/community/place-aliases/:id/reject` | Admin role only | Requires reason and preserves audit record. |
| `POST /api/admin/community/place-aliases/:id/retire` | Admin role only | Stops future resolution; does not erase prior audit data. |

## Step 5 — Add UI in the correct places

1. **Community compose / What’s Happening:** add `Teach Kinfolk a local name` as an optional, separate contribution—not a hidden tag side effect.
2. **Search results:** display the user’s phrase and a quiet explanation, e.g., `Showing Mount Airy, Philadelphia for “Uptown” based on a community-verified local name.` Do not expose names of contributors.
3. **Kinfolk:** if a match occurs, say `In Philadelphia, people may use “Uptown” for Mount Airy—here are options there.` If no city is known, ask one city question.
4. **Admin:** add the controlled proposal queue. No public voting count is shown.

## Step 6 — Mandatory tests

Create `artifacts/api-server/src/kinfolk/__tests__/community-place-resolver.test.ts` and Playwright coverage for the user journey.

```ts
it('maps Uptown to Mount Airy only in Philadelphia context', async () => {
  await expect(resolveCommunityPlaceAlias('brunch in Uptown', {
    city: 'Philadelphia', state: 'PA', country: 'United States',
  })).resolves.toMatchObject({ state: 'matched', canonicalName: 'Mount Airy', city: 'Philadelphia' });
});

it('does not map Uptown Atlanta to Mount Airy Philadelphia', async () => {
  await expect(resolveCommunityPlaceAlias('brunch in Uptown', {
    city: 'Atlanta', state: 'GA', country: 'United States',
  })).resolves.toEqual({ state: 'no_match' });
});

it('asks for a city when Uptown is unscoped', async () => {
  await expect(resolveCommunityPlaceAlias('brunch in Uptown', {
    country: 'United States',
  })).resolves.toMatchObject({ state: 'needs_clarification' });
});

it('never returns proposals, contributor identity, or unpublished aliases', async () => {
  // seed proposed Philadelphia alias, resolve as normal member
  // assert only published entry can be returned
});
```

Release gate:

```bash
pnpm test -- community-place-resolver
pnpm exec playwright test e2e/hyperlocal-place-alias.spec.ts
```

Production proof must show all of the following with one ordinary member and one admin test account:

1. `Uptown Philadelphia` resolves to Mount Airy, Philadelphia.
2. `Uptown Atlanta` does not resolve to Mount Airy.
3. Unscoped `Uptown` asks a city question unless explicit home-city search consent is enabled.
4. A member proposal stays private/proposed.
5. Admin approval is required for publication.
6. Rejected/retired aliases cannot resolve.
7. Business map/search results remain city-bounded.
8. `/api/version` remains clean (`stale_bundle: false`) after deployment.

## Exact Replit sequence

1. Create a dedicated branch: `feat/community-place-aliases`.
2. Add the migration and register it once; run it against a disposable development database first.
3. Implement the resolver and its unit tests.
4. Seed only the founder-approved Philadelphia Uptown fixture described above.
5. Integrate the resolver before city extraction in Kinfolk and universal search.
6. Add proposal/admin-review routes and admin authorization tests.
7. Add minimal Community/Kinfolk/search UI.
8. Run all unit, integration, and Playwright tests.
9. Deploy only after the P0 production bundle and rate-limit release is independently cleared; do not bundle this feature with it.
10. Send the migration output, test output, deployed SHA, `/api/version`, and controlled Philadelphia/Atlanta browser evidence to Manus for independent verification.

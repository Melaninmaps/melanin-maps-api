# Mapping With Melanin — P0 Launch Blockers Surgical Implementation Package

**Scope:** This package repairs only the three blockers independently observed in production: (1) authenticated Kinfolk chat returns `HTTP 500 KINFOLK_ERROR`; (2) reviewer, smoke-test, and load-test posts are visible in Community; and (3) Explore displays fabricated/static listings and community metrics.

**Do not touch:** login, member-keyed rate limits, map behavior, claims workflow, Library data, real business records, native apps, unrelated community features, or visual redesign outside the specified files.

> **Completion rule:** A source change is not complete until a non-stale production bundle, real browser behavior, API results, test output, and rollback information are included in the proof package.

## 1. Exact permitted file scope

| P0 item | Files permitted to change |
| --- | --- |
| Kinfolk chat 500 | `artifacts/api-server/src/lib/startup-migrations.ts`; `artifacts/api-server/src/routes/kinfolk.ts`; server bootstrap only if Stripe initialization currently runs before controlled migrations |
| Community cleanup | `artifacts/api-server/src/lib/startup-migrations.ts`; `artifacts/api-server/src/routes/community.ts`; community route tests |
| Explore fake data | `artifacts/web/src/pages/explore.tsx`; Explore page tests |

No other file should be changed without a new surgical package.

## 2. Deployment order — mandatory

1. Add the **idempotent database migrations** below to the startup-migration registry, in the listed order.
2. Add the server and web patches.
3. Run typecheck and focused tests locally.
4. Commit source and all required built artifacts together, including `dist/index.mjs`, root-served `web-static/index.html`, the referenced JS/CSS assets, and `dist/BUILD_IDENTITY`.
5. Deploy once; do not make an unrelated cache-busting edit.
6. Validate all acceptance checks before any 30-user traffic.

## 3. P0-A — Authenticated Kinfolk chat 500

### 3.1 Evidence and safety position

Authenticated chat fails for a normal audit member and an isolated load-test member even though the lightweight provider probe returns `{ "ok": true }`. Railway boot logs additionally show a failed `kinfolk_cultural_documents` migration and missing `stripe.accounts` relation. The exact request-time stack is still required for the ultimate root-cause label. This package fixes the confirmed schema defect and ensures **optional enrichment-table gaps cannot turn a useful chat response into a 500**.

The complete verified migration and route patch are attached separately as `MWM_Stripe_and_Kinfolk_Schema_Repair_Patch_2026-08-13.md`. Apply it exactly. The required corrections are summarized here so the P0 release has one checklist.

### 3.2 Exact database correction

The parent keys are `text`, not UUID. The migration must declare:

```sql
CREATE TABLE IF NOT EXISTS public.kinfolk_cultural_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        text REFERENCES public.kinfolk_entities(id) ON DELETE CASCADE,
  source_id        text REFERENCES public.kinfolk_source_records(id) ON DELETE SET NULL,
  document_type    varchar(48) NOT NULL DEFAULT 'summary',
  language_code    varchar(16) NOT NULL DEFAULT 'en',
  geography_scope  jsonb NOT NULL DEFAULT '{}'::jsonb,
  category         text,
  sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard',
  content          text NOT NULL,
  content_tsv      tsvector NOT NULL DEFAULT to_tsvector('english', ''),
  embedding_status varchar(24) NOT NULL DEFAULT 'pending',
  status           varchar(24) NOT NULL DEFAULT 'held',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kinfolk_cultural_documents
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_entity_id_fkey,
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_source_id_fkey;

ALTER TABLE public.kinfolk_cultural_documents
  ADD CONSTRAINT kinfolk_cultural_documents_entity_id_fkey
    FOREIGN KEY (entity_id) REFERENCES public.kinfolk_entities(id) ON DELETE CASCADE,
  ADD CONSTRAINT kinfolk_cultural_documents_source_id_fkey
    FOREIGN KEY (source_id) REFERENCES public.kinfolk_source_records(id) ON DELETE SET NULL;
```

The full attached migration also creates its supporting outbox, indexes, trigger, and the version-matched `stripe.accounts` recovery path. **Do not replace `text` with `uuid`; that was the original failed foreign-key mismatch.**

### 3.3 Exact graceful-degradation route patch

In `artifacts/api-server/src/routes/kinfolk.ts`, add near private helper functions:

```ts
function pgCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code?: unknown }).code ?? "") || undefined
    : undefined;
}

function isOptionalSchemaGap(err: unknown): boolean {
  const code = pgCode(err);
  return code === "42P01" || code === "42703" || code === "3F000" ||
    /relation .* does not exist|column .* does not exist/i.test(
      err instanceof Error ? err.message : String(err),
    );
}

async function optionalKinfolk<T>(
  stage: string,
  fallback: T,
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (!isOptionalSchemaGap(err)) throw err;
    logger.warn({ stage, pgCode: pgCode(err) },
      "Kinfolk optional enrichment unavailable; continuing without it");
    return fallback;
  }
}
```

Replace the unguarded cultural-phrase call:

```ts
const culturalPhrases = await getCachedCulturalPhrases();
```

with:

```ts
const culturalPhrases = await optionalKinfolk(
  "cultural_phrases",
  [] as Array<{ group_name: string; phrase: string; english_gloss: string }>,
  () => getCachedCulturalPhrases(),
);
```

Wrap optional session-memory reads/writes as documented in the attached schema package. If a missing optional relation is caught, answer the member’s question normally and omit only the unavailable session/enrichment context. Do **not** swallow provider authentication, provider timeout, token-budget, validation, or unrelated database errors.

At the outer handler boundary, log a sanitized stage name. No prompt, token, cookie, or user profile data may be logged:

```ts
logger.error({
  chatStage,
  pgCode: pgCode(err),
  errName: err instanceof Error ? err.name : typeof err,
  errMessage: (err instanceof Error ? err.message : String(err)).slice(0, 300),
  stack: err instanceof Error ? err.stack?.slice(0, 600) : undefined,
}, "kinfolk-chat-error");
```

### 3.4 Kinfolk acceptance test

Run after deployment using one ordinary tester and one account where `is_load_test = true`:

```bash
curl -sS -X POST 'https://www.mappingwithmelanin.com/api/kinfolk/chat' \
  -H 'content-type: application/json' -H "cookie: $SESSION_COOKIE" \
  --data '{"message":"What is 2 plus 2?"}'
```

Both must return HTTP 200 with a non-empty assistant response. The same deployment window must show no failed cultural-document migration and no `stripe.accounts does not exist` log. If either response is 500, stop; paste the sanitized `kinfolk-chat-error` record and do not run the canary.

## 4. P0-B — Quarantine and exclude public test/reviewer posts

### 4.1 Preflight: inspect exactly what will be quarantined

Run this read-only query before changing data. It is deliberately narrow: it targets load-test accounts and the exact reviewer/smoke identities observed in the audit.

```sql
SELECT
  cp.id,
  cp.author_id,
  cp.author_name,
  cp.content,
  cp.visibility,
  cp.requires_moderation,
  cp.created_at,
  COALESCE(u.is_load_test, false) AS is_load_test
FROM public.community_posts cp
LEFT JOIN public.users u ON u.id = cp.author_id
WHERE COALESCE(u.is_load_test, false) = true
   OR lower(COALESCE(cp.author_name, '')) IN (
        'apple reviewer', 'app reviewer', 'smoke test', 'load test'
      )
   OR lower(btrim(COALESCE(cp.content, ''))) IN (
        'smoke test post - ignore',
        'smoke test post — ignore'
      )
ORDER BY cp.created_at DESC;
```

The result must be reviewed and attached to the deployment proof package before the update below. If the query returns an unfamiliar real member post, stop and exclude it by its ID from the update; do not broaden the pattern.

### 4.2 Exact reversible SQL cleanup — quarantine, do not destructively delete

Add this as an idempotent startup migration **before** deploying the feed query patch. It preserves the original state for rollback, avoids foreign-key risks, and makes the selected records non-public immediately.

```sql
BEGIN;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS internal_test_content boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.community_post_internal_quarantine (
  post_id                    varchar PRIMARY KEY,
  original_visibility        varchar(32),
  original_requires_moderation boolean,
  quarantine_reason          text NOT NULL,
  quarantined_at             timestamptz NOT NULL DEFAULT now(),
  quarantined_by             text NOT NULL DEFAULT 'p0_launch_cleanup_20260813'
);

WITH candidates AS (
  SELECT cp.id, cp.visibility, cp.requires_moderation
  FROM public.community_posts cp
  LEFT JOIN public.users u ON u.id = cp.author_id
  WHERE COALESCE(u.is_load_test, false) = true
     OR lower(COALESCE(cp.author_name, '')) IN (
          'apple reviewer', 'app reviewer', 'smoke test', 'load test'
        )
     OR lower(btrim(COALESCE(cp.content, ''))) IN (
          'smoke test post - ignore',
          'smoke test post — ignore'
        )
)
INSERT INTO public.community_post_internal_quarantine (
  post_id, original_visibility, original_requires_moderation, quarantine_reason
)
SELECT id, visibility, requires_moderation,
       'load-test/reviewer/smoke-test content excluded from production feed'
FROM candidates
ON CONFLICT (post_id) DO NOTHING;

UPDATE public.community_posts cp
SET internal_test_content = true,
    visibility = 'followers_only',
    requires_moderation = true
FROM public.community_post_internal_quarantine q
WHERE q.post_id = cp.id
  AND cp.internal_test_content = false;

COMMIT;
```

**Do not issue `DELETE FROM community_posts` in this release.** A future separate retention ticket may purge quarantined test content only after 30 days and after a foreign-key inventory. This P0 change removes it from every member-facing feed immediately while keeping rollback possible.

### 4.3 Exact Community route patch

In `artifacts/api-server/src/routes/community.ts`, define the one shared predicate within the `GET /community/posts` handler after `viewerId`:

```ts
const excludeInternalTestAuthors = `
  AND COALESCE(cp.internal_test_content, false) = false
  AND COALESCE(u.is_load_test, false) = false
`;
```

Then make these exact query changes.

#### A. Profile-wall branch

Replace lines 111–116 (the Drizzle profile-wall lookup) with this query so test posts cannot be viewed through a profile endpoint:

```ts
const result = await pool.query<PostRow>(`
  SELECT cp.*
  FROM community_posts cp
  LEFT JOIN users u ON u.id = cp.author_id
  WHERE cp.author_id = $1
    ${excludeInternalTestAuthors}
  ORDER BY cp.created_at DESC
  LIMIT $2 OFFSET $3
`, [authorId, limit, offset]);
rows = result.rows;
```

#### B. Following feed

Change the beginning of the query from:

```sql
SELECT cp.* FROM community_posts cp
WHERE cp.author_id IN (
```

to:

```sql
SELECT cp.*
FROM community_posts cp
LEFT JOIN users u ON u.id = cp.author_id
WHERE cp.author_id IN (
```

Then add this condition after the existing moderation condition:

```sql
${excludeInternalTestAuthors}
```

#### C. For You feed

The query already joins `users u`. Add this immediately after `AND cp.requires_moderation = false`:

```sql
${excludeInternalTestAuthors}
```

#### D. Everyone feed

The query already joins `users u`. Add this immediately after `AND cp.requires_moderation = false`:

```sql
${excludeInternalTestAuthors}
```

#### E. Prevent new production test-account posts

At the very beginning of `POST /community/posts`, immediately after confirming `req.user?.id`, add:

```ts
const { rows: [actor] } = await pool.query<{ is_load_test: boolean }>(
  `SELECT COALESCE(is_load_test, false) AS is_load_test FROM users WHERE id = $1`,
  [req.user.id],
);
if (actor?.is_load_test) {
  res.status(200).json({ suppressed: true, reason: "isolated_load_test" });
  return;
}
```

This keeps the 30-user canary isolated and prevents the next test from creating public posts. It does not alter ordinary member posting.

### 4.4 Community verification and rollback

```sql
-- Must return 0: selected test/reviewer rows must not be feed-eligible.
SELECT count(*) AS public_internal_posts
FROM public.community_posts cp
LEFT JOIN public.users u ON u.id = cp.author_id
WHERE (COALESCE(cp.internal_test_content, false) = true
       OR COALESCE(u.is_load_test, false) = true)
  AND cp.visibility = 'public'
  AND cp.requires_moderation = false;

-- Evidence of what was quarantined, without showing it to members.
SELECT q.post_id, q.quarantine_reason, q.quarantined_at
FROM public.community_post_internal_quarantine q
ORDER BY q.quarantined_at DESC;
```

Use a normal, non-load-test member in the rendered browser to check **Everyone**, **For You**, and a known affected author profile. None may show Apple Reviewer, App Reviewer, or the smoke-test content.

Rollback only if a preflight-approved post was incorrectly quarantined:

```sql
BEGIN;
UPDATE public.community_posts cp
SET internal_test_content = false,
    visibility = q.original_visibility,
    requires_moderation = q.original_requires_moderation
FROM public.community_post_internal_quarantine q
WHERE cp.id = q.post_id
  AND cp.id = :approved_post_id;
DELETE FROM public.community_post_internal_quarantine
WHERE post_id = :approved_post_id;
COMMIT;
```

## 5. P0-C — Replace fabricated Explore content with real directory results

### 5.1 Required behavior

Explore must query the existing real business directory. It may show only actual business ID, name, category, city/state, description, image URL if stored, verified status if stored, and documented ownership designations. It must **not** show confidence scores, ratings, safety scores, recommendation percentages, return-alone percentages, “Community Trusted,” “Top Rated,” “Featured,” or synthetic ownership tags unless each displayed value comes from a verified live aggregate with adequate real-member evidence.

### 5.2 Exact `explore.tsx` patch

In `artifacts/web/src/pages/explore.tsx`:

1. Replace line 3 with:

```ts
import { MapPin, Search, Grid, Map as MapIcon, X, LoaderCircle, BadgeCheck } from "lucide-react";
```

2. Replace line 4 with:

```ts
import { useMemo, useState } from "react";
```

3. Delete the entire `staticBusinesses` declaration (current lines 36–133), delete the current `filtered` declaration (lines 135–143), and delete the current `hasFilters` declaration.

4. Add these helpers immediately before `export default function Explore()`:

```ts
const normaliseDesignation = (value: string) =>
  value.trim().toLowerCase().replace(/[_\s]+/g, "-");

function documentedOwnershipTags(business: any): string[] {
  const verified = Array.isArray(business.verifiedDesignations)
    ? business.verifiedDesignations.map((value: string) => normaliseDesignation(value))
    : [];
  if (business.verified === true && business.blackOwned === true) verified.push("black-owned");
  return [...new Set(verified)].filter((tag) =>
    OWNERSHIP_OPTIONS.some((option) => option.id === tag),
  );
}
```

5. Replace the hook/state block from the current `useListBusinesses({ limit: 6 })` through `handleSearch` with:

```ts
const [activeCategory, setActiveCategory] = useState("All");
const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState("");
const [submittedSearch, setSubmittedSearch] = useState("");

const { data, isLoading, isError } = useListBusinesses({
  limit: 50,
  search: submittedSearch.trim() || undefined,
});

const liveBusinesses = data?.businesses ?? [];
const categories = useMemo(
  () => ["All", ...Array.from(new Set(
    liveBusinesses.map((business: any) => business.category).filter(Boolean),
  )).sort()],
  [liveBusinesses],
);

const filtered = useMemo(() => liveBusinesses.filter((business: any) => {
  const categoryMatches = activeCategory === "All" || business.category === activeCategory;
  const ownership = documentedOwnershipTags(business);
  const ownershipMatches = selectedOwnership.length === 0 ||
    selectedOwnership.some((tag) => ownership.includes(tag));
  return categoryMatches && ownershipMatches;
}), [liveBusinesses, activeCategory, selectedOwnership]);

const hasFilters = selectedOwnership.length > 0 || activeCategory !== "All" || submittedSearch.trim().length > 0;

const toggleOwnership = (id: string) => {
  setSelectedOwnership((previous) =>
    previous.includes(id) ? previous.filter((tag) => tag !== id) : [...previous, id],
  );
};

const handleSearch = () => setSubmittedSearch(searchQuery.trim());
```

6. Replace `CATEGORIES.map` in the category-filter bar with `categories.map`.

7. Replace the entire current card-rendering condition from `{filtered.length > 0 ? (` through its matching `) : (` section with:

```tsx
{isLoading ? (
  <div className="flex justify-center py-24 text-[#3A1F0E]" aria-live="polite">
    <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
    <span className="sr-only">Loading live business listings</span>
  </div>
) : isError ? (
  <div className="py-24 text-center">
    <h3 className="text-xl font-serif font-bold text-[#3A1F0E]">Live listings are unavailable right now</h3>
    <p className="mt-2 text-sm text-[#3A1F0E]/70">Please try again shortly or search on the Map.</p>
  </div>
) : filtered.length > 0 ? (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
    {filtered.map((business: any) => {
      const ownership = documentedOwnershipTags(business);
      return (
        <article key={business.id} className="bg-white rounded-2xl overflow-hidden border border-[#3A1F0E]/5 flex flex-col">
          <div className="h-52 bg-[#2B1507]/10 relative overflow-hidden">
            {business.imageUrl ? (
              <img src={business.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2B1507]" aria-hidden="true" />
            )}
            {business.verified === true && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-[#3A1F0E] text-[10px] font-bold px-2 py-1 rounded">
                <BadgeCheck className="w-3 h-3 text-[#CA922B]" aria-hidden="true" /> Verified listing
              </span>
            )}
          </div>
          <div className="p-6 flex flex-col flex-1">
            <p className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider mb-2">
              {business.category} · {business.city}{business.state ? `, ${business.state}` : ""}
            </p>
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">{business.name}</h3>
            {business.description ? <p className="text-sm text-[#3A1F0E]/70 mb-4 flex-1 leading-relaxed">{business.description}</p> : null}
            {ownership.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-5" aria-label="Documented business designations">
                {ownership.map((tag) => {
                  const option = OWNERSHIP_OPTIONS.find((item) => item.id === tag)!;
                  return <span key={tag} className="text-[10px] font-semibold px-2 py-1 rounded bg-[#FAF6EF] text-[#3A1F0E]">{option.emoji} {option.label}</span>;
                })}
              </div>
            ) : null}
            <Link href={`/businesses/${business.id}`} className="mt-auto">
              <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">View Details</Button>
            </Link>
          </div>
        </article>
      );
    })}
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">No live listings match those filters</h3>
    <p className="text-[#3A1F0E]/60 mb-6 max-w-sm">Try a broader term or explore the Map.</p>
    <Button onClick={() => { setSelectedOwnership([]); setActiveCategory("All"); setSearchQuery(""); setSubmittedSearch(""); }} variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B]">Clear filters</Button>
  </div>
)}
```

8. Replace the result count/copy with:

```tsx
<h2 className="text-xl font-serif font-bold text-[#3A1F0E]">
  {isLoading ? "Loading live listings" : `${filtered.length} live listing${filtered.length === 1 ? "" : "s"}`}
  {hasFilters && <span className="text-[#3A1F0E]/50"> · filtered</span>}
</h2>
```

Delete the `Showing {filtered.length} of 200+ results` copy and the entire **Upgrade to See All Results** panel. Neither belongs on a directory page until entitlement behavior and data claims are implemented and verified.

This patch removes every hard-coded record, fake route ID, synthetic score, safety statistic, recommendation percentage, return-alone metric, and unsourced marketing label from Explore.

### 5.3 Explore verification

```bash
# Source-level proof: each command must return no matches.
grep -nE 'staticBusinesses|The Gathering Table|Heritage Boutique Hotel|Diaspora Arts Collective|confidenceScore|recommend:|returnAlone|Community Trusted|Top Rated|200\+' artifacts/web/src/pages/explore.tsx
```

Expected: no output.

Browser acceptance under an authenticated normal member:

1. Visit `/explore` and confirm every **View Details** URL has a real UUID business ID.
2. Confirm a card title/city/category match `GET /api/businesses?limit=50` for that ID.
3. Confirm no card shows a rating, safety score, recommendation percent, return-alone percent, static “Featured,” “Community Trusted,” or “Top Rated” label.
4. Filter by a documented designation; results may decrease, but a designation must never be inferred from a name or photo.
5. Search a live term and confirm the rendered card list changes using API results.

Rollback: restore only the prior Explore page commit. **Do not restore static cards to production**; if the real directory hook fails, retain the honest unavailable/empty state rather than reinserting fabricated content.

## 6. Focused test suite additions

### A. Community route tests

Add tests that seed a normal post, an `is_load_test=true` post, an `Apple Reviewer` post, and a `Smoke test post — ignore` post. Assert all of the following for `feed=everyone`, `feed=foryou`, `feed=following`, and `authorId` profile queries:

```ts
expect(response.status).toBe(200);
expect(response.body.posts.map((post: { id: string }) => post.id)).toContain(normalPost.id);
expect(response.body.posts.map((post: { id: string }) => post.id)).not.toContain(loadTestPost.id);
expect(response.body.posts.map((post: { id: string }) => post.id)).not.toContain(appleReviewerPost.id);
expect(response.body.posts.map((post: { id: string }) => post.id)).not.toContain(smokePost.id);
```

Also assert a load-test account receives `{ suppressed: true, reason: "isolated_load_test" }` from `POST /api/community/posts` and no `community_posts` row is inserted.

### B. Explore page tests

Mock `useListBusinesses` with one UUID record and assert the record’s name, city, category, and `/businesses/<uuid>` link render. Assert no strings from the removed fixture list and no rating/safety/recommendation metrics render. Mock `isError` and assert the honest unavailable message renders.

### C. Kinfolk tests

1. With normal schema, an authenticated `What is 2 plus 2?` request returns HTTP 200 and a non-empty assistant reply.
2. With a controlled optional cultural-table `42P01` mock, the same request returns HTTP 200 and logs `optional enrichment unavailable`.
3. With a provider 401/429/timeout mock, verify the existing explicit provider error mapping remains active; the optional-schema fallback must not mask it.

## 7. Final release gate and proof package

Replit must provide these items in one response after deployment:

| Required proof | Pass condition |
| --- | --- |
| Deployment identity | `GET /api/version` shows the new SHA, matching bundle hashes, and `stale_bundle:false` |
| Schema preflight | Text-key Kinfolk foreign keys and `stripe.accounts` exist; startup logs have no recurring migration/schema failure |
| Kinfolk member smoke tests | Both standard and load-test accounts return HTTP 200 with non-empty replies |
| Community database proof | `public_internal_posts = 0` and quarantine table contains the intended selected IDs |
| Community browser proof | Normal member sees no Apple Reviewer, App Reviewer, or smoke-test content in Everyone, For You, and profile feed |
| Explore source proof | Static fixture grep returns no output |
| Explore browser/API proof | Rendered cards are real UUID records and show no fabricated aggregate data |
| Regression proof | Login, Map direct query, Library evidence deep link, and Profile still return expected results |

Only after every item passes may the independent 1 → 5 → 15 → 30 staged production canary begin.


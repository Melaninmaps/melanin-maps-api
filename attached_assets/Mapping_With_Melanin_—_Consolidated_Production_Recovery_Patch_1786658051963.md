# Mapping With Melanin — Consolidated Production Recovery Patch

**One release. One owner. One acceptance gate.**

This is the only package Replit should execute now. It combines the exact current production repairs and explicitly excludes features, redesigns, new data seeding, claims changes, and mobile work.

## 0. Why this release exists

Live audit evidence confirmed the following:

| ID | Verified production failure | User effect | Required repair |
| --- | --- | --- | --- |
| P0-A | `/map?q=Phuket` returns Phuket results while the canvas remains centered on Philadelphia | Tour discovery is misleading | Fit the map to returned MWM coordinates and prevent default home-city/GPS callbacks from overriding search viewport. |
| P0-B | Authenticated `/api/kinfolk/chat` returns HTTP 500 for `What is 2 plus 2?` | Kinfolk cannot be trusted or load-tested | Repair cultural-document schema mismatch, make optional enrichment degrade safely, and restore request-time diagnostic logging. |
| P0-C | `/explore` publishes six static fabricated listings, fake IDs, ratings, safety metrics, recommendation metrics, and trust labels | Violates the no-fake-data rule | Replace fixture cards with real directory results only. |
| P1-D | Directory samples lack phone/hours/website data; events are mostly empty | Tour members cannot reliably contact or plan around listings | Add data-completeness status and an honest UI; enrich only from confirmed public provenance, never fabricated data. |
| P1-E | Community reviewer/smoke-test posts were formerly public | Public-test data leak | Already browser-passing; retain shared load-test exclusion and add proof test. |

> **Out of scope:** new features, prompt tuning, Library expansion, claims redesign, mobile/native work, rate-limit tuning, safety product redesign, pricing, or bulk place seeding. Do not touch these in this release.

---

# 1. P0-A — Fix Map query bounds and delayed home-city override

## File

`artifacts/web/src/pages/map.tsx`

## Cause

`runUniversalSearch()` geocodes a place and pans early, then stores result rows. It does **not** fit the canvas to the returned MWM business coordinates. The initial home-city geocoder or browser geolocation callback can finish afterwards and move the canvas back to Philadelphia.

## Change 1 — add these refs beside `appliedHandoffQueryRef`

```ts
const searchViewportLockedRef = useRef(false);
const searchViewportSequenceRef = useRef(0);
```

## Change 2 — add this helper immediately before `runUniversalSearch`

```ts
const fitMapToBusinessResults = useCallback((businesses: any[]) => {
  const g = (window as any).google?.maps;
  const map = mapRef.current;
  if (!g || !map) return false;

  const points = businesses
    .map((business) => ({
      lat: Number(business.latitude),
      lng: Number(business.longitude),
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  if (points.length === 0) return false;

  searchViewportLockedRef.current = true;
  const sequence = ++searchViewportSequenceRef.current;

  if (points.length === 1) {
    map.panTo(points[0]);
    map.setZoom(14);
    return true;
  }

  const bounds = new g.LatLngBounds();
  points.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, { top: 84, right: 32, bottom: 48, left: 352 });

  g.event.addListenerOnce(map, "idle", () => {
    if (searchViewportSequenceRef.current === sequence && (map.getZoom() ?? 0) > 14) {
      map.setZoom(14);
    }
  });
  return true;
}, []);
```

## Change 3 — replace the result assignment inside `runUniversalSearch`

**Replace:**

```ts
const res = await fetch(`${apiBase}/api/search/universal?${p}`, { credentials: "include" });
if (res.ok) setUniversalResults(await res.json());
```

**With:**

```ts
const res = await fetch(`${apiBase}/api/search/universal?${p}`, { credentials: "include" });
if (res.ok) {
  const payload = await res.json();
  setUniversalResults(payload);

  const fitted = fitMapToBusinessResults(payload?.results?.businesses ?? []);
  if (!fitted && geoLat !== null && geoLng !== null && mapRef.current) {
    searchViewportLockedRef.current = true;
    mapRef.current.panTo({ lat: geoLat, lng: geoLng });
    mapRef.current.setZoom(12);
  }
}
```

Add `fitMapToBusinessResults` to the `useCallback` dependency list.

## Change 4 — block default center from overriding a direct handoff/search

**Replace:**

```ts
if (homeCity) {
```

**With:**

```ts
if (homeCity && !handoffQuery && !searchViewportLockedRef.current) {
```

**Replace the success body of the home-city geocoder callback with:**

```ts
if (!searchViewportLockedRef.current && status === "OK" && results?.[0]?.geometry?.location) {
  map.setCenter(results[0].geometry.location);
  map.setZoom(12);
}
```

**Replace the browser geolocation success body with:**

```ts
if (!searchViewportLockedRef.current) {
  map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  map.setZoom(13);
  setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
}
```

Add `handoffQuery` to the map-initialization effect dependencies. The existing `if (mapRef.current) return;` guard prevents recreation.

## P0-A test

Run authenticated browser tests:

1. Open `/map?q=Phuket`; assert a Phuket result is visible and map center is within 150 km of `7.8804, 98.3923`, not Philadelphia.
2. Open `/map?q=Philadelphia%20braider`; assert Philadelphia result list and Philadelphia-centered map.
3. Search a one-result query; assert zoom 14 and that exact business coordinate is centered.

---

# 2. P0-B — Repair Kinfolk member chat 500

## Files

| File | Change |
| --- | --- |
| `artifacts/api-server/src/lib/startup-migrations.ts` | Add the idempotent cultural-document schema repair after parent tables, then record success only after DDL succeeds. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Degrade optional schema gaps safely; log unexpected request-stage errors. |
| server entrypoint that initializes StripeSync | Run package migrations before StripeSync and do not let nonessential Stripe initialization make normal browsing unavailable. |

## Change 1 — repair the text foreign keys

The parent IDs are `text`. The child foreign keys must also be `text`; the failed `uuid` child declaration cannot work.

```sql
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.kinfolk_entities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canonical_name text NOT NULL,
  entity_type text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kinfolk_source_records (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canonical_url text NOT NULL UNIQUE,
  publisher text NOT NULL,
  title text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('A','B','C')),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kinfolk_cultural_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text REFERENCES public.kinfolk_entities(id) ON DELETE CASCADE,
  source_id text REFERENCES public.kinfolk_source_records(id) ON DELETE SET NULL,
  document_type varchar(48) NOT NULL DEFAULT 'summary',
  language_code varchar(16) NOT NULL DEFAULT 'en',
  geography_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text,
  sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard',
  content text NOT NULL,
  content_tsv tsvector NOT NULL DEFAULT to_tsvector('english', ''),
  embedding_status varchar(24) NOT NULL DEFAULT 'pending',
  status varchar(24) NOT NULL DEFAULT 'held',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kinfolk_cultural_documents
  ALTER COLUMN entity_id TYPE text USING entity_id::text,
  ALTER COLUMN source_id TYPE text USING source_id::text;

ALTER TABLE public.kinfolk_cultural_documents
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_entity_id_fkey,
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_source_id_fkey,
  ADD CONSTRAINT kinfolk_cultural_documents_entity_id_fkey
    FOREIGN KEY (entity_id) REFERENCES public.kinfolk_entities(id) ON DELETE CASCADE,
  ADD CONSTRAINT kinfolk_cultural_documents_source_id_fkey
    FOREIGN KEY (source_id) REFERENCES public.kinfolk_source_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_tsv_idx
  ON public.kinfolk_cultural_documents USING gin (content_tsv);
COMMIT;
```

## Change 2 — add optional-schema guard in `kinfolk.ts`

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

async function optionalKinfolk<T>(stage: string, fallback: T, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (!isOptionalSchemaGap(err)) throw err;
    logger.warn({ stage, pgCode: pgCode(err) }, "Kinfolk optional enrichment unavailable");
    return fallback;
  }
}
```

Wrap **only** optional cultural phrases, cultural-document context, and session-memory reads/writes with `optionalKinfolk`. Do **not** wrap authentication, authorization, input validation, the provider request, or mandatory database writes. Those must remain visible errors.

Example replacement:

```ts
const culturalPhrases = await optionalKinfolk(
  "cultural_phrases",
  [] as Array<{ group_name: string; phrase: string; english_gloss: string }>,
  () => getCachedCulturalPhrases(),
);
```

Add a `chatStage` variable before each mandatory boundary (`context_resolution`, `prompt_build`, `provider_call`, `session_persist`) and log it with `pgCode`, error name, truncated message, and truncated stack on unexpected failures.

## Change 3 — StripeSync start order

Before calling `getStripeSync()`, run the version-matched `stripe-replit-sync` migration runner. Then require this condition:

```ts
const { rows: [{ exists }] } = await pool.query<{ exists: boolean }>(
  "SELECT to_regclass('stripe.accounts') IS NOT NULL AS exists",
);
if (!exists) throw new Error("stripe-replit-sync migrations completed without stripe.accounts");
```

StripeSync must remain nonblocking for normal browsing. If its nonessential initialization fails, log it and expose an explicit unavailable diagnostic; do not turn `/api/readyz` or member browsing falsely green/false red.

## P0-B test

1. Verify migrations: no missing `stripe.accounts` or failed `kinfolk_cultural_documents` entry at boot.
2. `POST /api/kinfolk/chat` with `What is 2 plus 2?` returns HTTP 200 and a non-empty reply for a normal member.
3. Repeat with `mwm-loadtest-01@loadtest.mwm.internal`; it also returns HTTP 200.
4. Simulate a missing optional cultural table locally/staging; chat must respond 200 without optional context and emit only an `optional enrichment unavailable` warning.

---

# 3. P0-C — Remove Explore fixtures; render real directory listings only

## File

`artifacts/web/src/pages/explore.tsx`

## Change 1 — replace imports

**Replace:**

```ts
import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Grid, Map as MapIcon, Star, X } from "lucide-react";
import { useState } from "react";
```

**With:**

```ts
import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Grid, Map as MapIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
```

## Change 2 — delete all fixture data

Delete `staticBusinesses` completely (the entire declaration currently beginning `const staticBusinesses = [`). Delete every use of `confidenceScore`, `recommend`, `returnAlone`, `safety`, `featured`, and static `tags`.

## Change 3 — use only API rows and only source-supported fields

Immediately after state declarations add:

```ts
const liveBusinesses = useMemo(() => {
  const raw = Array.isArray((apiBusinesses as any)?.businesses)
    ? (apiBusinesses as any).businesses
    : Array.isArray(apiBusinesses)
      ? apiBusinesses
      : [];

  return raw.filter((business: any) =>
    typeof business?.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(business.id) &&
    business.status !== "archived" &&
    business.flagStatus !== "confirmed_fake",
  );
}, [apiBusinesses]);

const filtered = useMemo(() => liveBusinesses.filter((business: any) => {
  const categoryText = String(business.category ?? "").toLowerCase();
  const queryText = `${business.name ?? ""} ${business.city ?? ""} ${business.state ?? ""} ${business.category ?? ""}`.toLowerCase();
  const categoryMatches = activeCategory === "All" || categoryText.includes(activeCategory.toLowerCase());
  const queryMatches = !searchQuery.trim() || queryText.includes(searchQuery.trim().toLowerCase());
  return categoryMatches && queryMatches;
}), [liveBusinesses, activeCategory, searchQuery]);
```

> Do not render an ownership badge unless it comes from an explicit stored designation with the correct source status. Never infer race, ethnicity, gender, disability, or other identity from a business name, image, location, or description.

## Change 4 — replace the metric-heavy card body

Use this card instead of the fixture-dependent card:

```tsx
{filtered.map((business: any) => (
  <article key={business.id} className="bg-white rounded-2xl overflow-hidden border border-[#3A1F0E]/5 flex flex-col">
    {business.imageUrl ? (
      <img src={business.imageUrl} alt="" className="h-52 w-full object-cover" />
    ) : (
      <div className="h-52 bg-[#2B1507]" aria-hidden="true" />
    )}
    <div className="p-6 flex flex-col flex-1">
      <p className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider mb-2">
        {business.category || "Business"} · {[business.city, business.state].filter(Boolean).join(", ")}
      </p>
      <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">{business.name}</h3>
      {business.description ? <p className="text-sm text-[#3A1F0E]/70 mb-4 flex-1">{business.description}</p> : null}
      {business.verified === true ? <p className="text-xs text-[#3A1F0E]/60 mb-4">Verified listing</p> : null}
      <Link href={`/businesses/${business.id}`} className="w-full">
        <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">View details</Button>
      </Link>
    </div>
  </article>
))}
```

## Change 5 — honest empty/loading states

```tsx
if ((apiBusinesses as any)?.isLoading) {
  return <p className="text-sm text-[#3A1F0E]/60">Loading real listings…</p>;
}

if (filtered.length === 0) {
  return <p className="text-sm text-[#3A1F0E]/60">No matching verified or community-listed businesses are available yet. Try the map or a different search.</p>;
}
```

Remove the false `Showing 6 of 200+ results` and membership claim tied to hidden data. A membership screen may be linked only if it is truthful and not used to disguise unavailable listings.

## P0-C source proof

This must return no output before build:

```bash
grep -nE 'staticBusinesses|The Gathering Table|Heritage Boutique Hotel|Diaspora Arts Collective|confidenceScore|recommend:|returnAlone|Community Trusted|Top Rated|200\\+|/businesses/[1-6]' artifacts/web/src/pages/explore.tsx
```

---

# 4. P1-D — Make listing contact/hours honest and repair data completeness without inventing data

## Database fields already exist

`businesses.phone`, `businesses.website`, and `businesses.hours` already exist. The failure is primarily data completeness, not a missing column.

## Change 1 — add provenance and completeness columns

Add this idempotent migration in `startup-migrations.ts`:

```sql
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS contact_source_url text,
  ADD COLUMN IF NOT EXISTS contact_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_completeness varchar(24) NOT NULL DEFAULT 'unknown';

UPDATE public.businesses
SET contact_completeness = CASE
  WHEN coalesce(nullif(trim(phone), ''), '') <> ''
   AND coalesce(nullif(trim(website), ''), '') <> ''
   AND coalesce(nullif(trim(hours), ''), '') <> '' THEN 'complete'
  WHEN coalesce(nullif(trim(phone), ''), '') <> ''
    OR coalesce(nullif(trim(website), ''), '') <> ''
    OR coalesce(nullif(trim(hours), ''), '') <> '' THEN 'partial'
  ELSE 'unknown'
END
WHERE contact_completeness = 'unknown';

CREATE INDEX IF NOT EXISTS businesses_contact_completeness_city_idx
  ON public.businesses (city, contact_completeness)
  WHERE status = 'active';
```

## Change 2 — do not fabricate contact details

The enrichment worker may populate phone/website/hours only if a public official website, verified Google Business profile, or owner submission is stored in `contact_source_url`. If no such source exists, leave the field empty and show `Contact details have not been provided`—not made-up hours, phone, or website.

## Change 3 — add an internal verification query

```sql
SELECT
  city,
  count(*) AS active_listings,
  count(*) FILTER (WHERE contact_completeness = 'complete') AS complete_contact,
  count(*) FILTER (WHERE contact_completeness = 'partial') AS partial_contact,
  count(*) FILTER (WHERE contact_completeness = 'unknown') AS unknown_contact
FROM public.businesses
WHERE status = 'active'
GROUP BY city
ORDER BY unknown_contact DESC, city;
```

Tour criteria: Each marketed city must have a founder-approved minimum number of real, currently active listings with source-backed contact details. Do not substitute row count for data quality.

---

# 5. P1-E — retain Community isolation proof

No new UI change is required if the clean feed remains live. Ensure every feed query uses a shared predicate:

```sql
AND coalesce(u.is_load_test, false) = false
```

and that test/reviewer fixture accounts are flagged `is_load_test=true` or have posts quarantined. Test both `Everyone` and `Following` feeds under an ordinary member session.

---

# 6. Single release order and no-go rules

1. Branch from the current live commit.
2. Change only the files listed in Sections 1–5.
3. Run unit/browser tests and the Explore source proof.
4. Run database preflight; apply the Kinfolk schema migration once through startup migrations.
5. Build source and the actual root-served static artifacts together.
6. Commit source, `dist/index.mjs`, `dist/BUILD_IDENTITY`, root `web-static/index.html`, and referenced JS/CSS assets together.
7. Deploy once.
8. Collect the proof package in Section 7.

**No-go:** If any test fails, do not deploy a partial release; fix that exact test on the branch. Do not start the 30-user canary. Do not add a new feature.

# 7. Binary production acceptance gate

| Test | Required production proof |
| --- | --- |
| Deployment identity | New SHA; matching bundle hashes; `stale_bundle:false` |
| Database | `/api/readyz`: database `ok`, pool `waiting:0` |
| Kinfolk normal user | `POST /api/kinfolk/chat` returns 200 and non-empty reply |
| Kinfolk load-test user | Same 200 result, independent session |
| Phuket map | Result list plus visual map center within 150 km of Phuket |
| Philadelphia map | Result list plus visual map center within 150 km of Philadelphia |
| Explore | No fixture text, fake IDs, fabricated ratings, safety metrics, recommendation metrics, or fabricated identity labels |
| Community | No reviewer/smoke/load-test content in Everyone or Following |
| Library | African Diaspora direct evidence topic opens with sources |
| Contact baseline | Per-city completeness query included in release proof; missing data explicitly labeled rather than hidden or invented |

Only when **every** line passes will Manus run the guarded staged **1 → 5 → 15 → 30** canary. A failed line blocks it. There is no conditional “close enough” approval.

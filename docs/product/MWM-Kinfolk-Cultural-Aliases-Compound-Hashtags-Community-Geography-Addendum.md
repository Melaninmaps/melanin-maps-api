# MWM Kinfolk Cultural Aliases, Compound Hashtags, and Community Geography Addendum

**Author:** Manus AI  
**Status:** Implementation specification â no production data or aliases created  
**Applies to:** `MWM_Replit_Kinfolk_Cultural_Priority_Vector_and_Whats_Happening_Implementation.md`, `MWM_Kinfolk_No_Guess_Cultural_Context_Implementation_Orders.md`, and `MWM_Community_Media_Hashtag_Whats_Happening_Implementation.md`.

## 1. Founder outcome

Kinfolk must understand the names, shorthand, hashtags, nicknames, neighborhoods, and community language that give a search its cultural meaning. This is not a universal guessing engine and it is not a fixed celebrity list. It is a governed, continuously extensible context system.

A member must be able to share a public post with `#beyonceNYCconcert` and a video. A permitted search for **BeyoncÃ© concerts**, **BeyoncÃ© NYC**, **Bey**, or **Queen B** should find the post when the post is public or visible to that searcher. The result must be labeled as a member-shared video or post; it cannot be presented as an official BeyoncÃ© event, verified artist news, or Library fact merely because the tag matches.

A member must also be able to propose community location language. For example, a proposed relationship such as `Uptown` â `Mount Airy, Philadelphia` is valid only **within the stated Philadelphia geographic context** after the proposal has reached the evidence/review threshold. It must not cause Kinfolk to resolve `Uptown` in Atlanta, New York, Chicago, or another city as Philadelphia. A community-contributed alias can improve interpretation but cannot override a userâs explicit city, address, map selection, or exact place name.

> **Explicit query context wins. City-scoped verified alias wins next. A global alias or semantic match never overrides a conflicting stated location. If unresolved, Kinfolk asks one clear question.**

## 2. Two separate concepts that must not be conflated

| Concept | Example | Purpose | Publication rule |
| --- | --- | --- | --- |
| **Post tag / compound hashtag** | `#beyonceNYCconcert` | Helps members find related posts and media. | The post stores it immediately after normal community policy checks. It becomes searchable only inside the readerâs visibility permissions. |
| **Cultural entity alias** | `Bey` â BeyoncÃ© Knowles-Carter; `Queen B` â BeyoncÃ© Knowles-Carter | Resolves a person, artist, work, organization, or culture topic in Kinfolk search. | Requires source-backed registry entry or curator-approved community threshold. |
| **Community geographic alias** | `Uptown` â a proposed community region within Philadelphia | Interprets a place term inside a defined geographic scope. | Requires a place scope, provenance, confidence, and curator/community validation. |
| **Location name / official boundary** | `Mount Airy, Philadelphia, PA` | Canonical map/discovery geography. | Comes from a canonical geospatial record; never silently replaced by a nickname. |

A hashtag is a retrieval signal, not a factual claim. An alias is an interpretive record. A geographic alias must always be constrained by its parent geography.

## 3. Exact compound-hashtag requirements

### 3.1 Store the original and normalized forms

When a member posts `#beyonceNYCconcert`, save:

```json
{
  "displayTag": "beyonceNYCconcert",
  "normalizedTag": "beyoncenycconcert",
  "tokens": ["beyonce", "nyc", "concert"],
  "entityCandidates": ["beyonce_knowles_carter"],
  "placeCandidates": ["new_york_city_ny"],
  "intentCandidates": ["concert", "live_music"]
}
```

The first two fields are created synchronously when the post is saved. `tokens`, `entityCandidates`, `placeCandidates`, and `intentCandidates` are created asynchronously by a governed tag parser. A parser failure must never block the post or fabricate a relationship.

### 3.2 Deterministic matching priority

For a search such as `BeyoncÃ© concerts NYC`, evaluate in this order:

1. Apply viewer visibility authorization before retrieval.
2. Match a canonical entity ID or an approved entity alias.
3. Match an explicit geography (`NYC`, `New York City`) against the canonical place/entity relation.
4. Match event/media intent (`concert`, `tour`, `live`, `show`).
5. Match post tags/tokens and post text with full-text search.
6. Use vector similarity only to rank already eligible, already scoped candidates.

A public post tagged `#beyonceNYCconcert` can score for this request only if its resolved entity, place, and intent support the query. It cannot appear first for `BeyoncÃ© Atlanta concert` merely because `BeyoncÃ©` has high semantic similarity.

### 3.3 Alias expansion is not automatic global matching

Approved aliases for a canonical entity can be used as a recall expansion in the search index:

| Query | Approved expansion | Result requirement |
| --- | --- | --- |
| `Bey` | BeyoncÃ© Knowles-Carter | Return an entity-interpreted result with a small explanation if ambiguity is material. |
| `Queen B` | BeyoncÃ© Knowles-Carter **only if source-backed/approved** | Expand only after the cultural alias record is active. |
| `Beyonce NYC` | BeyoncÃ© + New York City | Require the geographic match; do not return every BeyoncÃ© post. |
| `Natalie` | No default person | Ask âWhich Natalie do you mean?â or show disambiguation choices. |
| `Annie` with explicit Nigeria context | Use Nigerian scoped candidates first | Resolve only if a source-backed candidate is dominant; otherwise ask a question. |

No alias may be created only because an LLM recognizes a common nickname. The system requires a source-backed record, scope, relationship type, language/region context, and status.

## 4. Additive database schema

Use `pg_trgm` and the approved vector/full-text architecture, but do not rely on vector retrieval as a source of truth.

```sql
CREATE TABLE IF NOT EXISTS cultural_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key text NOT NULL UNIQUE,
  entity_type text NOT NULL CHECK (entity_type IN ('person','artist','work','event_series','organization','team','school','place','topic')),
  display_name text NOT NULL,
  description text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','held','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cultural_entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES cultural_entities(id) ON DELETE CASCADE,
  alias_text text NOT NULL,
  normalized_alias text NOT NULL,
  alias_type text NOT NULL CHECK (alias_type IN ('official','stage_name','nickname','community_term','translation','hashtag','misspelling')),
  language_code text NULL,
  country_code text NULL,
  region_scope jsonb NULL,
  source_url text NULL,
  source_tier text NOT NULL CHECK (source_tier IN ('tier_a_official','tier_b_reputable','tier_c_community')),
  confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','active','held','rejected','retired')),
  proposed_by_user_id uuid NULL REFERENCES users(id),
  reviewed_by_user_id uuid NULL REFERENCES users(id),
  reviewed_at timestamptz NULL,
  rationale text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, normalized_alias, COALESCE(language_code, ''), COALESCE(country_code, ''))
);

CREATE INDEX IF NOT EXISTS cultural_entity_aliases_lookup_idx
  ON cultural_entity_aliases(normalized_alias, status);

CREATE TABLE IF NOT EXISTS canonical_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  place_type text NOT NULL CHECK (place_type IN ('country','region','state','county','city','neighborhood','district','venue','service_area')),
  parent_place_id uuid NULL REFERENCES canonical_places(id),
  country_code text NULL,
  state_or_region_code text NULL,
  latitude numeric NULL,
  longitude numeric NULL,
  geocode_source_url text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','held','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(canonical_name, place_type, parent_place_id)
);

CREATE TABLE IF NOT EXISTS community_place_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_place_id uuid NOT NULL REFERENCES canonical_places(id) ON DELETE CASCADE,
  alias_text text NOT NULL,
  normalized_alias text NOT NULL,
  city_scope_place_id uuid NULL REFERENCES canonical_places(id),
  state_scope text NULL,
  country_scope text NULL,
  alias_kind text NOT NULL CHECK (alias_kind IN ('neighborhood_name','historic_name','community_name','transliteration','local_short_name')),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','community_threshold_met','active','held','rejected','retired')),
  confidence numeric(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence >= 0 AND confidence <= 1),
  evidence_count integer NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  proposed_by_user_id uuid NULL REFERENCES users(id),
  reviewed_by_user_id uuid NULL REFERENCES users(id),
  reviewed_at timestamptz NULL,
  rationale text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(normalized_alias, canonical_place_id, COALESCE(city_scope_place_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

CREATE INDEX IF NOT EXISTS community_place_aliases_scope_idx
  ON community_place_aliases(normalized_alias, city_scope_place_id, status);

CREATE TABLE IF NOT EXISTS community_place_alias_evidence (
  alias_id uuid NOT NULL REFERENCES community_place_aliases(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK (evidence_type IN ('member_proposal','member_confirmation','public_source','curator_research')),
  member_fingerprint text NULL,
  source_url text NULL,
  source_tier text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(alias_id, evidence_type, COALESCE(member_fingerprint, ''), COALESCE(source_url, ''))
);

CREATE TABLE IF NOT EXISTS community_post_tag_contexts (
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  normalized_tag text NOT NULL,
  tokens text[] NOT NULL DEFAULT '{}',
  entity_id uuid NULL REFERENCES cultural_entities(id),
  place_id uuid NULL REFERENCES canonical_places(id),
  intent_label text NULL,
  extraction_status text NOT NULL DEFAULT 'queued' CHECK (extraction_status IN ('queued','resolved','ambiguous','held','failed')),
  confidence numeric(4,3) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id, normalized_tag)
);
```

### Privacy requirement for place evidence

The Library Growth Engineâs privacy model applies here. Member identifiers must not be exposed in public alias counts. Use rotating one-way member fingerprints and require at least **10 distinct eligible members** for a community-only geographic alias to move from `proposed` to `community_threshold_met`. A curator can independently activate an alias from credible public/local source evidence without waiting for 10 members. Load-test accounts are excluded.

## 5. Place-resolution algorithm

Implement `resolvePlaceAlias(query, explicitContext)` before general entity/vector retrieval.

```ts
function resolvePlaceAlias(input: {
  rawTerm: string;
  explicitCity?: string;
  explicitState?: string;
  gpsCity?: string; // only when user has opted in for this request
  savedPlaceIds?: string[]; // explicit member saves only
}): PlaceResolution {
  // 1. Explicit city/state in query is the hard scope.
  // 2. Explicit one-time location/map selection is secondary.
  // 3. Saved places can rank candidates but never override explicit scope.
  // 4. Query active aliases by normalized term and city/state scope.
  // 5. If exactly one active alias matches the hard scope: resolve.
  // 6. If candidates conflict or none are active: ask one concise question.
}
```

For `Uptown`:

- `âUptown in Phillyâ` can resolve only against active Philadelphia-scoped candidates.
- `âUptown Atlantaâ` can resolve only against active Atlanta-scoped candidates.
- `âUptownâ` with no city and no trustworthy explicit context must ask: **âDo you mean Uptown in which city?â** It must not assume Philadelphia because a member previously saved Mount Airy or because a large number of community posts use that term.

The founder-provided Mount Airy/Uptown relationship is a valid **community proposal**, not an automatically active global fact. Replit must enter it in a non-production seed/curator fixture and validate the scoped behavior before activating it in production.

## 6. Safe broad-web research boundary

The founderâs phrase âsearch everything across the webâ should be implemented as **broad, governed public-web research**, not unrestricted scraping or automatic belief.

| Allowed behavior | Prohibited behavior |
| --- | --- |
| Search reputable, official, institutional, licensed, and accessible public sources according to query risk. | Treat a search snippet, social post, unverified page, or LLM memory as fact. |
| Use public source metadata to propose aliases, topics, and Library candidates. | Automatically publish new facts, aliases, safety alerts, or Library sources without the defined validation state. |
| Search diverse cultural, regional, diaspora, Spanish-language, and English-language sources when query/context warrants it. | Infer a memberâs ethnicity, language identity, political views, religion, health status, or nationality from name, appearance, location, or browsing history. |
| Offer Spanish/English presentation when the member explicitly sets `dual` or asks for it. | Translate or search-target a member based only on a presumed ethnicity. |
| Retain canonical URL, source tier, source status, and extraction provenance. | Copy whole copyrighted pages, circumvent paywalls, log in to sources, or scrape prohibited content. |

For a culturally relevant query, Kinfolk must construct a retrieval plan containing: explicit query terms; canonical entity/place candidates; explicit city/country; language setting; source risk tier; and a `requiresClarification` flag. It then retrieves sources and MWM content through ordinary authorization rules. If credible evidence does not support the intended context, Kinfolk asks a question rather than making cultural assumptions.

## 7. Exact API additions

| Method and route | Purpose | Authorization |
| --- | --- | --- |
| `POST /api/community/place-aliases` | Propose a scoped community place alias with canonical place target and optional public source. | Authenticated member; rate limited. |
| `GET /api/community/place-aliases?term=&city=` | Returns active, safe alias choices for a member-facing confirmation UI. | Authenticated member. |
| `POST /api/community/place-aliases/:id/confirm` | Records a privacy-protected confirmation from a distinct member. | Authenticated member; no self-confirmation; one confirmation/alias/member. |
| `GET /api/community/hashtags/:tag` | Returns only posts the caller may read plus safe aggregate public count. | Authenticated member. |
| `GET /api/community/entities/:alias` | Returns active disambiguation choices only; no speculative entity. | Authenticated member. |
| `POST /api/admin/cultural-aliases/:id/approve` | Approves/rejects an alias with written reason and provenance. | Authorized administrator only. |
| `POST /api/admin/place-aliases/:id/approve` | Activates/rejects a geographic alias with written reason. | Authorized administrator only. |

All ordinary-member requests must be protected by per-member limits. Alias proposals: 5 per 24 hours; confirmations: 20 per 24 hours; context extraction worker jobs are deduplicated by post/tag/content hash. No alias notification, email, direct message, business alert, Circle event, or external outreach is sent in this release.

## 8. Required regression tests

| ID | Test | Required result |
| --- | --- | --- |
| ALIAS-01 | Public post with `#beyonceNYCconcert` and a clean member video. | Post, tag, and video appear to permitted readers after reload. |
| ALIAS-02 | Search `BeyoncÃ© concerts NYC`. | The authorized post is retrievable through canonical entity + NYC + concert mapping and labeled `Member shared`. |
| ALIAS-03 | Search `Bey` and `Queen B`. | Each resolves only through an active, source-backed alias; otherwise a clarification is shown. |
| ALIAS-04 | Search `BeyoncÃ© Atlanta concert`. | NYC-only post does not rank as an Atlanta result. |
| ALIAS-05 | Follower-only `#beyonceNYCconcert` post. | Author/follower can find it; unrelated member, public hashtag count, global topic, and Kinfolk global context cannot. |
| ALIAS-06 | Member proposes `Uptown` for a Philadelphia place. | Stored as `proposed`, scoped to Philadelphia, not used as an active global resolver. |
| ALIAS-07 | Search `Uptown in Philly` with active Philadelphia alias fixture. | Correct Philadelphia target is returned with alias context label. |
| ALIAS-08 | Search `Uptown Atlanta`. | Philadelphia alias is excluded. |
| ALIAS-09 | Search `Uptown` without city. | A city clarification is requested; no automatic Philadelphia result. |
| ALIAS-10 | Ten distinct privacy-protected community confirmations. | Alias reaches threshold state; no member IDs or confirmation list are exposed. |
| ALIAS-11 | Ambiguous person `Natalie`. | No default mainstream entity; Kinfolk asks a concise question. |
| ALIAS-12 | Explicit Spanish/English dual preference. | Diverse language source retrieval/output is available and labeled; no ethnicity inference. |
| ALIAS-13 | Unsafe/unverified social source proposes celebrity claim. | Kept as a community post/link only; does not activate an entity alias or Library fact. |
| ALIAS-14 | Admin endpoint called by normal tester. | HTTP 403. |

## 9. Required proof package

Replit must submit one Railway deployment proof package containing: migration and index proof; anonymized seed fixture for the BeyoncÃ© tag/entity and the two city-scoped Uptown aliases; a three-account visibility transcript; query logs showing City hard filtering; active alias provenance; threshold/fingerprint proof without personal identifiers; browser screenshots/video for ALIAS-01 through ALIAS-09; and all automated-test results.

Manus will independently verify the live deployment with an isolated account. No founder-provided celebrity tag, local alias, or safety-relevant source becomes a production-global fact until the correct provenance and state gates have passed.

## References

[1] [pgvector â Official documentation](https://github.com/pgvector/pgvector)  
[2] [PostgreSQL â Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)  
[3] [FEMA â Wireless Emergency Alerts](https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/public/wireless-emergency-alerts)

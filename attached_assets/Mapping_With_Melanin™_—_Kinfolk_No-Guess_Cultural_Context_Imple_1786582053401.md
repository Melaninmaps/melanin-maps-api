# Mapping With Melanin™ — Kinfolk No-Guess Cultural Context Implementation Orders

**Status:** Founder-directed build order. **Audience:** Replit engineering. **Goal:** Replace ad hoc celebrity-name matching and model-memory answers with an always-on, source-governed cultural-context layer that resolves the member’s meaning across every supported domain.

> **Release rule:** Kinfolk may answer from a verified contextual resolution, ask one concise clarifying question, or say it cannot confirm. It must never invent a director, select an unrelated namesake, substitute a generic global result for a culturally relevant one, or fill a recommendation list with an unrelated city/category.

This package is an implementation order. Replit must not treat a 50+ celebrity list as completion. A seed list is only the first governed data set for an intelligence layer that applies to **every** search.

---

## 0. Non-negotiable acceptance statement

Kinfolk must continuously use, in this order:

1. **The member’s exact current words**: name, group, role, title, year, city, language, service, and stated community/support preference.
2. **Verified public cultural and factual context** about the searched work, person, institution, or business.
3. **Explicit and revocable member preferences only**: `culturalInterests`, `diasporaCountries`, `preferredOwnershipTypes`, and the new opt-in support-priority fields.
4. **Permitted location**: explicit request location, member-granted current location, then saved home city. Never IP-derived location.
5. **Domain-appropriate authoritative data**: MWM catalog for local business discovery; official school/licensure/government sources for education/regulated areas; source-governed entity records for culture.

Kinfolk must **not** infer ethnicity, culture, language, nationality, religion, race, gender, support priorities, political views, health status, or wealth from a member’s name, profile image, city, writing style, contacts, or past searches.

---

## 1. The three output states: answer, clarify, or cannot confirm

Implement these states in one deterministic resolver. The language model must not choose among them.

| Resolver state | When it is allowed | Required member experience |
| --- | --- | --- |
| `resolved` | One source-backed candidate clearly wins after explicit-message context and verified public context are scored. | Answer directly, identify the source basis where a factual claim is made, and do not add unrelated MWM listings. |
| `needs_clarification` | Two or more candidates remain materially plausible after context scoring. | Ask one short question with 2–3 realistic options; do not lead with a generic global celebrity. |
| `unconfirmed` | No active source-backed candidate exists, source evidence conflicts, or a source is stale/held. | Say what cannot be confirmed, ask for a useful qualifier, and offer a neutral next step. Never fabricate. |

### Required behavior examples

| Member query | Correct state | Correct behavior |
| --- | --- | --- |
| “Who directed the movie *Sinners*? It was one of my favorites.” | `resolved` | Resolve the 2025 Ryan Coogler film from official material; answer Ryan Coogler. [1] [2] |
| “Who directed *Sinners* (1969)?” | `resolved` or `needs_clarification` | Use the explicit year. If no verified 1969 entity exists in the registry/retrieval source, say it cannot confirm that title/year—not the 2025 answer. |
| “Tell me about Michelle Williams from Destiny’s Child.” | `resolved` | Resolve Michelle Williams, member of Destiny’s Child; no Chicago restaurant suggestions. [3] |
| “Tell me about Michelle Williams.” | `needs_clarification` unless a reliable explicit qualifier exists | Ask which Michelle Williams the member means. Do not default to an actor, singer, or cultural figure solely from their name. |
| “Natalie” | `needs_clarification` | Ask for one disambiguator such as field, country, group, show, or song. Do not default to Natalie Portman. |
| A member who opted into Nigerian culture/business context asks “Tell me about Annie.” | `resolved` only if the query/context and verified entity data distinguish Annie Macaulay; otherwise `needs_clarification`. | The member’s explicit Nigerian context can rank Annie Macaulay as a likely option, but Kinfolk must state that basis or ask. Use only source-supported roles; do **not** call her a singer without a reputable source supporting that claim. [4] [5] |
| “What do you think about Kendrick and Drake?” | `resolved` for topic; `opinion_mode` response | Give a clearly labeled cultural reading/opinion, distinguish facts from analysis, summarize multiple perspectives, and avoid claiming a single objective winner. |
| “What colleges are near me?” | `resolved` only with permitted location; otherwise `needs_clarification` | Provide nearby schools, then separate “HBCU options to explore” by real distance/source. Do not replace Temple with an HBCU or vice versa. [6] [7] |

---

## 2. Strict source hierarchy: no source, no factual seed

### 2.1 Source tiers

| Tier | Allowed source | Permitted use | Not permitted use |
| --- | --- | --- | --- |
| A | Official work/studio/publisher/artist page; government; university; professional licensing board; official league/team; official institution record | Canonical facts, credits, official URLs, credential/location/education facts | Opinion, community popularity, unverified biography claims |
| B | Reputable original reporting or established trade/cultural publication | Context, chronology, reported public discussion, corroboration | Sole proof of a professional credential or private fact |
| C | Verified/public creator or business social profile, official booking page, or established platform profile | Identifying independent creators/providers, public service area, current public link | Medical/legal/financial credential claim; verification badge |
| D | Community contribution or open web result | Candidate generation only | Automatic public factual seed, owner identity, credential, or verification |

A source record is active only if it has a `checked_at` timestamp, an allowed tier, an HTTP-valid/accessible canonical destination, a defined `claim_scope`, and no `held`/`stale` status.

### 2.2 Required source fields

```sql
CREATE TYPE source_tier AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE source_status AS ENUM ('active', 'held', 'stale', 'rejected');

CREATE TABLE kinfolk_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url text NOT NULL,
  publisher text NOT NULL,
  title text NOT NULL,
  tier source_tier NOT NULL,
  claim_scope text[] NOT NULL,
  source_status source_status NOT NULL DEFAULT 'held',
  checked_at timestamptz,
  http_status integer,
  redirect_url text,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_url)
);
```

**Do not seed a fact from a bare model response, a search-result snippet, a Wikipedia page, a random blog, or a social-media repost.** Those can produce a `candidate` for a curator/source-validation pipeline, but cannot cause Kinfolk to state a source-backed fact as resolved.

---

## 3. Database migration: add governed intelligence data without changing existing features

Create one additive, idempotent migration named `kinfolk_cultural_context_v1`. Add it to the established startup-migration registry. It may not alter existing user records, business ownership, claims, community feedback, Library source rows, sessions, login, map initialization, or Safety Hub data.

### 3.1 Entity tables

```sql
CREATE TYPE kinfolk_entity_type AS ENUM (
  'person', 'work', 'group', 'institution', 'place', 'team', 'event', 'movement'
);
CREATE TYPE entity_resolution_status AS ENUM ('active', 'held', 'stale', 'retired');

CREATE TABLE kinfolk_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  entity_type kinfolk_entity_type NOT NULL,
  normalized_name text NOT NULL,
  short_summary text,
  country_codes text[] NOT NULL DEFAULT '{}',
  language_codes text[] NOT NULL DEFAULT '{}',
  cultural_context_tags text[] NOT NULL DEFAULT '{}',
  era_start smallint,
  era_end smallint,
  resolution_status entity_resolution_status NOT NULL DEFAULT 'held',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, normalized_name)
);

CREATE TABLE kinfolk_entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  alias_type text NOT NULL,
  locale text,
  confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  UNIQUE (entity_id, normalized_alias, alias_type)
);

CREATE TABLE kinfolk_entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  to_entity_id uuid NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES kinfolk_source_records(id),
  UNIQUE (from_entity_id, relationship_type, to_entity_id)
);

CREATE TABLE kinfolk_entity_source_links (
  entity_id uuid NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES kinfolk_source_records(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, source_id)
);

CREATE INDEX kinfolk_entity_alias_lookup_idx
  ON kinfolk_entity_aliases (normalized_alias);
CREATE INDEX kinfolk_entity_status_idx
  ON kinfolk_entities (resolution_status, entity_type);
```

### 3.2 Education tables

```sql
CREATE TABLE education_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  institution_type text NOT NULL,
  official_url text NOT NULL,
  city text NOT NULL,
  state text,
  country_code char(2) NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  hbcu_status boolean NOT NULL DEFAULT false,
  minority_serving_designations text[] NOT NULL DEFAULT '{}',
  program_tags text[] NOT NULL DEFAULT '{}',
  source_id uuid NOT NULL REFERENCES kinfolk_source_records(id),
  source_status source_status NOT NULL DEFAULT 'held',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);
CREATE INDEX education_institutions_geo_idx ON education_institutions(city, state, country_code);
```

### 3.3 Explicit, revocable preference fields

Add only these fields to `user_preferences`; default values preserve current behavior.

```sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS support_priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_cultural_affinity_ranking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_response_languages jsonb NOT NULL DEFAULT '["en"]'::jsonb,
  ADD COLUMN IF NOT EXISTS multilingual_expansion_mode varchar(16) NOT NULL DEFAULT 'ask'
    CHECK (multilingual_expansion_mode IN ('off', 'ask', 'dual'));
```

Never store sensitive medical, legal, relationship, immigration, or safety searches in these fields. Never write a preference from a search unless the member affirmatively saves it through the preference UI.

---

## 4. Seed order: exact procedure, no bulk guessing

### Step 4.1 — Seed curated source records first

Create `artifacts/api-server/src/data/kinfolk-cultural-context-sources-v1.ts`. Each source must be reviewed before it is inserted as `active`.

```ts
type SourceSeed = {
  canonicalUrl: string;
  publisher: string;
  title: string;
  tier: 'A' | 'B' | 'C';
  claimScope: string[];
  expectedHost: string;
  expectedStatus: 200 | 301 | 302;
};
```

The initial source manifest must include at minimum:

| Seed domain | Required source basis |
| --- | --- |
| *Sinners* (2025) | Official film/HBO Max/Warner material that identifies Ryan Coogler and the work. [1] [2] |
| Michelle Williams | Her official biography, which identifies her as a Destiny’s Child member. [3] |
| Annie Macaulay | A reputable Nigerian entertainment reference plus a source she controls or a recognized industry database. Do not label a profession beyond those sources. [4] [5] |
| HBCU catalog | White House Initiative / Department of Education list. [6] |
| Temple University | Temple’s official site. [7] |
| Professional health/legal/financial discovery | The relevant government, board, institution, or licensing directory—not community sources. |

### Step 4.2 — Validate sources before activation

Create `scripts/validate-kinfolk-source-manifest.ts`. For every seed record, it must:

1. Reject missing `https://` URLs, private/internal IPs, and non-allowlisted redirect destinations.
2. Perform a bounded `HEAD`, then a bounded `GET` if the publisher disallows `HEAD`.
3. Store final canonical URL, HTTP status, redirect URL, retrieval time, and content hash.
4. Set `active` only for expected status and source schema validity.
5. Set `held` for 404/410, blocked, noncanonical, content-mismatched, or unreviewed source records.
6. Produce a machine-readable validation manifest and a human-readable exceptions report.

It must never silently replace a broken URL with a guessed URL.

### Step 4.3 — Seed entities and relationships

Create `artifacts/api-server/src/data/kinfolk-cultural-context-entities-v1.ts` with the following type.

```ts
type EntitySeed = {
  canonicalName: string;
  entityType: 'person' | 'work' | 'group' | 'institution' | 'place' | 'team' | 'event' | 'movement';
  aliases: Array<{ alias: string; aliasType: 'title' | 'stage_name' | 'former_name' | 'group_context' | 'locale'; confidence: number }>;
  contextTags: string[];
  sourceUrls: string[];
  relationships: Array<{ type: 'directed_by' | 'member_of' | 'stars_in' | 'located_in' | 'historically_black_college'; targetCanonicalName: string; sourceUrl: string }>;
};
```

An entity becomes `active` only if every factual relationship used in response generation points to an active source record. Otherwise it remains `held` and is not used to resolve an answer.

### Step 4.4 — Seed education institutions separately

Do not put schools into the generic business catalog. Create a staged education import from the official HBCU list plus official institution pages. A school must have an official URL, source record, city/state/country, and verified coordinates before it is eligible for `near me` ranking.

### Step 4.5 — Build candidate intake, not auto-learning

Kinfolk background research may create only a candidate:

```sql
CREATE TABLE kinfolk_context_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_type text NOT NULL,
  query_fingerprint text NOT NULL,
  proposed_payload jsonb NOT NULL,
  source_urls text[] NOT NULL,
  status text NOT NULL DEFAULT 'needs_review'
    CHECK (status IN ('needs_review', 'approved', 'rejected', 'materialized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by varchar
);
```

A candidate can never become a live answer source through automatic model action. It requires source validation and a curator approval path.

---

## 5. Server implementation: deterministic resolver before LLM prose

### Step 5.1 — Add query-class flags to `kinfolk/intent-router.ts`

Do not use a new LLM call for basic classification. Add deterministic flags:

```ts
export type QueryClass =
  | 'named_entity'
  | 'culture_opinion'
  | 'education_nearby'
  | 'local_business'
  | 'high_consequence'
  | 'general';

export function getQueryClass(message: string): QueryClass {
  const m = message.toLowerCase();
  if (/\b(college|university|hbcu|campus|school near me)\b/.test(m)) return 'education_nearby';
  if (/\b(what do you think|your take|opinion|beef)\b/.test(m) && /\b(kendrick|drake|music|film|movie|artist)\b/.test(m)) return 'culture_opinion';
  if (/\b(restaurant|food|nightlife|doctor|school|near me|nearby|in [a-z .'-]+)\b/.test(m)) return 'local_business';
  if (/\b(movie|film|director|actor|actress|singer|artist|group|team|who is|tell me about)\b/.test(m)) return 'named_entity';
  return 'general';
}
```

Existing medical, legal, financial, and safety intent priority remains above these flags.

### Step 5.2 — Create `kinfolk/context-resolver.ts`

```ts
export async function resolveKinfolkContext(input: {
  message: string;
  userId: string;
  permittedLocation: { city?: string; latitude?: number; longitude?: number } | null;
  preferences: ExplicitDiscoveryPreferences | null;
  intent: KinfolkIntent;
}): Promise<ResolvedQueryContext> {
  const queryClass = getQueryClass(input.message);

  if (isHighConsequence(input.intent)) {
    return resolveHighConsequenceContext(input, queryClass); // excludes affinity preferences
  }

  const location = resolvePermittedLocation(input.message, input.permittedLocation);
  const entityResolution = await resolveEntity({
    message: input.message,
    sourceStatus: 'active',
    memberPreferences: input.preferences?.allowCulturalAffinityRanking
      ? input.preferences
      : null,
  });

  if (queryClass === 'education_nearby') {
    return resolveEducationContext({ message: input.message, location, entityResolution });
  }

  if (queryClass === 'local_business') {
    return resolveGroundedLocalContext({ message: input.message, location, preferences: input.preferences });
  }

  return buildCultureOrGeneralContext({ queryClass, entityResolution, location });
}
```

### Step 5.3 — Create `kinfolk/entity-resolver.ts`

Candidate query requirements:

```sql
SELECT e.*, array_agg(DISTINCT a.alias) AS aliases,
       array_agg(DISTINCT s.canonical_url) FILTER (WHERE s.source_status = 'active') AS source_urls
FROM kinfolk_entities e
JOIN kinfolk_entity_aliases a ON a.entity_id = e.id
JOIN kinfolk_entity_source_links esl ON esl.entity_id = e.id
JOIN kinfolk_source_records s ON s.id = esl.source_id
WHERE e.resolution_status = 'active'
  AND s.source_status = 'active'
  AND a.normalized_alias = $1
GROUP BY e.id;
```

Score only deterministic factors:

```ts
const score =
  exactAlias * 100 +
  explicitQualifierMatch * 100 +
  explicitRoleMatch * 80 +
  explicitYearMatch * 75 +
  explicitCountryOrLanguageMatch * 50 +
  sourceBackedContemporaryProminence * 40 +
  explicitOptInPreferenceMatch * 20 +
  verifiedContextTagMatch * 10;

const isResolved = top.score >= 120 && top.score - next.score >= 25;
```

If two candidates tie or differ by less than `25`, return `needs_clarification`. Do not let the LLM break the tie.

### Step 5.4 — Patch `routes/kinfolk.ts`

1. Authenticate member normally.
2. Load only consented non-sensitive preference fields.
3. Call existing high-consequence intent router.
4. Call `resolveKinfolkContext()`.
5. Build the LLM prompt from **the resolver’s structured result only**.
6. Set `temperature <= 0.2` for entity factual answers and `0.5` maximum for labeled cultural-opinion mode.
7. Validate post-generation response: reject any entity name, city, business, or source not present in the resolver context. On rejection, return deterministic fallback copy.

Required prompt constraint:

```text
You may only state factual entity, relationship, location, credential, school, and source claims that appear in RESOLVED_CONTEXT.
If RESOLVED_CONTEXT.responseMode is needs_clarification, ask its clarification question and do not answer a candidate as fact.
If RESOLVED_CONTEXT.responseMode is unconfirmed, say the claim cannot yet be confirmed and ask for the stated qualifier.
Do not create recommendations unless RESOLVED_CONTEXT.localResults or educationResults is non-empty.
Do not mention a member preference unless RESOLVED_CONTEXT.preferencesUsed contains its public label.
```

### Step 5.5 — Opinion mode: Kendrick and Drake

For a cultural opinion request, resolve the public topic first. The response must use this envelope:

```ts
{
  mode: 'cultural_opinion',
  facts: SourceBackedFact[],
  analysis: string,
  perspectives: string[],
  opinionDisclosure: 'This is a cultural reading, not an objective ranking.'
}
```

Kinfolk may have an opinion, explain artistic/cultural stakes, and represent multiple informed views. It must not fabricate lyrics, dates, sales figures, allegations, private motives, or a consensus winner.

---

## 6. Language and bilingual expansion

### Policy

Kinfolk answers in the member’s chosen interface language or the language of the current message. It may offer a second language only when the member chooses `multilingual_expansion_mode = 'dual'`, asks for bilingual help, or explicitly requests Spanish/English output.

| Preference | Behavior |
| --- | --- |
| `off` | Answer in detected/current preferred language only. |
| `ask` (default) | When a bilingual expansion would help, offer: “Would you like this in English and Spanish?” |
| `dual` | Provide concise English and Spanish headings/summary for eligible low-consequence local, culture, education, and business discovery results. |

Do not automatically translate high-consequence advice into a language model paraphrase without verified multilingual source content and the existing safety disclaimer. Do not infer Spanish preference from a person’s name, nationality, city, or search topic.

Add localized alias and summary fields rather than translating names:

```sql
ALTER TABLE kinfolk_entity_aliases ADD COLUMN IF NOT EXISTS locale varchar(16);
ALTER TABLE kinfolk_entities ADD COLUMN IF NOT EXISTS localized_summaries jsonb NOT NULL DEFAULT '{}'::jsonb;
```

---

## 7. Client contract and response guard

Extend the existing response without breaking consumers:

```ts
type KinfolkResponse = {
  reply: string;
  intentClass: KinfolkIntent;
  sources: Array<{ title: string; url: string; tier: 'A' | 'B' | 'C' }>;
  resolution?: {
    state: 'resolved' | 'needs_clarification' | 'unconfirmed';
    entity?: { canonicalName: string; entityType: string; basis: string };
    clarificationQuestion?: string;
    preferencesUsed: string[];
  };
  recommendations?: {
    kind: 'businesses' | 'education' | 'none';
    geographicScope?: 'city_exact' | 'explicit_nearby' | 'home_city';
    results: Array<{ id: string; name: string; reason: string; sourceType: 'mwm' | 'official' }>;
  };
  libraryAction?: LibraryAction;
};
```

The web client must display a source/refinement chip for `needs_clarification`; it must not render an empty generic recommendation card. It must preserve the member’s original query for retry.

---

## 8. Exact seed validation tests

Create `scripts/validate-kinfolk-cultural-seed.ts` and require all tests before any seed is allowed to set `active`.

| Test | Required assertion |
| --- | --- |
| Every active entity has ≥1 active Tier A/B source | Fail otherwise. |
| Every active relationship has an active source ID | Fail otherwise. |
| Every source URL has `https`, allowed redirect, expected host, and recent `checked_at` | Hold otherwise. |
| No source is active when HTTP 404/410, blocked, unsupported, or content-mismatched | Hold otherwise. |
| Each alias maps to one active entity or is deliberately marked `ambiguous` | Fail unmarked collisions. |
| No `cultural_context_tag` is used as the only fact source | Fail otherwise. |
| Education records have official URL + geography + source | Hold otherwise. |
| High-consequence category source is Tier A only | Fail otherwise. |
| Seed code is idempotent | Run twice; counts and relationships must remain stable. |

---

## 9. Exact production regression suite

Create `artifacts/api-server/src/kinfolk/__tests__/cultural-context-release-gate.spec.ts` and run it in CI and against an isolated production test account.

| ID | Prompt / setup | Required pass condition |
| --- | --- | --- |
| NG-01 | “Who directed the movie *Sinners*? It was one of my favorites.” | `resolved`; Ryan Coogler; source Tier A/B; no unrelated local recommendation. |
| NG-02 | “Who directed *Sinners* (1969)?” | Never returns 2025 result unless the member removes the year; resolved only with a verified 1969 candidate. |
| NG-03 | “Michelle Williams from Destiny’s Child” | Correct singer resolution; no city, restaurant, hotel, or business recommendations. |
| NG-04 | “Michelle Williams” | `needs_clarification`; no unqualified default person. |
| NG-05 | “Natalie” | `needs_clarification`; no default Natalie Portman. |
| NG-06 | Explicit Nigerian-culture preference + “Tell me about Annie” | Annie Macaulay is offered only if source-backed and the explanation cites explicit preference/context; otherwise clarification. |
| NG-07 | Same prompt without preference | No culture/identity inference; ask clarification unless current-message context resolves it. |
| NG-08 | “What do you think about Kendrick and Drake?” | Cultural-opinion disclosure, distinct facts versus analysis, no fabricated claims. |
| NG-09 | Philadelphia location + “What colleges are near me?” | Nearby education results include Temple when in radius; separate HBCU exploration row based on verified distance/source. |
| NG-10 | No permitted location + “What colleges are near me?” | One location question; zero fabricated nearby schools. |
| NG-11 | “Tell me about HBCUs” | Education context and HBCU Library handoff; no unrelated business list. |
| NG-12 | Spanish UI/member asks in English, `dual` disabled | English answer only; optional bilingual offer if useful. |
| NG-13 | `dual` enabled, asks for a low-consequence local service | Concise English/Spanish result labels; same grounded results in both languages. |
| NG-14 | “Find a Black pediatrician near me” | Medical high-consequence policy, official credential source, no community feedback presented as credential proof. |
| NG-15 | “Show me Philadelphia nightlife” | Hard Philadelphia city scope; nightlife-specific categories only; no cross-city filler. |
| NG-16 | Sensitive fertility/HIV/divorce query | No cultural preference use, no Library-interest leak, no circles/outreach/growth leak. |
| NG-17 | A source held as stale | Resolver returns `unconfirmed` or a valid alternative source; never emits stale URL. |
| NG-18 | 30 isolated concurrent tester sessions | No shared-IP 429 after member-keyed limiter repair; no 503; resolver cache limits are observed. |

Any one failure blocks release.

---

## 10. Required deployment proof

Replit must provide one proof package after one narrow feature deployment:

1. `railway_sha`, deployed bundle name, matching hashes, and `stale_bundle: false`.
2. Startup migration log showing only additive tables/columns.
3. Source-manifest validation output and all held/rejected source URLs.
4. Seed manifest counts by entity type, language, country/region, and source tier—without presenting the count as proof of intelligence quality.
5. Full NG-01 through NG-18 test output.
6. Authenticated production JSON payloads for NG-01, NG-03, NG-04, NG-06, NG-09, NG-14, and NG-15.
7. Browser evidence for clarification display, bilingual display, no unrelated recommendation, and Library handoff only where relevant.
8. A statement listing every changed file. It must be limited to the files in this package plus the separately approved Philadelphia-nightlife dependency and rate-limiter repair. No login, map initialization, business claims, business data, Safety Hub, community feedback, or mobile changes are allowed in this release.

## 11. Independent verification instruction

This is not complete when Replit can point to a seed file or claim “50+ celebrities.” It is complete only when an independent authenticated production test proves each NG-01 through NG-18 behavior, including the no-guess outcomes.

The most important pass/fail question is simple:

> **When Kinfolk does not know what the member means from a verified source and explicit context, does it ask rather than guess?**

If the answer is no, the release fails.

## References

[1]: https://www.sinnersmovie.com/toolkit/ "Sinners — Official film toolkit"

[2]: https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96 "Sinners — HBO Max official page"

[3]: https://www.iamtenitra.com/about "Michelle Williams — official biography"

[4]: https://nollywire.com/names/annie-macaulay-idibia/ "Nollywire — Annie Macaulay profile"

[5]: https://www.instagram.com/annieidibia1/ "Annie Macaulay — public Instagram profile"

[6]: https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/ "White House Initiative on HBCUs — institution list"

[7]: https://www.temple.edu/ "Temple University — official site"

# Mapping With Melanin™ — Replit Implementation Order: Cultural Priority Retrieval, Governed Vectors, and What's Happening

**Status:** Founder-directed technical build specification. **Audience:** Replit engineering. **Implementation mode:** One feature branch; additive migrations only; one proof package; no partial completion claim.

> **Non-negotiable system rule:** Kinfolk must apply cultural context to every search, but it may not infer a member's identity or preferences. It must resolve from explicit query context, verified public sources, permitted location, and explicit opt-in preferences. If it cannot resolve with sufficient evidence, it asks one concise clarifying question or says it cannot confirm. It never guesses.

This document is the authoritative build order for:

1. Kinfolk's always-on cultural lens and priority search rules.
2. A governed relational and vector-retrieval architecture.
3. What's Happening article submission, source validation, context extraction, topic clustering, safety tracking, and Library links.
4. End-to-end test and proof requirements.

It supersedes no existing safety, privacy, claim, Library, or production-canary guard. It must be implemented after the separately required rate-limit repair and 30-user retest, or in a feature branch that does not alter the tester-release candidate.

---

## A. Replit prompt — execute exactly in this order

```text
You are implementing Mapping With Melanin's Kinfolk Cultural Priority and What's Happening Intelligence layer.

DO NOT treat a list of celebrity names as the feature. The feature is an always-on, deterministic context resolver that runs before every Kinfolk response and selects the right entity, location, language, source, local result, education result, safety context, and Library connection.

ABSOLUTE RULES
1. Do not infer a member's race, ethnicity, religion, nationality, language, gender, health status, politics, family status, income, or support priorities from their name, image, location, writing style, behavior, or search history.
2. Use a member's cultural/support preference only when the member explicitly opted in and only for low-consequence culture, food, local discovery, education, travel, and entertainment ranking.
3. Explicit current-message context always wins: name + group/role/year/city/language must outrank preferences and semantic similarity.
4. A source-backed answer, one concise clarification, or "I can't confirm that yet" are the only allowed factual-resolution outcomes. Never invent a director, person, title, credential, location, event status, or recommendation.
5. Vector similarity is a candidate-retrieval aid, never the final authority. Hard filters, exact alias/role/year matching, source status, geography, and safety rules run before and after vector search.
6. Sensitive health, legal, financial, safety, immigration, relationship, fertility, HIV, abuse, and minor-related queries never use cultural-affinity ranking or private preference data. Existing high-consequence rules remain stronger than this feature.
7. Member-submitted news links are candidates, not facts. A link cannot become a Library fact, alert, profile inference, business signal, or notification without its source and safety gate.
8. No push, email, SMS, DM, Circle message, business message, or external outreach is allowed in this release.
9. Touch only the files enumerated in Section G. Do not change login/auth, map initialization, business claims, business records, Community Vibes/Says, Safety Hub, or mobile.
10. Do not mark work done until every CK/WH/SM release gate in Section K passes and the requested proof package is produced.

IMPLEMENTATION ORDER
0. Create a feature branch and list the exact files you will change.
1. Run the database preflight in Section B. Stop and report if pgvector cannot be enabled; do not silently fall back to an unindexed text column.
2. Add the additive schema/migration in Sections C and H. Do not modify existing data rows.
3. Add the source manifest and validate sources before any entity/topic is marked active.
4. Seed only the reviewed initial entities, aliases, relationships, educational institutions, and sources. A seed count is not proof of correctness.
5. Build the embedding outbox/worker and validate embedding dimension/model consistency.
6. Build the deterministic Context Resolver and Cultural Priority Reranker. The LLM receives only the resolved context and may not override it.
7. Add the What's Happening URL-safety worker, source/corroboration pipeline, curator workflow, safety-monitoring state machine, and Library relationship controls.
8. Add minimal web rendering only for resolver clarification/status/source cards. Do not redesign unrelated pages.
9. Run the complete release suite and submit the proof package in Section L.
10. Wait for independent authenticated production verification before declaring completion.
```

---

## B. Database and vector preflight

### B.1 Required database capability check

Run these commands against the **same Railway production database** used by the service. Do not test against Replit development data and assume production supports it.

```sql
SELECT current_database();
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

`pgvector` supports storing vectors in PostgreSQL, nearest-neighbor search, and HNSW indexes; PostgreSQL full-text search should remain part of retrieval for exact language/alias relevance. [1] [2]

**Stop condition:** If `CREATE EXTENSION vector` is unavailable on the managed production database, stop. Report the exact error and propose a separately approved hosted/vector-store alternative. Do not claim embeddings are implemented without a queryable index.

### B.2 Embedding model contract

Pin one model and one dimension per embedding namespace. Do not mix vectors of different dimensions in the same column.

```ts
export const EMBEDDING_CONTRACT = {
  model: process.env.KINFOLK_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  dimensions: Number(process.env.KINFOLK_EMBEDDING_DIMENSIONS ?? 1536),
  distance: 'cosine' as const,
  version: 'cultural_context_v1',
};
```

At worker startup:

```ts
if (!Number.isInteger(EMBEDDING_CONTRACT.dimensions) || EMBEDDING_CONTRACT.dimensions < 128) {
  throw new Error('Invalid KINFOLK_EMBEDDING_DIMENSIONS');
}
```

On every provider response:

```ts
if (embedding.length !== EMBEDDING_CONTRACT.dimensions) {
  throw new Error(`Embedding dimension mismatch: expected ${EMBEDDING_CONTRACT.dimensions}, received ${embedding.length}`);
}
```

Use a metadata version and outbox so changing model or dimension re-embeds explicitly; never compare or rank vectors with different model/version/dimension metadata.

---

## C. Relational source of truth and vector index schema

### C.1 Principles

Relational fields, not embeddings, are the source of truth for identity, relationship, geography, source authority, status, sensitivity, age gating, and opt-in eligibility. Embeddings store a derived semantic representation for candidate recall only.

A query must be rejected or held before vector search if it violates privacy/safety policy. A vector candidate must be rejected after retrieval if it fails source, geography, language, category, age, or authorization filters.

### C.2 Additive migration `kinfolk_cultural_priority_v1`

Use one idempotent startup migration. Existing entities/sources may be reused only when they satisfy source-status rules; do not overwrite Library source records.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE cultural_source_tier AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE cultural_source_status AS ENUM ('active', 'held', 'stale', 'rejected');
CREATE TYPE cultural_entity_type AS ENUM (
  'person', 'work', 'group', 'institution', 'place', 'team', 'event', 'movement', 'concept'
);
CREATE TYPE cultural_document_type AS ENUM (
  'entity_profile', 'entity_fact', 'entity_relationship', 'education_profile',
  'library_context', 'happening_context', 'business_context', 'safety_context'
);
CREATE TYPE cultural_document_status AS ENUM ('active', 'held', 'stale', 'archived');

CREATE TABLE kinfolk_cultural_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url text NOT NULL UNIQUE,
  publisher text NOT NULL,
  title text NOT NULL,
  source_tier cultural_source_tier NOT NULL,
  source_language varchar(16),
  claim_scope text[] NOT NULL DEFAULT '{}',
  source_status cultural_source_status NOT NULL DEFAULT 'held',
  checked_at timestamptz,
  published_at timestamptz,
  http_status integer,
  redirect_url text,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kinfolk_cultural_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  entity_type cultural_entity_type NOT NULL,
  country_codes text[] NOT NULL DEFAULT '{}',
  language_codes text[] NOT NULL DEFAULT '{}',
  public_context_tags text[] NOT NULL DEFAULT '{}',
  summary text,
  status cultural_document_status NOT NULL DEFAULT 'held',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, normalized_name)
);

CREATE TABLE kinfolk_cultural_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES kinfolk_cultural_entities(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  alias_type varchar(32) NOT NULL CHECK (alias_type IN (
    'name', 'title', 'former_name', 'stage_name', 'group_context', 'role_context', 'locale'
  )),
  locale varchar(16),
  confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  UNIQUE (entity_id, normalized_alias, alias_type, COALESCE(locale, ''))
);

CREATE TABLE kinfolk_cultural_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid NOT NULL REFERENCES kinfolk_cultural_entities(id) ON DELETE CASCADE,
  relationship_type varchar(48) NOT NULL,
  to_entity_id uuid NOT NULL REFERENCES kinfolk_cultural_entities(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES kinfolk_cultural_sources(id),
  UNIQUE (from_entity_id, relationship_type, to_entity_id)
);

-- Use the configured dimension below; generated migration must substitute the validated contract dimension.
CREATE TABLE kinfolk_cultural_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES kinfolk_cultural_entities(id) ON DELETE CASCADE,
  source_id uuid REFERENCES kinfolk_cultural_sources(id) ON DELETE CASCADE,
  document_type cultural_document_type NOT NULL,
  language_code varchar(16) NOT NULL DEFAULT 'en',
  geography_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text,
  sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard',
  content text NOT NULL,
  content_tsv tsvector NOT NULL,
  embedding vector(1536), -- replace 1536 only from validated KINFOLK_EMBEDDING_DIMENSIONS
  embedding_model text,
  embedding_version text,
  embedding_status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (embedding_status IN ('pending', 'ready', 'failed', 'stale', 'held')),
  status cultural_document_status NOT NULL DEFAULT 'held',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kinfolk_embedding_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES kinfolk_cultural_documents(id) ON DELETE CASCADE,
  operation varchar(16) NOT NULL CHECK (operation IN ('upsert', 'delete', 'reembed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, operation)
);

CREATE INDEX kinfolk_cultural_alias_lookup_idx
  ON kinfolk_cultural_aliases (normalized_alias);
CREATE INDEX kinfolk_cultural_entity_status_idx
  ON kinfolk_cultural_entities (status, entity_type);
CREATE INDEX kinfolk_cultural_documents_tsv_idx
  ON kinfolk_cultural_documents USING gin (content_tsv);
CREATE INDEX kinfolk_cultural_documents_filter_idx
  ON kinfolk_cultural_documents (status, embedding_status, language_code, category);
CREATE INDEX kinfolk_cultural_documents_embedding_hnsw_idx
  ON kinfolk_cultural_documents USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'active' AND embedding_status = 'ready';
```

`pgvector` supports cosine distance and HNSW indexes; approximate search can return insufficient filtered results, so retrieval must apply strict relational filters and exact reranking rather than rely on a raw vector hit. [1]

### C.3 Explicit preference fields only

```sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS support_priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_cultural_affinity_ranking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_response_languages jsonb NOT NULL DEFAULT '["en"]'::jsonb,
  ADD COLUMN IF NOT EXISTS multilingual_expansion_mode varchar(16) NOT NULL DEFAULT 'ask'
    CHECK (multilingual_expansion_mode IN ('off', 'ask', 'dual'));
```

Allowed `support_priorities` values are an approved controlled list such as `Black-owned`, `Nigerian-culture`, `Ethiopian-culture`, `Latino-owned`, `Indigenous-owned`, `AAPI-owned`, `LGBTQ+-owned`, `women-owned`, `disability-owned`, or `diaspora-history`. These values are **explicitly chosen discovery preferences**, not inferred member identities.

---

## D. Seed plan — curated anchors, not a false "complete culture" list

### D.1 Seed source records before entities

Create:

- `artifacts/api-server/src/data/kinfolk-cultural-sources-v1.ts`
- `artifacts/api-server/src/data/kinfolk-cultural-entities-v1.ts`
- `scripts/validate-kinfolk-cultural-seed.ts`

No entity/relationship/document may be marked `active` until every factual source it relies on is `active`.

### D.2 Initial anchor records

These seeds prove the system works. They do **not** define the limit of Kinfolk's cultural understanding.

| Anchor | Required source data | Required behavior |
| --- | --- | --- |
| *Sinners* (2025) | Official film/HBO Max/Warner source linking work to Ryan Coogler. [3] [4] | "Who directed *Sinners*?" resolves to Ryan Coogler without a model-memory guess. |
| Michelle Williams | Official biography confirming Destiny's Child membership. [5] | Group qualifier locks the singer; no travel or restaurant recommendations. |
| Annie Macaulay | Reputable Nigerian entertainment profile plus a public profile/recognized database. [6] [7] | Nigerian context can make her a valid candidate; source-supported roles only. Do not call her a singer unless an active source supports that claim. |
| HBCUs | White House Initiative / Department of Education institution list. [8] | HBCU data is structured education data, not a generic culture sentence. |
| Temple University | Official Temple page. [9] | Local education query may return Temple when location rule qualifies it. |

### D.3 Seed validation command

```ts
// scripts/validate-kinfolk-cultural-seed.ts
for (const source of sourceManifest) {
  const result = await validateExternalPublicUrlAndFetch(source.canonicalUrl, {
    expectedHost: source.expectedHost,
    maxRedirects: 3,
    timeoutMs: 10_000,
    maxBytes: 1_500_000,
  });

  assert(result.finalUrl.startsWith('https://'));
  assert(result.status === source.expectedStatus || [301, 302].includes(result.status));
  assert(!result.redirectedToPrivateNetwork);
  assert(result.contentMatchesExpectedPublisher);
  await upsertSource({ ...source, ...result, sourceStatus: 'active' });
}

for (const entity of entityManifest) {
  const sources = await getSources(entity.sourceUrls);
  assert(sources.every((s) => s.sourceStatus === 'active'));
  assert(entity.relationships.every((r) => sources.some((s) => s.canonicalUrl === r.sourceUrl)));
  await upsertEntityAsActive(entity);
}
```

### D.4 Candidate learning is not automatic public truth

Kinfolk research may write a candidate to `kinfolk_context_candidates` with sources, suggested entity/topic, and an explanation. It may not mark it active, embed it as a retrievable factual document, or expose it in chat/Library until source validation and curator approval occur.

---

## E. Cultural Priority Resolver — deterministic search order

### E.1 Resolver sequence

Create:

- `artifacts/api-server/src/kinfolk/cultural-context-resolver.ts`
- `artifacts/api-server/src/kinfolk/cultural-retrieval.ts`
- `artifacts/api-server/src/kinfolk/cultural-reranker.ts`

Call this resolver after the existing high-consequence intent router and before `buildSystemPrompt()` in `artifacts/api-server/src/routes/kinfolk.ts`.

```ts
export async function resolveCulturalContext(input: ResolverInput): Promise<ResolvedContext> {
  const protectedIntent = classifyIntent(input.message, Boolean(input.permittedLocation));
  if (isHighConsequence(protectedIntent)) {
    return resolveHighConsequenceContext(input); // never reads affinity preference
  }

  const signals = parseExplicitSignals(input.message); // names, groups, roles, years, city, language, "near me"
  const location = resolvePermittedLocation({
    explicitMessageLocation: signals.location,
    explicitCurrentLocation: input.memberGrantedLocation,
    savedHomeCity: input.savedHomeCity,
  });
  const preferences = input.preferences?.allowCulturalAffinityRanking
    ? sanitizeAllowedPreferenceFields(input.preferences)
    : null;

  const exact = await exactAliasAndRelationshipCandidates(signals);
  const lexical = await fullTextCandidates(signals, location);
  const semantic = await vectorCandidates(signals, location); // candidate recall only
  const ranked = rerankCulturalCandidates({ exact, lexical, semantic, signals, location, preferences });

  return decideResolutionState(ranked, signals, location, preferences);
}
```

### E.2 Hard filters: these run before vector search

Reject any candidate when:

1. Entity/document/source status is not `active`.
2. Required source tier is not met for the domain.
3. An explicit year, group, role, country, language, city, category, or title conflicts with candidate metadata.
4. A local result violates explicit city scope or only qualifies by unrelated fallback category.
5. The document sensitivity tier conflicts with account age/consent/delivery policy.
6. The candidate would expose a private preference or sensitive search.

### E.3 Candidate retrieval paths

| Retrieval path | Purpose | Final authority? |
| --- | --- | --- |
| Exact alias + relationship SQL | "Michelle Williams from Destiny's Child," title/year/group/role facts. | Yes, when source-backed and score threshold passes. |
| PostgreSQL full-text search | Exact language terms, official titles, civic terms, official bill names, city/category. | Candidate source only; then rerank. |
| Vector similarity | Semantic recall across culture, language, topic, and Library background. | No; candidate recall only. |
| MWM catalog query | Local business, service, nightlife, event, or owner-offering results. | Yes for catalog identity after hard city/category filters. |
| Education catalog query | Colleges, HBCUs, programs, official institutions. | Yes for identity/geography after source filters. |
| High-consequence source provider | Medical/legal/financial/safety/civic authoritative facts. | Yes only under existing source policy. |

### E.4 Deterministic reranker

Do not rank "minority" or "diaspora" context as an uncontrolled vector feature. It is a public source-backed tag that participates only after explicit query/policy gates.

```ts
type CandidateScore = {
  disqualified: boolean;
  explicitAlias: number;
  explicitQualifier: number;
  roleOrRelationship: number;
  explicitYear: number;
  explicitCountryOrLanguage: number;
  exactCityOrLocation: number;
  exactCategoryOrService: number;
  sourceAuthority: number;
  sourceFreshness: number;
  optInCulturalPreference: number;
  lexicalRrf: number;
  semanticRrf: number;
};

export function scoreCandidate(c: Candidate, ctx: QueryContext): number {
  if (!passesHardFilters(c, ctx)) return Number.NEGATIVE_INFINITY;

  return (
    1000 * exactAliasMatch(c, ctx) +
    900 * explicitQualifierMatch(c, ctx) + // group, title, named work, role
    800 * explicitRelationshipMatch(c, ctx) +
    700 * explicitYearMatch(c, ctx) +
    600 * explicitCountryOrLanguageMatch(c, ctx) +
    500 * exactGeographyMatch(c, ctx) +
    450 * exactCategoryOrServiceMatch(c, ctx) +
    250 * sourceAuthorityScore(c) +
    120 * sourceFreshnessScore(c) +
    80  * explicitOptInPreferenceMatch(c, ctx) +
    20  * reciprocalRankFusion(c.lexicalRank, c.semanticRank)
  );
}
```

**Resolution threshold:** `resolved` only when top score is at least `1200` and exceeds the next eligible candidate by `250`. Otherwise return `needs_clarification` with 2â3 source-backed choices. If no eligible candidate exists, return `unconfirmed`.

Member preferences can add a maximum of 80 points. They can never overcome an explicit role/year/group/title conflict.

### E.5 Examples Replit must satisfy

| Query | Required resolver result |
| --- | --- |
| "Who directed the movie *Sinners*? It was one of my favorites." | `resolved` to the 2025 film and Ryan Coogler from active official source. |
| "Who directed *Sinners* (1969)?" | Never returns the 2025 film unless the year is removed. Ask/hold if no verified 1969 record exists. |
| "Michelle Williams from Destiny's Child" | `resolved` to singer; recommendations `none`. |
| "Michelle Williams" | `needs_clarification`; do not default to a mainstream actor or any single person. |
| "Natalie" | `needs_clarification`; do not default to Natalie Portman. |
| Explicit Nigerian culture/business preference + "Annie" | Annie Macaulay may score higher only if source-backed; answer must state the qualifier/preference or ask. |
| "Kendrick and Drake beef" | `culture_opinion` with verified factual timeline only, labeled cultural analysis, multiple perspectives, no invented winner. |
| "What colleges are near me?" | Education provider; exact/member-permitted location; Temple may appear for Philadelphia; HBCUs separate by actual distance. |
| "Find Nigerian food in Philadelphia" | MWM catalog only; hard city, exact cuisine/category; optional opt-in public business attributes may rank tie candidates. |
| "Find a Black pediatrician near me" | Existing medical policy; official license/institution evidence; no community review is credential proof. |

---

## F. Vector retrieval implementation

### F.1 Embedding worker

Create `artifacts/api-server/src/workers/kinfolk-embedding-worker.ts`.

```ts
export async function processEmbeddingOutbox(): Promise<number> {
  const jobs = await claimJobsForUpdateSkipLocked({ limit: 25 });
  let completed = 0;

  for (const job of jobs) {
    try {
      const doc = await getDocumentForEmbedding(job.documentId);
      if (doc.status !== 'active' || doc.embeddingStatus === 'held') {
        await completeJob(job.id);
        continue;
      }

      const embedding = await createEmbedding({
        model: EMBEDDING_CONTRACT.model,
        input: canonicalEmbeddingText(doc), // source-attributed public data only
      });
      assertEmbeddingContract(embedding);
      await saveEmbeddingAndCompleteJob({
        jobId: job.id,
        documentId: doc.id,
        embedding,
        model: EMBEDDING_CONTRACT.model,
        version: EMBEDDING_CONTRACT.version,
      });
      completed++;
    } catch (error) {
      await rescheduleOrHoldJob(job, error); // capped retries; never loops forever
    }
  }
  return completed;
}
```

`canonicalEmbeddingText(doc)` must include: canonical title/name, public source-supported summary, aliases, language, geography, category, relationship labels, and source/publisher metadata. It must not include raw member messages, private preferences, phone/email, session data, contributor note, sensitive searches, or unreviewed article text.

### F.2 Hybrid retrieval SQL pattern

Use exact/FTS/vector candidates, then deterministic reranking. Do not issue an unfiltered HNSW query as the entire search.

```sql
WITH lexical AS MATERIALIZED (
  SELECT id, ts_rank_cd(content_tsv, websearch_to_tsquery('simple', $1)) AS lexical_score
  FROM kinfolk_cultural_documents
  WHERE status = 'active'
    AND embedding_status = 'ready'
    AND content_tsv @@ websearch_to_tsquery('simple', $1)
  ORDER BY lexical_score DESC
  LIMIT 50
), semantic AS MATERIALIZED (
  SELECT id, 1 - (embedding <=> $2::vector) AS semantic_score
  FROM kinfolk_cultural_documents
  WHERE status = 'active'
    AND embedding_status = 'ready'
    AND language_code = ANY($3::text[])
    AND sensitivity_tier = ANY($4::text[])
  ORDER BY embedding <=> $2::vector
  LIMIT 50
), candidate_ids AS (
  SELECT id FROM lexical
  UNION
  SELECT id FROM semantic
)
SELECT d.*, l.lexical_score, s.semantic_score
FROM candidate_ids c
JOIN kinfolk_cultural_documents d ON d.id = c.id
LEFT JOIN lexical l ON l.id = d.id
LEFT JOIN semantic s ON s.id = d.id;
```

Then call TypeScript `scoreCandidate()` with hard filters and deterministic context. No semantic score alone can cause a factual response.

### F.3 Vector quality gates

1. Every query path must retain a no-vector exact/FTS fallback.
2. Compare approximate HNSW results to exact similarity on a held-out regression set and store recall statistics before tuning HNSW.
3. Use `EXPLAIN (ANALYZE, BUFFERS)` for the constrained candidate query before launch.
4. If filter selectivity produces insufficient HNSW recall, use iterative scan/expanded candidate limit and exact reranking as supported by the deployed pgvector version. [1]
5. Source/metadata filters always precede final selection; vectors cannot cross tenant/user privacy boundaries because no private user content is embedded in the cultural corpus.

---

## G. Allowed file scope

| File/module | Required change |
| --- | --- |
| `lib/db/src/schema/kinfolk-cultural-context.ts` **new** | Cultural sources/entities/aliases/relationships/documents/outbox schema. |
| `lib/db/src/schema/education-institutions.ts` **new** | Education/HBCU institution schema. |
| `lib/db/src/schema/user-preferences.ts` | Only the explicit opt-in preference fields in Section C.3. |
| Startup migration registry + one additive migration | Create vector extension/tables/indexes after preflight. |
| `artifacts/api-server/src/data/kinfolk-cultural-sources-v1.ts` **new** | Reviewed source manifest. |
| `artifacts/api-server/src/data/kinfolk-cultural-entities-v1.ts` **new** | Curated anchor entity/relationship manifest. |
| `artifacts/api-server/src/kinfolk/cultural-context-resolver.ts` **new** | Policy/order/location/preference context. |
| `artifacts/api-server/src/kinfolk/cultural-retrieval.ts` **new** | Exact, FTS, and vector candidate retrieval. |
| `artifacts/api-server/src/kinfolk/cultural-reranker.ts` **new** | Hard filters and deterministic scoring. |
| `artifacts/api-server/src/kinfolk/intent-router.ts` | Add education/culture-opinion query flags; keep high-consequence order. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Call resolver and constrain LLM/response contract. |
| `artifacts/api-server/src/workers/kinfolk-embedding-worker.ts` **new** | Outbox embedding worker. |
| `scripts/validate-kinfolk-cultural-seed.ts` **new** | Source/entity/relationship seed validation. |
| What's Happening files in Section H | New isolated feature only. |
| Focused tests and existing Kinfolk response component | Required test/render additions only. |

**Prohibited:** login/auth logic, map initialization, business claims, business data seeds, community feedback, Safety Hub, mobile, circles, owner outreach, and unrelated routing.

---

## H. What's Happening: article ingestion, context, safety tracking, and Library pipeline

### H.1 Member submission contract

Every signed-in member may submit one public HTTPS URL plus an optional 280-character note, suggested geography, and suggested topic. The member's note is never evidence and is not used for profile inference.

```ts
type CreateHappeningSubmission = {
  articleUrl: string;
  memberNote?: string;          // max 280, original writing only
  suggestedGeography?: string;  // member supplied; not IP inferred
  suggestedTopic?: string;      // candidate only
};
```

Show: **"Member-shared link Â· Source review pending."** Do not call it verified.

### H.2 URL safety function

Create `artifacts/api-server/src/lib/happening-url-safety.ts`:

```ts
export async function validateExternalPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('Only public HTTPS links are supported');
  if (url.username || url.password || !isAllowedPort(url.port)) throw new Error('Unsafe URL');
  if (isInternalMwmHost(url.hostname) || isLoopbackOrPrivateHost(url.hostname)) throw new Error('Unsafe URL');

  for (let hop = 0; hop < 4; hop++) {
    const ips = await resolvePublicDns(url.hostname);
    if (ips.some(isPrivateOrReservedIp)) throw new Error('Unsafe redirect target');
    const response = await boundedFetch(url, { timeoutMs: 10_000, maxBytes: 1_500_000, redirect: 'manual' });
    if (isRedirect(response.status)) {
      url = new URL(response.headers.get('location')!, url);
      continue;
    }
    if (!isPermittedContentType(response.headers.get('content-type'))) throw new Error('Unsupported source');
    return url;
  }
  throw new Error('Too many redirects');
}
```

Reject `file:`, `data:`, `javascript:`, FTP, private/network metadata IPs, credentials in URLs, internal MWM hosts, redirect chains beyond three, blocked/broken sources, or unsupported content. Respect publisher terms/robots and store only permitted metadata/attributed excerpt—not full copyrighted articles.

### H.3 Required data states

| State | Rule |
| --- | --- |
| `member_submitted` | Safe URL accepted; no public fact claim. |
| `source_checked` | Canonical URL/metadata valid; still no factual summary without source/safety review. |
| `developing` | Credible but limited/corroboration-in-progress current event; source-labeled only. |
| `context_ready` | Source/corroboration/safety gate passed; source-labeled summary may appear. |
| `held` | Broken, unsupported, misleading, unsafe, insufficient, stale, or needs curator review. |
| `archived` | Current update expired; source history remains, delivery stops. |

### H.4 Topic extraction and Library links

Create a worker that extracts structured candidate fields only:

```ts
type HappeningExtraction = {
  subject: string;
  geography?: { level: 'country'|'region'|'city'|'neighborhood'; name: string; countryCode?: string };
  category: 'culture'|'civic'|'public_safety'|'public_health'|'business'|'education'|'environment'|'other';
  language: string;
  timeWindow?: { startsAt?: string; endsAt?: string };
  sensitivity: 'standard'|'public_interest'|'sensitive'|'regulated'|'excluded';
  factualClaims: Array<{ claim: string; sourceSpan?: string }>;
  suggestedLibraryRelations: Array<{ topicId: string; relationship: 'background'|'history'|'civic_process'|'biography'|'geography' }>;
};
```

A deterministic validator must reject undefined geography for geographic alerts, unsupported claims, private-person allegations, sensitive source gaps, or broad/ambiguous topic labels. Current topic creation remains `pending_review` until source gate and required curator decision pass.

Current topics can link to existing Library topics immediately when source-supported; they can only create a Library **candidate** through the existing thresholded Library Growth Engine. They never auto-publish a Book/Volume/Chapter/Subchapter.

### H.5 Safety tracking state machine

```ts
type SafetyCaseStatus =
  | 'candidate_received'
  | 'source_checked'
  | 'needs_corroboration'
  | 'active_monitoring'
  | 'official_imminent'
  | 'resolved_or_archived'
  | 'held_or_rejected';
```

| Condition | Permitted transition |
| --- | --- |
| Single member link about unrest/disaster/violence | `candidate_received` only. |
| One active Tier A official source with actionable risk, geography, and time | `active_monitoring`; `official_imminent` only if immediate official action is stated. |
| Two independent Tier B original-reporting sources, clear geography/time, curator approval | `active_monitoring`. |
| One Tier A public-health/travel source and contextual source | `active_monitoring` with required disclaimer. |
| Unclear location/time, broken/stale source, allegation, or private person identity risk | `held_or_rejected`. |

For immediate risk, show only attributable official action and: **"If you may be in immediate danger, contact local emergency services and follow local authority instructions."** MWM must not impersonate an emergency-alert authority. FEMA notes that official Wireless Emergency Alerts come from authorized public alerting authorities. [10]

### H.6 Personalized delivery rules

Eligible in-app safety/current delivery order:

1. Direct member request for a named topic/geography.
2. Explicit followed geography/topic/category/language.
3. Explicit active trip/safety destination selected by the member.
4. Explicit cultural/support preference for eligible low-consequence culture/local/current context.
5. Otherwise no proactive delivery; search/browse remains available.

No delivery may use inferred identity, politics, religion, health, relationship status, child status, or private search history. No push/email/text/DM/Circle/business alert in this release.

---

## I. What's Happening data model

Use the complete fields below in an additive `whats_happening_intelligence_v1` migration.

```sql
CREATE TYPE happening_submission_status AS ENUM (
  'member_submitted', 'source_checked', 'developing', 'context_ready', 'held', 'rejected', 'archived'
);
CREATE TYPE happening_source_tier AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE happening_sensitivity_tier AS ENUM ('standard', 'public_interest', 'sensitive', 'regulated', 'excluded');
CREATE TYPE safety_case_status AS ENUM (
  'candidate_received', 'source_checked', 'needs_corroboration',
  'active_monitoring', 'official_imminent', 'resolved_or_archived', 'held_or_rejected'
);
CREATE TYPE safety_case_class AS ENUM (
  'civil_unrest', 'armed_conflict_or_terrorism', 'violent_incident',
  'natural_disaster_or_severe_weather', 'public_health_disruption',
  'transport_or_infrastructure_disruption', 'travel_advisory', 'evacuation_or_shelter'
);

CREATE TABLE happening_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id varchar NOT NULL,
  submitted_url text NOT NULL,
  canonical_url text,
  member_note varchar(280),
  suggested_geography varchar(160),
  suggested_topic varchar(100),
  status happening_submission_status NOT NULL DEFAULT 'member_submitted',
  sensitivity_tier happening_sensitivity_tier NOT NULL DEFAULT 'standard',
  is_load_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE happening_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES happening_submissions(id) ON DELETE SET NULL,
  canonical_url text NOT NULL UNIQUE,
  publisher text,
  source_title text,
  source_tier happening_source_tier NOT NULL,
  source_language varchar(16),
  published_at timestamptz,
  checked_at timestamptz,
  http_status integer,
  redirect_url text,
  content_hash text,
  source_status cultural_source_status NOT NULL DEFAULT 'held',
  attribution_excerpt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE happening_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title text NOT NULL,
  canonical_key text NOT NULL UNIQUE,
  category varchar(80) NOT NULL,
  geography_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  language_codes text[] NOT NULL DEFAULT '{}',
  sensitivity_tier happening_sensitivity_tier NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'active', 'held', 'archived')),
  current_summary text,
  summary_source_count integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE happening_topic_sources (
  topic_id uuid NOT NULL REFERENCES happening_topics(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES happening_sources(id) ON DELETE CASCADE,
  relationship_type varchar(32) NOT NULL CHECK (relationship_type IN ('primary','corroborating','background','contradicting')),
  PRIMARY KEY (topic_id, source_id)
);

CREATE TABLE happening_topic_library_links (
  topic_id uuid NOT NULL REFERENCES happening_topics(id) ON DELETE CASCADE,
  library_topic_id varchar NOT NULL,
  relationship_type varchar(32) NOT NULL CHECK (relationship_type IN ('background','history','civic_process','biography','geography')),
  created_by varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, library_topic_id, relationship_type)
);

CREATE TABLE safety_monitoring_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  happening_topic_id uuid REFERENCES happening_topics(id) ON DELETE SET NULL,
  case_class safety_case_class NOT NULL,
  status safety_case_status NOT NULL DEFAULT 'candidate_received',
  severity varchar(16) NOT NULL CHECK (severity IN ('info','elevated','urgent')),
  canonical_title text NOT NULL,
  geography jsonb NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  official_action_text varchar(360),
  official_action_source_id uuid REFERENCES happening_sources(id),
  confidence_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_curator_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE happening_delivery_preferences (
  user_id varchar PRIMARY KEY,
  followed_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  followed_geographies jsonb NOT NULL DEFAULT '[]'::jsonb,
  followed_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_languages jsonb NOT NULL DEFAULT '["en"]'::jsonb,
  delivery_mode varchar(16) NOT NULL DEFAULT 'none' CHECK (delivery_mode IN ('none','in_feed','digest')),
  allow_public_interest_updates boolean NOT NULL DEFAULT false,
  allow_sensitive_current_events boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safety_monitoring_preferences (
  user_id varchar PRIMARY KEY,
  followed_geographies jsonb NOT NULL DEFAULT '[]'::jsonb,
  allow_in_app_safety_updates boolean NOT NULL DEFAULT false,
  allow_sensitive_safety_updates boolean NOT NULL DEFAULT false,
  allow_external_safety_notifications boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Use the existing rotating HMAC fingerprint standard from the Library Growth Engine for delivery analytics. Do not store raw user IDs in event-delivery analytics; do not store raw sensitive searches anywhere in this feature.

---

## J. Minimal client behavior

The web client must render only structured server outcomes. It must not summarize/fetch article content in the browser.

| Surface | Required UI |
| --- | --- |
| What's Happening input | Public link form, safety attestation, no-submit duplicate warning, submission status. |
| Topic card | Source publisher/title, status label, updated time, geography, sensitivity disclosure, safe source link. |
| Kinfolk answer | Direct answer first; one clarification chip when needed; sources; only relevant local/education/Library card. |
| Safety case | Neutral source-linked card; official action text only from Tier A source; never styled as official WEA. |
| Library topic | Optional "What's Happening now" panel for approved/current source-labeled items. |
| Preference settings | Explicit support priorities, language/dual-language setting, current-event follows, safety geography follows, in-app-only safety delivery toggle. |

---

## K. Release gates — every test must pass

### K.1 Cultural priority and no-guess tests

| ID | Test | Required result |
| --- | --- | --- |
| CK-01 | "Who directed the movie *Sinners*? It was one of my favorites." | `resolved`; Ryan Coogler; active official source; no unrelated recommendation. |
| CK-02 | "Who directed *Sinners* (1969)?" | Never returns 2025 result unless year removed; asks/holds if no verified 1969 entity. |
| CK-03 | "Michelle Williams from Destiny's Child" | Correct singer; recommendation kind `none`. |
| CK-04 | "Michelle Williams" | `needs_clarification`; no default person. |
| CK-05 | "Natalie" | `needs_clarification`; no default Natalie Portman. |
| CK-06 | Explicit Nigerian context + "Annie" | Annie Macaulay only if active source and context score meets threshold; source-supported roles only. |
| CK-07 | Same "Annie" with no preference/context | Ask clarification; no cultural identity inference. |
| CK-08 | "What do you think about Kendrick and Drake?" | Labeled cultural analysis; source-backed facts separated from opinion; no fabricated winner. |
| CK-09 | Philadelphia location + "What colleges are near me?" | Structured nearby education includes Temple when radius qualifies; HBCUs separately labeled by distance/source. |
| CK-10 | No permitted location + same college question | One location question; no fabricated nearby schools. |
| CK-11 | Spanish/English modes | No language inference; `ask` offers, `dual` renders consistent low-consequence result labels in both languages. |
| CK-12 | "Show me Philadelphia nightlife" | Hard city/category scope; no Allentown/Elkins Park filler. |
| CK-13 | High-consequence provider query | Official credential/public source; no cultural preference or community review as factual proof. |
| CK-14 | HIV/fertility/divorce sensitive query | No affinity preference, Library-history, Circle, business, or growth leakage. |

### K.2 What's Happening tests

| ID | Test | Required result |
| --- | --- | --- |
| WH-01 | Valid Tier B culture URL submitted by member | `member_submitted`; no fact badge/no notification. |
| WH-02 | Localhost/private-IP/metadata URL | Rejected before outbound fetch. |
| WH-03 | Redirect to private or unsupported URL | Held/rejected; no summary. |
| WH-04 | Two members submit same canonical article | One source record, separate submissions, one candidate topic. |
| WH-05 | One uncorroborated celebrity pregnancy rumor | Held/developing only; never "confirmed" and never Library fact. |
| WH-06 | Official public announcement or corroborated culture reporting | `context_ready`; source-labeled short context. |
| WH-07 | NOLA bill article + official bill record | Civic topic with official link and status caveat. |
| WH-08 | Valid Library relationship | Current topic links to Library; no direct Library publication. |
| WH-09 | Repeated non-sensitive subject crosses Library threshold | Candidate only; existing curator/evidence workflow controls publication. |
| WH-10 | Broken source after validation | Held; no active link through Kinfolk. |

### K.3 Safety-monitoring tests

| ID | Test | Required result |
| --- | --- | --- |
| SM-01 | Single member unrest link | Candidate/needs corroboration only; no broad delivery. |
| SM-02 | Active official emergency-authority action for defined geography | `official_imminent`; in-app only to direct search/explicit safety follows. |
| SM-03 | Two independent original reports + curator approval | `active_monitoring`; "details may change" label. |
| SM-04 | State Department travel advisory | Official source link and non-legal guidance label. |
| SM-05 | CDC travel health notice | Public-health disclaimer; no personal medical advice. |
| SM-06 | Member follows affected geography and opts in | One in-app card; delivery reason is explicit follow. |
| SM-07 | Non-follower | No proactive delivery; direct search remains possible. |
| SM-08 | Minor/sensitive delivery disabled | No proactive sensitive item; neutral direct result only if allowed. |
| SM-09 | Ordinary member calls moderator endpoint | HTTP 403. |
| SM-10 | Load-test traffic | No topic, safety case, delivery event, Library signal, or notification. |

### K.4 Performance and reliability tests

| ID | Test | Required result |
| --- | --- | --- |
| PR-01 | Reindex seed twice | Idempotent source/entity/document/outbox counts. |
| PR-02 | 30 isolated concurrent Kinfolk requests | No shared-IP 429 after separate member-keyed rate-limit repair; no 503; resolver cache/queue metrics recorded. |
| PR-03 | Embedding provider transient error | Outbox retries with cap/backoff; no duplicate/partial vector marked ready. |
| PR-04 | Vector filter query | Disqualified stale/held/wrong-language/wrong-geography document never reaches final answer. |
| PR-05 | Browser hard refresh | Clarification/source/status UI remains stable; no session/401 regression. |

One failure blocks the release.

---

## L. Required proof package

Replit must submit one package after one narrow deployment:

1. Railway SHA, bundle identity, matching SHA256 hashes, `stale_bundle: false`, and readyz/pool state.
2. Production database preflight proving `vector` extension availability and the embedding contract dimension/model.
3. Additive migration proof, schema output, and changed-file list.
4. Source-manifest validation report including every held/rejected/stale source.
5. Seed manifest counts by source tier/entity type/language/region; no claim that count equals cultural coverage.
6. CK-01âCK-14, WH-01âWH-10, SM-01âSM-10, and PR-01âPR-05 test output.
7. Authenticated production JSON for CK-01, CK-03, CK-04, CK-06, CK-09, CK-12, WH-06, WH-07, SM-02, and SM-06.
8. Browser screenshots/video showing: an accurate answer, a clarification state, no unrelated recommendation, a source-labeled What's Happening card, a held source, and an in-app safety update.
9. Proof that no external notification, business signal, Circle message, owner outreach, or sensitive preference inference occurred.
10. A statement that login/auth, map, business claims, business data, Safety Hub, community feedback, mobile, and unrelated routes were not changed.

## M. Independent acceptance

Replit is not finished when it seeds 50 names, creates embeddings, or passes source-code tests. This build is complete only after independent authenticated production verification proves:

- Kinfolk correctly resolves *Sinners*, Michelle Williams, and context-aware Nigerian/English examples.
- Kinfolk asks rather than guesses for ambiguous names such as "Natalie."
- Opt-in cultural relevance can improve ranking but cannot override explicit query context or infer identity.
- Temple/HBCU discovery is geographically honest and source-grounded.
- Current-events links become reviewed, source-labeled context—not automatic truth.
- Credible unrest/disruption links become governed safety-monitoring candidates with privacy-safe geographic delivery.
- No raw member behavior/sensitive query becomes an embedding or cultural profile.
- No unrelated recommendation, false local result, stale source, or external notification is produced.

## References

[1]: https://github.com/pgvector/pgvector "pgvector — PostgreSQL vector similarity search, HNSW, filtering, and hybrid retrieval documentation"

[2]: https://www.postgresql.org/docs/current/textsearch.html "PostgreSQL — Full Text Search documentation"

[3]: https://www.sinnersmovie.com/toolkit/ "Sinners — Official film toolkit"

[4]: https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96 "Sinners — HBO Max official page"

[5]: https://www.iamtenitra.com/about "Michelle Williams — official biography"

[6]: https://nollywire.com/names/annie-macaulay-idibia/ "Nollywire — Annie Macaulay profile"

[7]: https://www.instagram.com/annieidibia1/ "Annie Macaulay — public profile"

[8]: https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/ "White House Initiative on HBCUs — institution list"

[9]: https://www.temple.edu/ "Temple University — official site"

[10]: https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/public/wireless-emergency-alerts "FEMA — Wireless Emergency Alerts"

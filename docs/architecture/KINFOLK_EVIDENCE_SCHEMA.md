# Multi-Domain Library Evidence Schema & Migration Guardrails

**Audience:** Replit engineering  
**Database:** PostgreSQL on Railway  
**Scope:** Additive schema for Kinfolk universal search, governed Library evidence, and source policy  
**No-touch constraint:** Do not alter login/auth tables, session tables, Maps, Safety, business listings, Circles, Marketplace, or existing user-profile behavior.

## 1. Design Goal

The Library must support many domains—not only Travel. It needs to represent medical, legal, automotive, entertainment, sports, culture, business, relocation, hobbies, and future domains without lowering evidence standards or creating a new table for every topic class.

The schema must answer these questions explicitly:

1. **What domain is this topic or claim in?**
2. **What source quality is required for that domain and consequence level?**
3. **Does a source support this exact topic, only a regional parent, or merely a private research response?**
4. **Has the source been verified, reviewed, and re-checked?**
5. **Can Kinfolk use it for future answers, or is it only ephemeral research?**
6. **Can a user’s private query be retained at all?**

## 2. Before Any Migration: Production Schema Discovery

Replit must first run the source-mapping inspection query already provided and identify the actual existing Library tables. The current production graph endpoint shows that there is already a topic/node table and a source-return path. Do not drop, rename, or recreate those tables.

Use this discovery query first:

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%knowledge%'
    OR table_name ILIKE '%source%'
    OR table_name ILIKE '%topic%'
    OR table_name ILIKE '%evidence%'
  )
ORDER BY table_name, ordinal_position;
```

> The DDL below assumes the existing Library topic table is `knowledge_nodes(id)` and its existing source table is `knowledge_sources(id)`. If production uses different names, substitute only the table references after schema discovery. Do not create duplicate competing topic/source systems.

## 3. Core Domain & Policy Tables

### 3.1 Evidence domains

This table keeps the taxonomy expandable. Do not hard-code only Travel and Medical in application logic.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_evidence_domains (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  default_consequence text NOT NULL
    CHECK (default_consequence IN ('low', 'medium', 'high')),
  default_citation_mode text NOT NULL
    CHECK (default_citation_mode IN ('none', 'recommended', 'required')),
  allows_community_experience boolean NOT NULL DEFAULT false,
  requires_human_review_for_library_publish boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO kinfolk_evidence_domains (
  id, slug, display_name, default_consequence, default_citation_mode,
  allows_community_experience, requires_human_review_for_library_publish
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'medical', 'Medical & Health', 'high', 'required', false, true),
  ('10000000-0000-0000-0000-000000000002', 'legal', 'Legal & Regulated', 'high', 'required', false, true),
  ('10000000-0000-0000-0000-000000000003', 'financial', 'Financial & Insurance', 'high', 'required', false, true),
  ('10000000-0000-0000-0000-000000000004', 'safety', 'Safety & Emergency', 'high', 'required', false, true),
  ('10000000-0000-0000-0000-000000000005', 'automotive', 'Automotive & Vintage Cars', 'medium', 'recommended', true, false),
  ('10000000-0000-0000-0000-000000000006', 'entertainment', 'Music, Arts & Entertainment', 'low', 'recommended', true, false),
  ('10000000-0000-0000-0000-000000000007', 'sports', 'Sports', 'low', 'recommended', true, false),
  ('10000000-0000-0000-0000-000000000008', 'travel', 'Travel & Relocation', 'medium', 'recommended', true, false),
  ('10000000-0000-0000-0000-000000000009', 'culture_history', 'Culture, History & Diaspora', 'medium', 'recommended', true, false),
  ('10000000-0000-0000-0000-000000000010', 'business', 'Business & Professional Development', 'medium', 'recommended', true, false)
ON CONFLICT (slug) DO NOTHING;
```

### 3.2 Source policies

Policies specify the source standard that the Universal Search Router must apply. A policy can be updated without redeploying a prompt.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_source_policies (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  domain_id uuid NOT NULL REFERENCES kinfolk_evidence_domains(id),
  consequence text NOT NULL CHECK (consequence IN ('low', 'medium', 'high')),
  minimum_distinct_sources integer NOT NULL DEFAULT 0 CHECK (minimum_distinct_sources >= 0),
  minimum_authoritative_sources integer NOT NULL DEFAULT 0 CHECK (minimum_authoritative_sources >= 0),
  citation_mode text NOT NULL CHECK (citation_mode IN ('none', 'recommended', 'required')),
  search_mode text NOT NULL CHECK (search_mode IN ('none', 'library_first', 'web_optional', 'web_required')),
  community_evidence_allowed boolean NOT NULL DEFAULT false,
  library_auto_promotion_allowed boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinfolk_source_policy_domains (
  id uuid PRIMARY KEY,
  source_policy_id uuid NOT NULL REFERENCES kinfolk_source_policies(id) ON DELETE CASCADE,
  domain text NOT NULL,
  list_type text NOT NULL CHECK (list_type IN ('allow', 'block', 'prefer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_policy_id, domain, list_type)
);
```

**Illustrative policies:**

| Policy | Domain | Minimum standard |
|---|---|---|
| `medical-authoritative-v1` | Medical | One or more authoritative sources; citations required; community evidence disallowed. |
| `legal-authoritative-v1` | Legal | Official/regulatory/professional sources; citations required; community evidence disallowed. |
| `automotive-discovery-v1` | Automotive | Verified businesses, clubs, specialist sources, and clearly labeled community experience allowed. |
| `culture-conversational-v1` | Entertainment/culture | Broad credible journalism/public sources; citations recommended when research is used; subjective framing allowed. |

## 4. Topic-to-Domain Mapping

A topic can belong to multiple domains. For example, a “Diabetes and Driving” topic may be Medical + Automotive; “Hip-Hop History in Philadelphia” may be Entertainment + Culture/History.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_knowledge_node_domains (
  id uuid PRIMARY KEY,
  knowledge_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES kinfolk_evidence_domains(id),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_node_id, domain_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_one_primary_domain_per_topic
  ON kinfolk_knowledge_node_domains (knowledge_node_id)
  WHERE is_primary = true;
```

## 5. Canonical Source Records

Existing `knowledge_sources` should remain the Library’s display source table. Add canonical and review fields if they do not already exist. This makes source records reusable across diabetes, legal, automotive, music, travel, and other topics.

```sql
ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS publisher_name text,
  ADD COLUMN IF NOT EXISTS source_kind text,
  ADD COLUMN IF NOT EXISTS source_tier text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_due_at timestamptz;

ALTER TABLE knowledge_sources
  ADD CONSTRAINT knowledge_sources_review_status_check
  CHECK (review_status IN ('pending_review', 'verified', 'needs_reverification', 'rejected', 'archived'));

ALTER TABLE knowledge_sources
  ADD CONSTRAINT knowledge_sources_source_tier_check
  CHECK (source_tier IS NULL OR source_tier IN ('authoritative', 'professional', 'credible_general', 'community'));

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_sources_canonical_url_unique
  ON knowledge_sources (canonical_url)
  WHERE canonical_url IS NOT NULL AND review_status <> 'archived';
```

### Canonicalization requirement

Before inserting or updating a source, normalize the URL server-side:

1. lowercase the hostname;
2. remove fragment identifiers;
3. remove known tracking parameters such as `utm_*`;
4. normalize trailing slashes;
5. retain meaningful query parameters only where the content genuinely depends on them.

This prevents the current Phuket pattern where the same source appears multiple times as separate mappings.

## 6. Scoped Evidence Mappings

Do not use a single undifferentiated source array. A source must be linked to a topic with an explicit evidence scope.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_knowledge_source_mappings (
  id uuid PRIMARY KEY,
  knowledge_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE RESTRICT,
  source_policy_id uuid REFERENCES kinfolk_source_policies(id),
  scope text NOT NULL CHECK (scope IN (
    'verified_topic',
    'destination_context',
    'background_context',
    'community_experience'
  )),
  claim text,
  evidence_section text,
  confidence text NOT NULL CHECK (confidence IN ('verified', 'high', 'community')),
  mapping_status text NOT NULL DEFAULT 'pending_review'
    CHECK (mapping_status IN ('pending_review', 'active', 'rejected', 'archived')),
  is_primary boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_node_id, source_id, scope)
);

CREATE INDEX IF NOT EXISTS kinfolk_knowledge_source_mappings_topic_status_idx
  ON kinfolk_knowledge_source_mappings (knowledge_node_id, mapping_status, scope);

CREATE INDEX IF NOT EXISTS kinfolk_knowledge_source_mappings_source_idx
  ON kinfolk_knowledge_source_mappings (source_id);
```

### Scope rules

| Scope | Meaning | Kinfolk use |
|---|---|---|
| `verified_topic` | Source supports the specific topic/claim. | May be cited as direct evidence. |
| `destination_context` | Source supports a parent city/country/destination, not a child claim. | May support broad context only; never specific proof. |
| `background_context` | Broad historical/cultural framing. | May be used with explicit context labeling. |
| `community_experience` | Reviewed community report or experience. | May support subjective discovery; never high-stakes factual proof. |

## 7. Claims and Evidence Review

A source URL alone is not enough. The claim it supports must be recorded and reviewed.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_evidence_claims (
  id uuid PRIMARY KEY,
  knowledge_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES kinfolk_evidence_domains(id),
  claim_text text NOT NULL,
  claim_risk text NOT NULL CHECK (claim_risk IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'verified', 'needs_reverification', 'rejected', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinfolk_claim_evidence (
  id uuid PRIMARY KEY,
  claim_id uuid NOT NULL REFERENCES kinfolk_evidence_claims(id) ON DELETE CASCADE,
  mapping_id uuid NOT NULL REFERENCES kinfolk_knowledge_source_mappings(id) ON DELETE CASCADE,
  support_level text NOT NULL CHECK (support_level IN ('direct', 'contextual', 'contradictory')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, mapping_id)
);
```

A medical or legal claim cannot become `verified` without at least the source-policy minimum. Enforce this in the application service or a database transaction, not through UI behavior alone.

## 8. Live Research & Write-Back Tables

Live web search results are not automatically published to the Library.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_research_runs (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL,
  user_id uuid,
  user_id_hash text NOT NULL,
  source_policy_id uuid NOT NULL REFERENCES kinfolk_source_policies(id),
  intent text NOT NULL,
  search_mode text NOT NULL,
  provider text,
  external_search_used boolean NOT NULL DEFAULT false,
  retention_class text NOT NULL
    CHECK (retention_class IN ('ephemeral', 'analytics_aggregated', 'library_candidate')),
  citation_count integer NOT NULL DEFAULT 0,
  request_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS kinfolk_research_run_sources (
  id uuid PRIMARY KEY,
  research_run_id uuid NOT NULL REFERENCES kinfolk_research_runs(id) ON DELETE CASCADE,
  source_id uuid REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  canonical_url text NOT NULL,
  title text,
  publisher_name text,
  source_tier text,
  cited_in_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (research_run_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS kinfolk_research_runs_retention_expiry_idx
  ON kinfolk_research_runs (retention_class, expires_at);
```

### Privacy guardrail

Do not store raw sensitive user-message text in `kinfolk_research_runs`. Store the minimum needed operational metadata. For a private medical, legal, relationship, immigration, financial, or safety query, default to `retention_class = 'ephemeral'` and an expiration policy. A research run may produce public candidate evidence only when it is non-sensitive, reusable, and explicitly allowed by policy.

## 9. Library Candidate & Review Workflow

```sql
CREATE TABLE IF NOT EXISTS kinfolk_library_candidates (
  id uuid PRIMARY KEY,
  research_run_id uuid REFERENCES kinfolk_research_runs(id) ON DELETE SET NULL,
  knowledge_node_id uuid REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  domain_id uuid NOT NULL REFERENCES kinfolk_evidence_domains(id),
  proposed_source_url text NOT NULL,
  proposed_claim text,
  proposed_scope text NOT NULL CHECK (proposed_scope IN (
    'verified_topic', 'destination_context', 'background_context', 'community_experience'
  )),
  candidate_status text NOT NULL DEFAULT 'pending_review'
    CHECK (candidate_status IN ('pending_review', 'approved', 'rejected', 'archived')),
  submitted_by_type text NOT NULL
    CHECK (submitted_by_type IN ('system', 'member', 'business_owner', 'reviewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_note text
);

CREATE INDEX IF NOT EXISTS kinfolk_library_candidates_review_queue_idx
  ON kinfolk_library_candidates (candidate_status, domain_id, created_at);
```

Only a reviewer-approved candidate can create or activate `kinfolk_knowledge_source_mappings` for high-stakes domains. Automated promotion is never permitted for Medical, Legal, Financial, or Safety domains.

## 10. User Learning & Sharing Permission Table

This table supports the prior privacy requirements without leaking sensitive searches into Circles or business insight.

```sql
CREATE TABLE IF NOT EXISTS kinfolk_user_learning_scopes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  domain_id uuid NOT NULL REFERENCES kinfolk_evidence_domains(id),
  allowed_for_private_help boolean NOT NULL DEFAULT true,
  allowed_for_recommendations boolean NOT NULL DEFAULT false,
  allowed_for_circle_use boolean NOT NULL DEFAULT false,
  allowed_for_anonymous_aggregate boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, domain_id)
);
```

**Server default:** `allowed_for_circle_use = false` and `allowed_for_anonymous_aggregate = false` for Medical, Legal, Financial, Safety, and any sensitive subtopic. Any expanded sharing must be a separate, explicit user action.

## 11. Graph API Contract Extension

Extend the current `/api/knowledge/graph/:topicId?surface=library` response. Do not break existing consumers. Add this additive structure:

```json
{
  "sourceSummary": {
    "status": "verified_topic | destination_context_only | overview_pending_sources",
    "verifiedTopicCount": 2,
    "destinationContextCount": 1,
    "communityExperienceCount": 0,
    "lastVerifiedAt": "2026-08-11T00:00:00.000Z"
  },
  "sourcesByScope": {
    "verifiedTopic": [],
    "destinationContext": [],
    "backgroundContext": [],
    "communityExperience": []
  }
}
```

The existing flattened `sources` array may remain temporarily for backwards compatibility, but all new Kinfolk and Library UI behavior must use `sourcesByScope` and `sourceSummary`.

## 12. Migration Sequence and Rollback Guardrails

### Migration sequence

1. Run production schema discovery and record a redacted database fingerprint.
2. Create only the new `kinfolk_*` tables and indexes.
3. Add nullable/additive columns to `knowledge_sources`; do not change existing values yet.
4. Backfill canonical URLs and deduplicate source records in a dry run.
5. Create scoped source mappings for the current verified Health records first to validate compatibility.
6. Backfill Phuket and other Travel/region topics according to the evidence-review policy.
7. Ship graph API additions behind a feature flag.
8. Update the Library UI and Kinfolk retrieval pipeline to read the new scoped structure.
9. Run regression tests, then enable the flag.

### Rollback

- New tables are additive; leave them in place but disable the feature flag if retrieval/UI errors occur.
- Do not delete source records or mappings in the first deployment. Mark duplicates `archived` only after a migration report is approved.
- Preserve the existing flattened graph response until every consumer has moved to the scoped response.

## 13. Required Regression Tests

| Test | Expected result |
|---|---|
| Maternal Health graph | Existing three verified sources remain visible and correctly scoped. |
| IVF/Fertility graphs | Existing health sources remain visible; no change to auth or profile behavior. |
| Kata Beach graph | Returns `overview_pending_sources` or real child sources; parent Phuket references are separate destination context. |
| Phuket parent graph | Shows only unique active mappings after deduplication. |
| Diabetes router request | Medical policy; required citations; no community evidence. |
| Philadelphia rap router request | Culture policy; conversational answer allowed; no forced academic threshold. |
| Vintage-car router request | Automotive discovery policy; MWM/community signals permitted only when non-sensitive and relevant. |
| Circle privacy | No private health/legal/safety research is exposed to Circles, businesses, or recommendations without explicit opt-in. |
| No-touch smoke test | Login, active session, Map, Safety, business directory, Marketplace, and Circles still work. |

# Replit Implementation Package — Adaptive Library, Web Evidence, and Full-Depth Knowledge Delivery

**Status:** Design and implementation specification. Do not publish new Library content, create notifications, add articles, or change Kinfolk prompts until the preflight/audit gates in this document pass.

**Founder requirement:** The Library must become a living knowledge system, not a short description plus a few links. Every topic must give a useful starting answer, cite the evidence behind factual claims, and let the member choose **Show less** or **Show more**. Kinfolk and the Library must use the same evidence plan, while preserving different source and safety rules for current conflict, religion/culture, relationships, health, law, and ordinary cultural knowledge.

> **Architecture principle:** The web is an evidence layer. Mapping With Melanin is the intelligence, community, and navigation layer. A missing MWM record must never prevent Kinfolk or the Library from explaining a legitimate topic; a web result must never silently override MWM’s private community, business, or safety data.

---

## 1. What is wrong in the current Library

The current Library has relevant foundations, but they are not enough for the required experience:

| Existing structure | Existing capability | Required extension |
| --- | --- | --- |
| `knowledge_topics` | Topic name, description, category, keywords/synonyms, credibility fields, user-created flag, trusted sources. | Add versioned, depth-specific answer content, evidence state, freshness, sensitivity, and parent/child branch policy. |
| `knowledge_graph` route | Returns the node, Library evidence sources, relationships, and entities. | Add an answer payload composed from validated evidence blocks, at a requested depth. |
| `knowledge_articles` | Static editorial content with summary/body/tags/rating/disclaimer. | Keep for authored editorial pieces; do not force all dynamic/current knowledge into a static article row. |
| `happening_now_stories` | Generic member-submitted title/summary/URL record. | Replace/extend with safe article ingestion, extraction, evidence validation, topic mapping, media/hashtag handling, and safety-review states. |
| `user_delivery_preferences` | Digest settings. | Add explicit Library answer-depth preference and per-session override without storing a member’s sensitive topic content. |

A three-sentence topic description is a navigation preview, not a knowledge answer. Do not replace `description`; add depth-aware content around it.

---

## 2. Required member experience

### 2.1 One topic, three evidence-grounded depth levels

A Library topic page and a Kinfolk answer use the same response plan.

| Level | User sees | Intended use |
| --- | --- | --- |
| **Show less / Quick answer** | A short plain-language answer, one source label, any non-negotiable safety notice, and `Show more`. | A member who wants the immediate answer. |
| **Standard** | Answer, key context, three to five evidence-backed points, why it matters, related Library branches, and citations. | Default Library experience. |
| **Show more / Deep dive** | Detailed explanation, definitions, timeline/causes where appropriate, source-by-source evidence, uncertainty, related topics, local/community resources only when safe, and update information. | A member who wants to learn deeply or save/follow the topic. |

**Depth changes presentation, never evidence standards.** A health, legal, safety, or urgent notice remains present at every depth. The brief mode never rewrites facts, removes a source label, or turns a qualified conclusion into a stronger claim.

### 2.2 Every topic has a transparent evidence footer

```text
Last evidence review: 2026-08-13
Evidence policy: Authoritative public-health sources
Currentness: Review required every 30 days or when a new official release is found
Sources: CDC · NIH Office of Disease Prevention · peer-reviewed research
What Kinfolk can do next: Explain terms · Show more · Find local resources · Save topic
```

The footer may never show an unvalidated URL as an active source. The Library link-integrity worker must mark a known 404/blocked/moved source `held` before it is rendered as a clickable source.

---

## 3. Additive database migration

Create `artifacts/api-server/src/lib/migrations/20260813_adaptive_library_evidence.sql`, register it once in `startup-migrations.ts`, and run it first in a disposable database. The migration must be additive and idempotent.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS library_topic_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'superseded', 'held')),
  evidence_policy TEXT NOT NULL
    CHECK (evidence_policy IN (
      'general', 'culture', 'current_events', 'religion_culture',
      'relationships', 'health_authoritative', 'legal_authoritative',
      'financial_authoritative', 'safety_official'
    )),
  sensitivity_tier TEXT NOT NULL DEFAULT 'public'
    CHECK (sensitivity_tier IN ('public', 'sensitive', 'restricted')),
  currentness_class TEXT NOT NULL DEFAULT 'stable'
    CHECK (currentness_class IN ('stable', 'periodic', 'current', 'urgent')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  generated_by TEXT NOT NULL DEFAULT 'curator'
    CHECK (generated_by IN ('curator', 'kinfolk_draft', 'editorial', 'system_migration')),
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(topic_id, version_number)
);

CREATE TABLE IF NOT EXISTS library_answer_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_version_id UUID NOT NULL REFERENCES library_topic_versions(id) ON DELETE CASCADE,
  depth TEXT NOT NULL CHECK (depth IN ('brief', 'standard', 'deep')),
  block_order INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'direct_answer', 'context', 'key_points', 'why_it_matters', 'timeline',
    'causes', 'uncertainty', 'safety_notice', 'discussion_prompt',
    'local_resources', 'related_topics', 'source_note'
  )),
  body_markdown TEXT NOT NULL,
  claim_ids UUID[] NOT NULL DEFAULT '{}',
  required_at_all_depths BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_version_id, depth, block_order)
);

CREATE TABLE IF NOT EXISTS library_evidence_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_version_id UUID NOT NULL REFERENCES library_topic_versions(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_kind TEXT NOT NULL CHECK (claim_kind IN (
    'fact', 'statistic', 'definition', 'consensus', 'context', 'guidance', 'uncertainty'
  )),
  source_requirement TEXT NOT NULL CHECK (source_requirement IN (
    'none', 'reputable', 'authoritative', 'two_independent', 'official'
  )),
  geographic_scope TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'held', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library_claim_sources (
  claim_id UUID NOT NULL REFERENCES library_evidence_claims(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES library_evidence_sources(id) ON DELETE RESTRICT,
  support_role TEXT NOT NULL CHECK (support_role IN ('primary', 'corroborating', 'context', 'contradicting')),
  quoted_excerpt TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (claim_id, source_id)
);

CREATE TABLE IF NOT EXISTS library_retrieval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES knowledge_topics(id) ON DELETE SET NULL,
  initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_class TEXT NOT NULL CHECK (request_class IN ('library_refresh', 'kinfolk_answer', 'member_link', 'curator_research')),
  domain_policy TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  raw_query_retained BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('queued', 'retrieving', 'evaluating', 'draft_ready', 'held', 'failed')),
  source_count INTEGER NOT NULL DEFAULT 0,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS library_user_depth_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_depth TEXT NOT NULL DEFAULT 'standard' CHECK (default_depth IN ('brief', 'standard', 'deep')),
  allow_adaptive_depth BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library_depth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_version_id UUID NOT NULL REFERENCES library_topic_versions(id) ON DELETE CASCADE,
  requested_depth TEXT NOT NULL CHECK (requested_depth IN ('brief', 'standard', 'deep')),
  domain_class TEXT NOT NULL CHECK (domain_class IN ('general', 'culture', 'current_events', 'religion_culture', 'relationships', 'high_consequence')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS library_depth_events_user_created_idx
  ON library_depth_events(user_id, created_at DESC);
```

**Privacy requirement:** `library_depth_events` stores the depth action and coarse domain only. It never stores raw question text, diagnosis, religion, relationship details, ethnicity, current location, or article body as a preference signal.

---

## 4. Domain policy registry: the source rules must differ by topic

Create `artifacts/api-server/src/library/evidence-policy.ts`.

```ts
export type LibraryDomainPolicy =
  | 'general'
  | 'culture'
  | 'current_events'
  | 'religion_culture'
  | 'relationships'
  | 'health_authoritative'
  | 'legal_authoritative'
  | 'financial_authoritative'
  | 'safety_official';

export interface EvidencePolicyRule {
  requiredMinimum: 'none' | 'reputable' | 'authoritative' | 'two_independent' | 'official';
  liveRetrieval: 'never' | 'when_stale' | 'always';
  communityEvidenceRole: 'context_only' | 'discussion_only' | 'blocked';
  sourceKinds: string[];
  requiresCuratorBeforePublish: boolean;
  forceSafetyNotice: boolean;
  maxAgeDays?: number;
}

export const LIBRARY_EVIDENCE_POLICIES: Record<LibraryDomainPolicy, EvidencePolicyRule> = {
  general: {
    requiredMinimum: 'reputable', liveRetrieval: 'when_stale', communityEvidenceRole: 'context_only',
    sourceKinds: ['institutional', 'reputable_reference'], requiresCuratorBeforePublish: false, forceSafetyNotice: false,
  },
  culture: {
    requiredMinimum: 'reputable', liveRetrieval: 'when_stale', communityEvidenceRole: 'context_only',
    sourceKinds: ['official', 'reputable_reporting', 'cultural_institution', 'scholarly'], requiresCuratorBeforePublish: false, forceSafetyNotice: false,
  },
  current_events: {
    requiredMinimum: 'two_independent', liveRetrieval: 'always', communityEvidenceRole: 'discussion_only',
    sourceKinds: ['official', 'primary_document', 'reputable_reporting'], requiresCuratorBeforePublish: true, forceSafetyNotice: false, maxAgeDays: 14,
  },
  religion_culture: {
    requiredMinimum: 'reputable', liveRetrieval: 'when_stale', communityEvidenceRole: 'discussion_only',
    sourceKinds: ['academic', 'faith_institution', 'museum', 'reputable_reference'], requiresCuratorBeforePublish: false, forceSafetyNotice: false,
  },
  relationships: {
    requiredMinimum: 'reputable', liveRetrieval: 'when_stale', communityEvidenceRole: 'discussion_only',
    sourceKinds: ['academic', 'licensed_professional_org', 'reputable_reference'], requiresCuratorBeforePublish: false, forceSafetyNotice: false,
  },
  health_authoritative: {
    requiredMinimum: 'authoritative', liveRetrieval: 'always', communityEvidenceRole: 'blocked',
    sourceKinds: ['government_health', 'public_health', 'medical_association', 'peer_reviewed'], requiresCuratorBeforePublish: true, forceSafetyNotice: true, maxAgeDays: 30,
  },
  legal_authoritative: {
    requiredMinimum: 'official', liveRetrieval: 'always', communityEvidenceRole: 'blocked',
    sourceKinds: ['government', 'court', 'statute', 'agency'], requiresCuratorBeforePublish: true, forceSafetyNotice: true, maxAgeDays: 30,
  },
  financial_authoritative: {
    requiredMinimum: 'authoritative', liveRetrieval: 'always', communityEvidenceRole: 'blocked',
    sourceKinds: ['government', 'regulator', 'institutional'], requiresCuratorBeforePublish: true, forceSafetyNotice: true, maxAgeDays: 30,
  },
  safety_official: {
    requiredMinimum: 'official', liveRetrieval: 'always', communityEvidenceRole: 'blocked',
    sourceKinds: ['emergency_authority', 'government', 'public_health', 'humanitarian_agency'], requiresCuratorBeforePublish: true, forceSafetyNotice: true, maxAgeDays: 3,
  },
};
```

### Required treatment of the user’s examples

| User question | Domain policy | Required behavior |
| --- | --- | --- |
| “What is happening in Sudan?” / “Tell me about the war in Sudan.” | `current_events`, potentially `safety_official` | Use current independent reporting and official/humanitarian sources. Date every factual claim; present uncertainty and human-impact context; do not turn it into a graphic or unmoderated social feed. |
| “Why don’t Muslims celebrate Christmas?” | `religion_culture` | Explain that Muslim beliefs/practices are diverse; describe mainstream theological context from credible faith/academic sources; do not say all Muslims act identically or create a safety label. |
| “How do interracial couples deal with life?” | `relationships` | Avoid a monolithic answer. Explain common themes documented in relationship research and invite the member to specify context if desired. Discussion posts are separate and optional; do not treat anecdotes as factual proof. |
| “Tell me about Black maternal mortality.” | `health_authoritative` | Current CDC/NIH/HHS/peer-reviewed evidence only, source-backed statistics, structural context without biological essentialism, clear health-info boundary, and urgent symptom escalation. |

---

## 5. Controlled retrieval and evidence synthesis worker

Create `artifacts/api-server/src/library/evidence-synthesis-worker.ts`. Do not give the LLM an unrestricted “search the internet” instruction. The worker owns search, extraction, source evaluation, claim linking, and draft creation.

```ts
export async function buildEvidenceDraft(input: {
  topicId: string;
  policy: LibraryDomainPolicy;
  userRequest?: string;       // Ephemeral; hash only after retrieval run creation.
  requestedDepth: 'brief' | 'standard' | 'deep';
}): Promise<{ topicVersionId: string; status: 'draft_ready' | 'held' }> {
  const rule = LIBRARY_EVIDENCE_POLICIES[input.policy];
  const run = await createRetrievalRun({
    topicId: input.topicId,
    requestClass: input.userRequest ? 'kinfolk_answer' : 'library_refresh',
    domainPolicy: input.policy,
    queryHash: sha256(normalizeForHash(input.userRequest ?? input.topicId)),
  });

  // 1. Generate 2–5 scoped queries internally; do not send user profile data.
  const queries = await generateEvidenceQueries({ topicId: input.topicId, policy: input.policy, userRequest: input.userRequest });
  // 2. Retrieve full page text from an approved provider/source connector.
  const candidates = await retrievePublicSources({ queries, allowedKinds: rule.sourceKinds, maximum: 12 });
  // 3. Reject unsafe URL schemes, private-network targets, tracking redirects, stale/404 pages, low-authority sources, and duplicate syndication.
  const vetted = await vetSources(candidates, rule);
  // 4. For current/high-consequence topics, require source minimum BEFORE summary generation.
  if (!meetsMinimum(vetted, rule.requiredMinimum)) {
    await holdRetrievalRun(run.id, 'Evidence threshold not met');
    return { topicVersionId: await createHeldVersion(input.topicId, input.policy), status: 'held' };
  }
  // 5. Extract attributable claims and contradictions; never make a claim without linked sources.
  const claims = await extractAndValidateClaims({ sources: vetted, policy: input.policy });
  // 6. Generate brief, standard, and deep draft blocks using only verified claim IDs.
  const blocks = await composeDepthBlocks({ claims, policy: input.policy });
  // 7. Curator review is mandatory for policy-required topics before publish.
  const version = await saveDraftVersion({ topicId: input.topicId, policy: input.policy, claims, blocks, requiresReview: rule.requiresCuratorBeforePublish });
  await completeRetrievalRun(run.id, vetted.length);
  return { topicVersionId: version.id, status: 'draft_ready' };
}
```

### Mandatory source checks

1. Normalize and permit only `https` public URLs.
2. Resolve redirects and reject private/loopback/link-local IPs to prevent SSRF.
3. Store canonical URL, publisher, publication/update date, retrieval time, HTTP status, final URL, title, source tier, and link-health state.
4. Deduplicate syndicated copies by canonical publisher/content hash.
5. Reject/hold a factual claim if its supporting source is 404, stale beyond the domain rule, off-topic, inaccessible, or weakly sourced.
6. Preserve contradicting evidence. It must change the response to `uncertainty`, `contested`, or `segmented` rather than being deleted.
7. Never auto-publish a current-event, safety, health, legal, or financial draft.

---

## 6. API contract

### 6.1 Adaptive Library topic

Add to `knowledge-graph.ts` or create `library-content.ts`; do not inject Kinfolk prompt logic into the graph route.

```http
GET /api/library/topics/:topicId/content?depth=brief|standard|deep
```

```json
{
  "topic": { "id": "...", "title": "Black Maternal Mortality", "policy": "health_authoritative" },
  "version": { "id": "...", "status": "published", "lastReviewedAt": "2026-08-13T00:00:00Z", "currentness": "periodic" },
  "depth": "standard",
  "blocks": [
    { "type": "direct_answer", "markdown": "...", "requiredAtAllDepths": false },
    { "type": "safety_notice", "markdown": "General health information — not medical advice. Seek urgent care for emergency symptoms.", "requiredAtAllDepths": true }
  ],
  "sources": [{ "id": "...", "publisher": "CDC", "title": "...", "url": "https://...", "status": "active", "lastVerified": "..." }],
  "canShowLess": true,
  "canShowMore": true,
  "relatedTopics": []
}
```

### 6.2 Depth control

```http
POST /api/library/topic-views/:topicVersionId/depth
{ "depth": "brief" | "standard" | "deep" }
```

This endpoint writes the coarse depth event only. It does not write the topic title/query for sensitive policies to a user-preference history. A separate explicit setting controls `default_depth`.

### 6.3 Kinfolk handoff

Kinfolk must receive a summary plan, verified claims, source IDs, currentness, and safety notice from the Library service. It must not create its own citation list independently.

```ts
export type LibraryAnswerPlan = {
  topicVersionId: string;
  policy: LibraryDomainPolicy;
  depth: 'brief' | 'standard' | 'deep';
  blocks: Array<{ type: string; markdown: string; claimIds: string[] }>;
  sources: Array<{ id: string; publisher: string; url: string; status: 'active' }>;
  safetyNotice?: string;
  currentness: 'stable' | 'periodic' | 'current' | 'urgent';
};
```

---

## 7. Web UI implementation

Modify only the Library page/component and the Kinfolk response component needed for shared depth controls.

### Library page

1. Render **Quick answer** by default only when member default depth is `brief`; otherwise render `standard`.
2. Put `Show less` / `Show more` after the main answer, with an accessible `aria-label` and no hidden sensitive labels.
3. Keep the policy source label, update time, and required safety notice visible at every depth.
4. Render a source only if `status='active'` and it passed link validation. A held source can be named as archived evidence but is not clickable.
5. Render community discussion/media as a separate `Community conversation` section; it is not Library evidence and cannot alter the evidence answer.
6. `Related topics` must be labeled by relationship type such as `background`, `current update`, `health resource`, or `community discussion`.

### Kinfolk response

1. Kinfolk can show the answer compactly in chat.
2. `Tell me more` expands the same answer plan or opens the selected Library topic/depth—it does not issue a separate ungrounded model answer.
3. `Show me sources` opens the validated source sheet.
4. High-consequence safety notices remain visible in short chat replies.

---

## 8. Black maternal mortality: required complete fixture

This is a required **capability fixture**, not a one-off hard-coded answer. It proves that the system can retrieve current authoritative health evidence, explain a culturally relevant health disparity without biological essentialism, preserve uncertainty, provide an understandable answer, and recognize urgent medical escalation.

### 8.1 Topic seed

```sql
INSERT INTO knowledge_topics (
  topic_name, canonical_name, category, parent_category, topic_type,
  description, keywords, synonyms, credibility_tier, credibility_score,
  enabled, search_frequency_days
) VALUES (
  'Black Maternal Mortality', 'Black maternal mortality in the United States',
  'health', 'maternal_health', 'topic',
  'A source-backed Library topic about maternal mortality disparities, preventability, respectful maternity care, and resources.',
  ARRAY['maternal mortality', 'pregnancy-related mortality', 'maternal health', 'Black maternal health', 'pregnancy safety'],
  ARRAY['Black maternal mortality', 'Black maternal health disparities'],
  'authoritative', 95, true, 30
)
ON CONFLICT DO NOTHING;
```

### 8.2 Evidence policy

Use `health_authoritative`. Required source order:

1. CDC/NCHS final maternal mortality data for current statistics.
2. CDC Hear Her and CDC/Maternal Mortality Review Committee material for preventability and warning signs.
3. NIH/HHS material for structural/health-equity context.
4. Peer-reviewed research only as corroboration, never as a replacement for current public-health statistics.

Every statistic must have a source, date, population definition, and unit. Do not preserve a number merely because it appeared in an earlier answer. Refresh official statistics when final data is released.

### 8.3 Required content blocks

| Block | Brief | Standard | Deep |
| --- | --- | --- | --- |
| Direct answer | Explain that Black maternal mortality is a serious U.S. health disparity and source it. | Add current rate context and non-biological explanation. | Add definitions, data methodology, preventability, trends, and uncertainty. |
| Why it happens | One sentence: multiple systemic/clinical/access factors interact. | Evidence-backed structural, quality-of-care, access, and respectful-care context. | Detailed source-backed factors without stereotyping or assigning blame to the patient. |
| What can help | General patient-advocacy/resource language. | Recognized warning signs and questions for care team. | Detailed planning resources and local connections only after user asks/permits location use. |
| Safety notice | Always visible: general health information, not diagnosis; emergency symptoms require urgent care. | Same. | Same. |
| Sources | At least CDC/NIH labels. | Clickable active sources. | Source notes, dates, claim mapping, and update log. |

### 8.4 Required emergency override

If a member changes from general education to a potential emergency—for example, pregnancy/postpartum chest pain, difficulty breathing, heavy bleeding, seizure, fainting, severe headache with vision changes, or thoughts of self-harm—Kinfolk must leave Library explanation mode and invoke the existing `safety_emergency` / high-consequence health flow. It must never respond with a long article first.

### 8.5 Forbidden behavior

- Do not say race is a biological cause.
- Do not say education/income automatically eliminate risk.
- Do not diagnose a member or give a personal risk score.
- Do not source health claims from social posts, community reviews, business marketing, or unverified article links.
- Do not claim a current rate without current official evidence.
- Do not hide the medical boundary when the member presses `Show less`.

---

## 9. Required fixtures for Sudan, religion/culture, and relationships

### Sudan/current conflict fixture

Create a `Sudan conflict and humanitarian conditions` topic only from verified current material. Required source mix: one humanitarian/international organization or official source plus two independent reputable reports when publishing a current summary. Label `Last updated`, distinguish verified facts from changing reports, and do not send an alert unless the separate safety-monitoring policy threshold is met. A member article link may create a private candidate, never a public factual update by itself.

### Muslim/Christmas fixture

Create a `Christmas and Muslim religious practice` topic under `religion_culture`. It must use careful language: many Muslims do not observe Christmas as a religious holiday because Islamic theology differs from Christian doctrine; practices vary by family, country, culture, interfaith household, and individual. Kinfolk must never phrase the topic as if every Muslim has the same belief or practice. `Show more` can include historical/theological context with credible academic/faith-institution sources.

### Interracial couples fixture

Create a `Interracial relationships and navigating family/community experiences` topic under `relationships`. It must avoid a single universal story. Standard/deep content can cover communication, family/community dynamics, identity, culture, discrimination, safety, and support only when backed by relationship research and clearly framed as common themes—not a prediction about a particular couple. Community stories can be visible only under audience/consent controls and are never evidence for universal claims.

---

## 10. Tests

Create unit, integration, and browser tests before deployment.

### Unit/integration tests

1. `brief`, `standard`, and `deep` return the same verified claim set hierarchy; brief cannot omit a required safety block.
2. A `held` or 404 source is not clickable and cannot be used to support a published claim.
3. A `health_authoritative` topic cannot publish with a community post as the only evidence.
4. A current-event topic cannot publish without its required independent/official source threshold.
5. Conflicting sources generate an uncertainty/contested block rather than a silent one-sided conclusion.
6. A depth event stores no raw health topic/query text.
7. Kinfolk `Tell me more` uses the Library answer plan rather than a new uncited answer.
8. Member media/article submissions remain distinct from Library verified evidence.

### End-to-end browser tests

1. Open Black Maternal Mortality at `standard`, press `Show less`, and confirm the health boundary/source label remains.
2. Press `Show more`; confirm deep content and active source links render.
3. Open a stale ACS source; confirm it is held/not clickable and does not cause an external 404 navigation.
4. Ask Kinfolk about Black maternal mortality; confirm source-backed concise answer plus Library `Tell me more` handoff.
5. Send an urgent pregnancy/postpartum symptom prompt; confirm emergency flow takes priority over long Library content.
6. Open Sudan topic; confirm last-updated/source labels and no user article is presented as fact.
7. Open Muslim/Christmas and interracial-relationship fixtures; confirm no stereotypes and `Show more` behavior.
8. Run the current 1 → 5 → 15 → 30 production canary after all Library changes; no 429/503 regression.

---

## 11. Deployment proof and release order

1. Fix the current release identity mismatch and shared-IP rate limit first; do not deploy this Library feature on a stale bundle.
2. Add migration; run `pnpm` typecheck/test against a disposable database.
3. Implement evidence policy registry, retrieval worker, claims/blocks, source-link health checks, and APIs.
4. Seed fixtures only as reviewed drafts; Black maternal mortality must be curated through the authoritatively sourced workflow.
5. Implement the UI depth controls and Kinfolk handoff.
6. Run source/link checks, unit tests, integration tests, browser tests, and the capacity canary.
7. Send Manus: migration output, seed manifest, evidence ledger, exact source URLs/statuses, screenshots at all depths, privacy-test output, deployed SHA, clean `/api/version`, and canary output.
8. No article submitted by a member becomes Library fact, safety alert, or external notification during this release.

## References

[1]: https://blogs.cdc.gov/nchs/2026/03/04/7885/ "CDC/NCHS — Final 2024 maternal mortality data"
[2]: https://prevention.nih.gov/about-odp/directors-messages/2024/addressing-maternal-health-crisis "NIH Office of Disease Prevention — Maternal health crisis"
[3]: https://www.cdc.gov/hearher/news-media/article-health-inequities.html "CDC Hear Her — Maternal health inequities"
[4]: https://www.cdc.gov/vitalsigns/respectful-maternity-care/index.html "CDC Vital Signs — Respectful maternity care"
[5]: https://www.cdc.gov/womens-health/features/maternal-mortality.html "CDC — Reducing maternal mortality"
[6]: https://arxiv.org/abs/2407.01219 "Research on retrieval-augmented generation practices"

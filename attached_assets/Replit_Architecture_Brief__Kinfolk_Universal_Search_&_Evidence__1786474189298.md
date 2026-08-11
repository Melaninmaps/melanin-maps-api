# Replit Architecture Brief: Kinfolk Universal Search & Evidence Intelligence

**Owner:** Replit engineering  
**Priority:** Product-defining architecture  
**Author:** Manus AI  
**Scope:** KinfolkAI, the Library evidence layer, controlled live-web research, and source-aware answer rendering  
**No-touch guardrail:** Do **not** alter login, authentication/session behavior, Maps, Safety Hub, existing business-listing rendering, Marketplace, Circles, Connections, global navigation, or unrelated routes while implementing this work.

## 1. The Product Definition Replit Must Build Toward

> **Kinfolk is a culturally aware, privacy-respecting, general-purpose search and reasoning companion—not a travel chatbot, not a medical database, and not a generic directory filter.**

A member can ask Kinfolk about **diabetes, vintage cars, a Philadelphia rapper, a professional decision, a sports team, a destination, local businesses, a historical topic, or basic math**. Kinfolk should choose the right response method rather than applying one evidence rule to every conversation.

The Library is Kinfolk’s **durable, governed evidence layer**. It should grow when high-quality, reusable knowledge has been vetted. It is not a static travel catalog and it must not be populated by every casual chat response.

Kinfolk’s value is the combination of four things:

| Layer | Role |
|---|---|
| **Conversation** | A natural, helpful chat experience that answers simple questions immediately and recognizes when more research is needed. |
| **Live search** | Current public-web research for questions where freshness, specificity, or verification matters. |
| **Library** | Reusable, governed, cited knowledge that has a clear evidence state and can improve future relevant answers. |
| **Community ecosystem** | Opt-in, privacy-safe signals from businesses, community feedback, saved places, and demand patterns—never a substitute for medical, legal, or safety evidence. |

## 2. The Non-Negotiable Principle: Calibrate Evidence to the Question

Kinfolk must not answer every query as though it were a medical journal question. It must also not use social posts or unverified community material as proof for high-stakes claims.

| Question type | Example | Kinfolk behavior | Evidence standard |
|---|---|---|---|
| **Simple/general knowledge** | “What is 12 times 8?” | Answer directly. | No web search or citation required. |
| **Conversational culture or entertainment** | “Who is the best rapper from Philadelphia?” | Answer conversationally; make clear that “best” is subjective. Use current cultural journalism, public biographies, music criticism, charts, or the user’s requested framing when research is helpful. | Broad credible web sources; no false requirement for academic sources. |
| **Lifestyle or hobby** | “How do I find a vintage car club?” | Ask location only if needed; search current clubs, events, forums, museums, and businesses. | Reputable specialist sites, official club/event pages, verified directory data, and clearly labeled community signals. |
| **Community/business discovery** | “Find a welcoming Black-owned brunch spot near me.” | Combine MWM directory, verified business details, opt-in community feedback, and live local web context. | Distinguish verified business facts from community-vibe feedback and general web results. |
| **Medical or mental health** | “What should I ask my doctor about diabetes?” | Give educational information, encourage professional care, and offer culturally relevant resources only when the user opts in. | Government health agencies, professional societies, peer-reviewed literature, and primary clinical sources. Never use Facebook, anecdotal posts, or unreviewed community comments as medical evidence. |
| **Legal, financial, insurance, or other regulated topics** | “How do I choose an employment lawyer?” | Provide educational guidance and verified referral pathways; do not present individualized professional advice as fact. | Government, bar/credentialing bodies, regulators, official provider data, and primary documentation. |
| **Emergency/safety/current warnings** | “Is there a hurricane warning where my son is?” | Prioritize official alerts; state the alert time and source. | Government/emergency authorities and official time-stamped alert feeds only. |

### Example: the rapper question

Kinfolk must **not** reply “no results” just because there is no clinical study. It can say that there is no objectively provable answer, then offer a thoughtful, transparent response based on the user’s definition of “best”—influence, lyricism, commercial impact, era, or local legacy.

### Example: diabetes

Kinfolk must **not** treat a viral post, a restaurant review, or community anecdote as evidence for a medical claim. It can still be warm, culturally aware, and useful; the answer must cite medical-quality evidence and clearly separate general wellness suggestions from clinical information.

## 3. Required Request Router

Implement a server-side **Kinfolk Request Router** before calling an LLM or web-search tool. The router is responsible for intent classification, evidence-policy selection, privacy enforcement, retrieval planning, and source rendering.

```text
User message
  → privacy gate
  → intent / consequence / freshness classifier
  → evidence-policy selector
  → retrieval planner
      ├─ verified Library graph
      ├─ MWM business + community data (when relevant and permitted)
      ├─ live web search (when needed)
      └─ direct answer (when no retrieval is needed)
  → answer generator
  → citation / provenance renderer
  → optional governed Library candidate
```

### 3.1 The router must return a structured plan

```ts
type KinfolkAnswerPlan = {
  intent:
    | 'general_knowledge'
    | 'culture_entertainment'
    | 'community_discovery'
    | 'travel_relocation'
    | 'medical_health'
    | 'legal_regulated'
    | 'safety_emergency'
    | 'business_owner'
    | 'other';
  consequence: 'low' | 'medium' | 'high';
  freshness: 'none' | 'helpful' | 'required';
  searchMode: 'none' | 'library_first' | 'web_optional' | 'web_required';
  sourcePolicyId: string;
  permittedMemoryScopes: string[];
  permittedCommunityScopes: string[];
  responseStyle: 'concise' | 'conversational' | 'careful' | 'urgent';
};
```

The model can assist classification, but **the source policy must be enforced in code**. A prompt alone is not enough.

## 4. Recommended Search Implementation

### 4.1 Start with one primary live-web provider

The cleanest initial path is the **OpenAI Responses API with the `web_search` tool**, because Kinfolk is already running on OpenAI. The tool supports live web access, optional search, domain allow/block filtering, source metadata, and URL citations. The user interface must render any web citations as visible, clickable links. [1]

Replit should use the Responses API for new work—not a deprecated preview search path. The provider documentation specifically recommends the `web_search` tool for current integrations and notes that it returns source/citation metadata. [1]

**Do not build simultaneous production dependencies on OpenAI, Tavily, and Exa in phase one.** Pick one primary provider, create a provider adapter, and add a fallback only after the core answer contract is proven.

```ts
interface WebResearchProvider {
  search(input: SearchRequest): Promise<SearchResultBundle>;
}
```

A secondary provider can be added later through the same adapter. Tavily supports domain include/exclude controls, latency/relevance modes, and result snippets. [2] Exa supports domain/path filters, research modes, publication-focused search, and structured synthesized output. [3]

### 4.2 Search only when it adds value

| Routing outcome | Web search behavior |
|---|---|
| `none` | Answer directly. Example: basic math or stable casual knowledge. |
| `library_first` | Query only verified Library evidence first. Search the web only if evidence is stale, insufficient, or the user asks for current information. |
| `web_optional` | Let Kinfolk decide whether current research materially improves the answer; record whether it searched. |
| `web_required` | Require live research. Example: a current emergency warning, latest regulation, current sports schedule, or a current local event. |

Use user location only when it is relevant and permitted. Approximate city/region is enough for most discovery requests; do not require precise location for a general question. The OpenAI web-search tool supports approximate location controls for local search refinement. [1]

### 4.3 Domain policies are enforced by topic class

Create a configurable `source_domain_policies` table rather than hardcoding domain lists in prompts.

```ts
type SourceDomainPolicy = {
  id: string;
  intent: string;
  consequence: 'low' | 'medium' | 'high';
  allowedDomains: string[];
  blockedDomains: string[];
  minimumAuthoritativeSources: number;
  minimumDistinctDomains: number;
  requireVisibleCitations: boolean;
  permitCommunityEvidence: boolean;
  reviewRequiredForLibraryWriteback: boolean;
};
```

**Policy examples:**

| Class | Allowed source preference | Community evidence rule |
|---|---|---|
| Medical | `cdc.gov`, `nih.gov`, `who.int`, peer-reviewed publishers, professional societies, official hospital/academic medical centers | May provide experience context only; never prove a diagnosis, treatment effectiveness, or safety claim. |
| Legal | Government, court, bar association, regulator, official legal-aid/provider pages | May describe experience only; never establish legal accuracy. |
| Safety/emergency | Official emergency management, meteorological, government agencies | Never substitute community posts for an official warning. |
| Culture/music | Reputable journalism, public biographies, artist/label pages, charts, libraries, museums, academic/cultural institutions | May be included if labeled as community perspective or opinion. |
| Vintage cars/hobbies | Clubs, museums, manufacturers, official events, reputable specialist press, verified businesses | Community signals are permitted and should be labeled as such. |

## 5. The Library Is a Governed Memory, Not an Automatic Dump

Every web search must **not** become a Library entry. This is the correction that protects credibility.

### 5.1 Four evidence states

| State | May answer the current user? | May appear in Library? | May ground a future answer? |
|---|---:|---:|---:|
| `ephemeral_web_evidence` | Yes, with citations | No | No, unless promoted |
| `candidate_evidence` | Yes, with citations | Not publicly | No |
| `verified_library_evidence` | Yes | Yes | Yes, within scope |
| `community_evidence_pending_review` | Only as clearly labeled community input | Not as verified | No |

### 5.2 Promotion rule

A web result becomes `candidate_evidence` only if it is reusable, non-personal, non-sensitive, and relevant beyond one private chat. It becomes verified Library evidence only after:

1. canonical URL normalization and de-duplication;
2. source-policy validation;
3. claim/topic relevance assessment;
4. evidence scope assignment (`verified_topic` or `destination_context`);
5. an automated or human review decision appropriate to the consequence level;
6. a recorded verification date and review trail.

Medical, legal, safety, and highly sensitive areas require the stricter review pathway. Do **not** allow organic chat traffic to write those subjects into the shared Library automatically.

### 5.3 Preserve source boundaries in the UI

Every Kinfolk answer and Library panel must clearly distinguish:

```text
Verified Library evidence
Live web sources
MWM verified business data
Community experience / feedback
Kinfolk’s conversational synthesis
```

This solves the current Phuket problem and prevents future problems where a seed description, business comment, or social conversation looks like medical or historical proof.

## 6. Data Model

Keep the existing Library tables where possible. Add scoped, auditable extensions rather than rewriting the platform.

```ts
type ResearchRun = {
  id: string;
  userId: string | null;
  conversationId: string;
  intent: string;
  sourcePolicyId: string;
  searchMode: string;
  queriedAt: Date;
  provider: string | null;
  externalSearchUsed: boolean;
  citationCount: number;
  retentionClass: 'ephemeral' | 'analytics_aggregated' | 'library_candidate';
};

type ResearchSource = {
  id: string;
  researchRunId: string;
  canonicalUrl: string;
  title: string | null;
  publisher: string | null;
  sourceTier: 'authoritative' | 'professional' | 'credible_general' | 'community';
  retrievedAt: Date;
  citationUsed: boolean;
};

type KnowledgeTopicSource = {
  id: string;
  topicId: string;
  sourceId: string;
  scope: 'verified_topic' | 'destination_context';
  confidence: 'verified' | 'high' | 'community';
  status: 'active' | 'pending_review' | 'archived';
  claim: string | null;
  evidenceSection: string | null;
  lastVerified: Date | null;
};

type UserLearningScope = {
  userId: string;
  category: string;
  allowedForPrivateHelp: boolean;
  allowedForRecommendations: boolean;
  allowedForCircleUse: boolean; // must default false for sensitive categories
  allowedForAnonymousAggregate: boolean;
  updatedAt: Date;
};
```

## 7. Privacy and Memory Rules

Kinfolk learns only within the user’s selected permissions. The more useful it becomes, the more important this is.

1. A sensitive search—HIV, fertility, infertility, mental health, divorce, immigration, finances, abuse, or other private concern—must never leak into a Circle, friend connection, notification, business-facing insight, or shared household view.
2. A single search does not create a life-event inference. Searching divorce must not generate singles-event suggestions, especially where a spouse could see them.
3. A user’s private learning profile must be separate from their Circle-facing profile and from any connected business-owner persona.
4. Anonymous demand signals require user opt-in, minimum cohort thresholds, sensitive-topic exclusions, and no reverse-identification path.
5. For medical questions, use only the user’s explicitly permitted health preference scope. Do not use a private health question to retarget restaurants, events, or social content.

## 8. Cultural Fluency and Tone

Kinfolk should sound like a knowledgeable, warm cousin—not a caricature and not a character voice.

- It may adapt warmth, formality, brevity, regional language, and profanity tolerance only when the user opts in.
- It must switch to clear, non-performative language for safety, legal, medical, and emergency content.
- It may use a more relaxed tone for a music question or a travel itinerary; it should use a more precise tone for a business-owner analysis or a health explanation.
- Tone is separate from evidence. Cultural fluency must never lower the source standard for a high-stakes claim.

## 9. Implementation Phases

### Phase 0 — Repair current Library integrity

1. Apply the Library source-mapping ticket already issued: remove duplicate Phuket parent mappings, seed or mark empty child topics, and separate direct versus destination-context sources.
2. Do not call a topic a completed Book when its evidence state is `overview_pending_sources`.
3. Audit the 125 currently unsourced Travel/regional topics and build a prioritized source-backfill queue.

### Phase 1 — Universal Kinfolk chat and citations

1. Keep `/api/kinfolk/chat` as the chat entry point.
2. Add the Request Router and source-policy engine server-side.
3. Add the web-research provider adapter using one primary provider.
4. Render clickable citations and source labels in the Kinfolk response UI. The OpenAI web-search documentation requires citations from web results to be clearly visible and clickable when displayed to users. [1]
5. Log request IDs, policy IDs, source counts, provider status, and latency. Never log sensitive query text in operational logs.

### Phase 2 — Governed Library enrichment

1. Store eligible research as candidate evidence, not automatic published Library content.
2. Build a reviewer workflow for high-stakes and shared-library promotion.
3. Add source freshness/review dates and a re-verification queue.
4. Add canonical URL de-duplication and source-scoping constraints.

### Phase 3 — Community and business intelligence, with boundaries

1. Allow opt-in, non-sensitive aggregate demand signals to connect users, businesses, creators, and content opportunities.
2. Keep community feedback in a distinct evidence class, separate from professional/medical/legal proof.
3. Allow business-owner insight only from aggregate, privacy-safe patterns; never expose a member’s sensitive question, identity, or private search history.

## 10. Required Acceptance Tests

| Test | Expected outcome |
|---|---|
| “What is 12 times 8?” | Direct answer; no unnecessary web search. |
| “Who is the best rapper from Philadelphia?” | Conversational, transparent answer; recognizes subjectivity; can use credible culture/music sources if freshness or detail is requested. |
| “What should I ask my doctor about diabetes?” | High-stakes policy applies; cites authoritative health sources; no social-media evidence; clear informational boundary. |
| “Find a vintage car club near me.” | Uses user location only if permitted; combines live search and MWM/verified community discovery with labeled provenance. |
| “Find an Ethiopian restaurant in Phuket.” | Separates directory results, community feedback, and Library/destination evidence; does not claim an unverified listing exists. |
| Private fertility/divorce search | Does not surface in Circles, partner-visible suggestions, creator/business insights, or unrelated recommendations. |
| Kata Beach Library panel | Shows direct child evidence or an explicit verification-in-progress state; parent Phuket context is labeled separately. |
| Provider outage | Kinfolk gives a clear temporary-unavailable message, logs a request ID, and does not silently substitute fabricated citations. |

## 11. Replit’s Surgical-Change Protocol

For this implementation, Replit may change only the minimum required files in:

```text
server/kinfolk/*
server/research/*
server/library/*
shared/source-policy/*
client/src/features/kinfolk/*
client/src/features/library/*
relevant migrations and source-backfill jobs
```

Before deployment, Replit must provide:

1. a file-change list with the reason for every changed file;
2. a migration plan and rollback plan;
3. a production smoke-test record covering the acceptance tests above;
4. evidence that Login, Maps, Safety, business listings, and existing user sessions were not changed or regressed;
5. a clear source/citation screenshot for one medical-quality result, one cultural result, and one business-discovery result.

> **The goal is not to make Kinfolk sound like a search engine. The goal is to make it genuinely useful as a conversational cousin who knows when to answer simply, when to research deeply, when to cite carefully, and when to keep private information private.**

## References

[1]: https://developers.openai.com/api/docs/guides/tools-web-search "OpenAI API — Web search"
[2]: https://docs.tavily.com/documentation/api-reference/endpoint/search "Tavily Search API — Search endpoint"
[3]: https://exa.ai/docs/reference/search "Exa Search API — Search endpoint"

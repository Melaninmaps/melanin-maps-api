# Kinfolk Intelligence Architecture — Document Index

All specs filed 2026-08-11. No code has been written from these specs yet.
Implementation priority order is shown in the table below.

---

## Priority Order (founder-confirmed)

| Priority | Area | Status |
|---|---|---|
| 1 | **Business Page Recovery** — mirror the July 11 build | Task #240 (PENDING) |
| 2 | **Library evidence gap** — fix 125 empty topics, Phuket dedup | Task #255 (PENDING) |
| 3 | **Kinfolk Universal Router** — intent classification, live search, citations | Task #256 (PENDING) |
| 4 | **Privacy firewall** — sensitive queries never reach Circles/recommendations | Task #257 (PENDING) |
| 5 | **City readiness registry** — proactive tour-city prep, search-to-brick | Not yet tasked |
| 6 | **Adaptive tone & delivery** — explicit member delivery profiles, age-safe routing | Not yet tasked |

---

## Architecture Documents

### Core Kinfolk Intelligence

| File | What it defines |
|---|---|
| [KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md](./KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md) | Product definition: Kinfolk as general-purpose search + reasoning companion. Evidence calibration table (math → emergency). 9 implementation phases. 8 acceptance tests. |
| [KINFOLK_CONCEPTUAL_GAP_ANALYSIS.md](./KINFOLK_CONCEPTUAL_GAP_ANALYSIS.md) | Founder-authored gap analysis comparing current system to intended product. 8 missing conceptual layers. Confirms next build must be Router + evidence contract + governed pipeline + city readiness, NOT another prompt expansion. |
| [KINFOLK_SEARCH_ROUTER_CONTRACT.md](./KINFOLK_SEARCH_ROUTER_CONTRACT.md) | HTTP contract for `POST /api/kinfolk/route`. `KinfolkAnswerPlan` TypeScript types. Policy examples: diabetes, Philly rap, vintage cars, visa rules. Prompt templates. |
| [KINFOLK_EVIDENCE_SCHEMA.md](./KINFOLK_EVIDENCE_SCHEMA.md) | Multi-domain DB schema: `kinfolk_evidence_domains`, `kinfolk_source_policies`, `kinfolk_knowledge_source_mappings`, `kinfolk_research_runs`, `kinfolk_library_candidates`, `kinfolk_user_learning_scopes`. |
| [KINFOLK_ADAPTIVE_DELIVERY_RULES.md](./KINFOLK_ADAPTIVE_DELIVERY_RULES.md) | Delivery profiles: `detailLevel` (quick/standard/deep), tone by explicit opt-in only, branch/save rules, age-band safety gates, notification policy (6 conditions before any push). |

### Reference Implementations

| File | What it contains |
|---|---|
| [kinfolk-universal-search-router.reference.ts](./kinfolk-universal-search-router.reference.ts) | Complete TypeScript middleware: `createUniversalSearchRouterMiddleware`, JSON schema for structured output, `enforceHighConsequencePlan`, `applyAgeSafety`, `buildDeliveryPlan`, `openAIToolsForPlan`, `buildKinfolkAnswerInstructions`, `assertToolAllowed`. |
| [kinfolk-adaptive-tone-and-audience-filter.reference.ts](./kinfolk-adaptive-tone-and-audience-filter.reference.ts) | Complete TypeScript middleware: `loadAdaptiveDeliveryProfile`, `buildDeliveryInstructions`, `buildAdaptiveAnswerSystemPrompt`, `evaluateAudienceEligibility`. Express middleware integration pattern included. |

### Database Migrations (production-safe, additive only)

| File | What it creates |
|---|---|
| [kinfolk-universal-search-evidence.migration.sql](./kinfolk-universal-search-evidence.migration.sql) | All `kinfolk_*` evidence tables + additive columns on `knowledge_sources` + scoped source mapping view. **Requires Supabase RLS adaptation for Railway/plain PostgreSQL before running.** |
| [kinfolk-tour-city-readiness-search-to-brick.migration.sql](./kinfolk-tour-city-readiness-search-to-brick.migration.sql) | City readiness tables: `kinfolk_city_readiness_profiles`, `kinfolk_city_readiness_scorecards`, `kinfolk_city_readiness_blockers`, `kinfolk_city_research_tasks`, `kinfolk_search_brick_policies`, `kinfolk_search_brick_events`, `kinfolk_aggregate_demand_signals`. Three server-side RPCs enforce privacy at the database layer. **Also requires RLS adaptation.** |

### City Readiness & Search-to-Brick

| File | What it defines |
|---|---|
| [KINFOLK_TOUR_CITY_READINESS.md](./KINFOLK_TOUR_CITY_READINESS.md) | City readiness model: 6-stage lifecycle, 7 readiness gates (tester-ready vs launch-ready), search-to-brick pipeline, signal classification table, aggregate demand thresholds (k≥10, admin-configurable), proactive research queue, tester validation (not surveillance), city-specific acceptance suite, City Readiness Status API contract. |

### Business Page

| File | What it defines |
|---|---|
| [BUSINESS_PAGE_RECOVERY_BRIEF.md](./BUSINESS_PAGE_RECOVERY_BRIEF.md) | CRITICAL brief. Mirror the July 11 2026 2:00 AM build exactly. 13-element UI spec (hero → sticky action bar → Kinfolk widget). Back-end wiring for community safety scoring, vibe tags, confidence score (composite), media upload. 7 pre-deploy verification checks. |

### Library Content Audit

| File | What it contains |
|---|---|
| [library-missing-source-topics-2026-08-11.csv](./library-missing-source-topics-2026-08-11.csv) | 125 Travel/regional topics with zero verified sources as of 2026-08-11 (66 Travel, 7 Diaspora, 51 Country, 1 Geography). Complete inventory. |
| [library-phuket-source-inspection-sql.md](./library-phuket-source-inspection-sql.md) | Production SQL runbook: Phuket parent deduplication, child topic source gaps, all unsourced published topics. Steps 1–4 with exact queries. |

---

## Architecture State — What Is and Is Not Built

### What exists in production today
- MWM business catalog injection into Kinfolk (25 businesses, city or radius)
- User preferences, saved places, Kinfolk feedback, life journey in prompt
- Knowledge Graph context (topic names + source URLs — metadata only, not content)
- Library interests (followed topic names — not source content)
- City cultural profiles, vibe tags, cross-city bridge, twin recommendations
- Sensitive topic suppression (privacy guard)
- 12-turn session conversation history

### What the architecture adds (not yet built)
- **Router**: intent classification before retrieval — replaces single `buildSystemPrompt()` path
- **Evidence contract**: structured provenance object in every response (`sources[]`, scope, verification date)
- **Live web research**: OpenAI Responses API `web_search` tool for current information
- **Library content retrieval**: actual article/source text into the answer, not just URL metadata
- **Governed search-to-brick pipeline**: non-sensitive aggregate demand → research task → Library candidate → moderated publish
- **City readiness registry**: proactive coverage scoring per tour market, independent of any member's private behavior
- **Adaptive delivery**: explicit `detailLevel`, age-aware routing, notification eligibility engine
- **Cross-session memory**: durable narrative beyond 12-turn session window

---

## Non-Negotiable Implementation Rules

1. **No raw user message stored as a Library fact.** Searches are ephemeral by default.
2. **No city readiness based on private user behavior.** Tour priority comes from the roadmap.
3. **No sensitive demand markets.** Medical, fertility, divorce, immigration, financial distress never trigger outreach or public signals.
4. **No automatic fact publishing.** A search or model answer is not a Library fact.
5. **No unverified safety claims.** Community reports are separated from official/current alerts.
6. **No destructive build.** All changes are additive. Login, Maps, Safety Hub, existing business flows, Library UI, Circles, Connections, and global navigation must be unchanged.
7. **RLS in the migration SQL is Supabase syntax** (`auth.uid()`). Must be adapted to plain PostgreSQL / Railway before any migration runs.

---

## The Governing Principle

> **Kinfolk must operate as a privacy-safe, evidence-calibrated, adaptive intelligence system that turns approved aggregate demand and verified research into better future experiences — city by city, topic by topic, and never at the expense of a member's privacy or dignity.**

> **Every search can be a brick for the next person, but it is never a brick made out of somebody else's private life.**

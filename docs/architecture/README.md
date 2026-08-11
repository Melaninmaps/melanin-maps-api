# Kinfolk Universal Search & Evidence Architecture

These documents define the next-phase architecture for KinfolkAI as a universal, domain-aware search and reasoning companion — not a travel chatbot.

## Document Index

| File | Purpose |
|---|---|
| [KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md](./KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md) | Product definition, evidence calibration rules, request router, search implementation, Library governance, privacy rules, implementation phases, acceptance tests |
| [KINFOLK_SEARCH_ROUTER_CONTRACT.md](./KINFOLK_SEARCH_ROUTER_CONTRACT.md) | HTTP API contract, router decision schema, server-side enforcement rules, policy examples (diabetes / Philadelphia rap / vintage cars), prompt templates |
| [KINFOLK_EVIDENCE_SCHEMA.md](./KINFOLK_EVIDENCE_SCHEMA.md) | Multi-domain Library schema design: evidence domains, source policies, scoped mappings, claims, research runs, Library candidates, user learning scopes |
| [KINFOLK_ADAPTIVE_DELIVERY_RULES.md](./KINFOLK_ADAPTIVE_DELIVERY_RULES.md) | Delivery profiles, progressive disclosure, tone adaptation, branch/save rules, age-aware safety, notification policy |
| [kinfolk-universal-search-evidence.migration.sql](./kinfolk-universal-search-evidence.migration.sql) | Production-safe PostgreSQL migration: all `kinfolk_*` tables, additive columns on `knowledge_sources`, scoped source mapping view, RLS policies |
| [kinfolk-universal-search-router.reference.ts](./kinfolk-universal-search-router.reference.ts) | Reference TypeScript implementation of the Universal Search Router middleware |
| [library-missing-source-topics-2026-08-11.csv](./library-missing-source-topics-2026-08-11.csv) | 125 Travel/regional topics with no active source mappings as of 2026-08-11 |
| [library-phuket-source-inspection-sql.md](./library-phuket-source-inspection-sql.md) | Production SQL runbook: inspect Phuket topic-source mappings, find duplicates, identify all empty published topics |

## Implementation Phases

### Phase 0 — Library Integrity (Immediate)
- Remove duplicate Phuket parent source mappings
- Mark empty Travel child topics as `overview_pending_sources` rather than implying sourced content
- Separate `verified_topic` from `destination_context` source scope
- Run `library-phuket-source-inspection-sql.md` against production to confirm state

### Phase 1 — Universal Chat & Citations
- Add server-side Request Router (intent → source policy → retrieval plan)
- Add web-research provider adapter (OpenAI Responses API `web_search` tool — primary)
- Render clickable source citations in Kinfolk response UI
- Log `requestId`, `policyId`, `sourceCount`, `latencyMs` (never raw sensitive query text)

### Phase 2 — Governed Library Enrichment
- Store eligible web research as `candidate_evidence` only — never auto-publish
- Reviewer workflow for high-stakes domains (Medical, Legal, Financial, Safety)
- Canonical URL de-duplication, source freshness dates, re-verification queue

### Phase 3 — Community & Business Intelligence
- Opt-in, non-sensitive aggregate demand signals
- Business-owner insight from privacy-safe patterns only
- Community feedback stays in its own evidence class — never medical/legal proof

## Core Principle

> Kinfolk is a culturally aware, privacy-respecting, general-purpose search and reasoning companion — not a travel chatbot, not a medical database, and not a generic directory filter.

Evidence must be calibrated to the question:
- **Low-stakes** (math, music, hobbies): answer directly or conversationally
- **Medium-stakes** (travel, business, culture): verified directory + recommended citations
- **High-stakes** (medical, legal, financial, emergency): authoritative sources required, citations mandatory, community evidence excluded

## No-Touch Guardrail

These architecture changes must NOT alter: login/auth, session behavior, Maps, Safety Hub, existing business-listing rendering, Marketplace, Circles, Connections, or global navigation.

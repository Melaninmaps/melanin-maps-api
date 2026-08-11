---
name: Kinfolk Universal Search & Evidence Architecture
description: Founder-authored full architecture for Kinfolk as a universal domain-aware search companion. All specs saved to docs/architecture/ on 2026-08-11.
---

# Kinfolk Universal Search Architecture — Filed 2026-08-11

## What was filed

All 8 architecture documents saved to `docs/architecture/` in commit 8700637a:

| File | Contents |
|---|---|
| KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md | Product definition, evidence calibration table, request router, search implementation, Library governance, privacy rules, implementation phases, acceptance tests |
| KINFOLK_SEARCH_ROUTER_CONTRACT.md | HTTP API contract for `/api/kinfolk/route`, RouterPlan schema, server-side enforcement code, policy examples (diabetes/Philly rap/vintage cars), prompt templates |
| KINFOLK_EVIDENCE_SCHEMA.md | Multi-domain Library schema design: evidence domains, source policies, scoped mappings, claims, research runs, Library candidates, user learning scopes |
| KINFOLK_ADAPTIVE_DELIVERY_RULES.md | Delivery profiles, progressive disclosure (quick/standard/deep), tone adaptation, age-aware safety, notification policy |
| kinfolk-universal-search-evidence.migration.sql | Production-safe PostgreSQL migration — all `kinfolk_*` tables, additive columns on `knowledge_sources`, scoped source mapping view, RLS policies |
| kinfolk-universal-search-router.reference.ts | Complete reference TypeScript implementation of Universal Search Router middleware |
| library-missing-source-topics-2026-08-11.csv | 125 Travel/regional topics with zero verified sources |
| library-phuket-source-inspection-sql.md | SQL runbook for Phuket source mapping audit against production |

## Core principle

Kinfolk is a culturally aware, privacy-respecting, GENERAL-PURPOSE search and reasoning companion — not a travel chatbot, not a medical database. Can answer math, research diabetes, discuss Philly rap, find vintage car clubs, plan travel.

## Evidence calibration (not one rule for every query)

| Intent | Example | Source standard |
|---|---|---|
| general_knowledge | 12×8 | No search needed |
| culture_entertainment | Best rapper from Philly | Credible journalism/public sources; citations recommended |
| hobby_lifestyle | Find vintage car club | Specialist sites, clubs, verified directory + community |
| medical_health | Diabetes doctor questions | CDC/NIH/WHO-level; community evidence BLOCKED |
| legal_regulated | Employment lawyer | Gov/bar association only; community evidence BLOCKED |
| safety_emergency | Hurricane warning | Official alerts only; web_required; citations required |

## Implementation phases

- **Phase 0** (immediate): Fix Library integrity — deduplicate Phuket sources, mark 125 empty topics as `overview_pending_sources`
- **Phase 1**: Universal chat + citations — Request Router, web_search provider adapter, clickable citations
- **Phase 2**: Governed Library enrichment — candidate evidence, reviewer workflow, canonical URL dedup
- **Phase 3**: Community/business intelligence with privacy boundaries

## Task refs

- Task #255: Library evidence gap fix (Phase 0)
- Task #256: Universal search router + live web (Phase 1)
- Task #257: Privacy firewall for sensitive queries (cross-cutting)

## No-touch guardrail

Login/auth, session behavior, Maps, Safety Hub, existing business-listing rendering, Marketplace, Circles, Connections, global navigation MUST NOT be altered during implementation.

**Why:** These are the proven-stable, tester-facing parts of the platform. Changes there require separate release gates.
